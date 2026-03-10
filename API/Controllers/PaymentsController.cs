using System;
using API.Extensions;
using API.SignalR;
using Core.Entities;
using Core.Entities.OrderAggregate;
using Core.Interfaces;
using Core.Specifications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Stripe;

namespace API.Controllers;

public class PaymentsController(IPaymentService paymentService,
    IUnitOfWork unit,
    IHubContext<NotificationHub> hubContext,
    ILogger<PaymentsController> logger,
    IConfiguration config) : BaseApiController
{
    private readonly string _whSecret = config["StripeSettings:WhSecret"]!;

    [Authorize]
    [HttpPost("{cartId}")]
    public async Task<ActionResult> CreateOrUpdatePaymentIntent(string cartId)
    {
        var cart = await paymentService.CreateOrUpdatePaymentIntent(cartId);

        if (cart == null) return BadRequest("Problem with your cart on the API");

        return Ok(cart);
    }

    [HttpGet("delivery-methods")]
    public async Task<ActionResult<IReadOnlyList<DeliveryMethod>>> GetDeliveryMethods()
    {
        return Ok(await unit.Repository<DeliveryMethod>().ListAllAsync());
    }

    [HttpPost("webhook")]
    public async Task<IActionResult> StripeWebhook()
    {
        var json = await new StreamReader(Request.Body).ReadToEndAsync();

        try
        {
            var stripeEvent = ConstructStripeEvent(json);

            switch (stripeEvent.Type)
            {
                case "payment_intent.succeeded":
                    if (stripeEvent.Data.Object is PaymentIntent succeededIntent)
                        await HandlePaymentIntentSucceeded(succeededIntent);
                    break;

                case "payment_intent.payment_failed":
                    if (stripeEvent.Data.Object is PaymentIntent failedIntent)
                        await UpdateOrderPaymentStatus(failedIntent.Id, Core.Enums.PaymentStatus.Failed, OrderStatus.PaymentFailed);
                    break;

                case "payment_intent.canceled":
                    if (stripeEvent.Data.Object is PaymentIntent canceledIntent)
                        await UpdateOrderPaymentStatus(canceledIntent.Id, Core.Enums.PaymentStatus.Cancelled);
                    break;

                case "payment_intent.processing":
                    if (stripeEvent.Data.Object is PaymentIntent processingIntent)
                        await UpdateOrderPaymentStatus(processingIntent.Id, Core.Enums.PaymentStatus.Authorized);
                    break;

                case "charge.refunded":
                    if (stripeEvent.Data.Object is Charge refundedCharge)
                    {
                        var isPartial = refundedCharge.AmountRefunded < refundedCharge.Amount;
                        await UpdateOrderPaymentStatus(
                            refundedCharge.PaymentIntentId,
                            isPartial ? Core.Enums.PaymentStatus.PartiallyRefunded : Core.Enums.PaymentStatus.Refunded,
                            isPartial ? null : OrderStatus.Returned);
                    }
                    break;

                case "charge.dispute.created":
                    if (stripeEvent.Data.Object is Dispute dispute)
                        await UpdateOrderPaymentStatus(dispute.PaymentIntentId, Core.Enums.PaymentStatus.Chargeback);
                    break;

                default:
                    logger.LogInformation("Unhandled Stripe event type: {EventType}", stripeEvent.Type);
                    break;
            }

            return Ok();
        }
        catch (StripeException ex)
        {
            logger.LogError(ex, "Stripe webhook error");
            return StatusCode(StatusCodes.Status500InternalServerError, "Webhook error");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An unexpected error occurred");
            return StatusCode(StatusCodes.Status500InternalServerError, "An unexpected error occurred");
        }
    }

    private Event ConstructStripeEvent(string json)
    {
        try
        {
            return EventUtility.ConstructEvent(json, Request.Headers["Stripe-Signature"], _whSecret);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to construct Stripe event");
            throw new StripeException("Invalid signature");
        }
    }

    private async Task UpdateOrderPaymentStatus(string paymentIntentId, Core.Enums.PaymentStatus paymentStatus, OrderStatus? orderStatus = null)
    {
        var spec = new OrderSpecification(paymentIntentId, true);
        var order = await unit.Repository<Order>().GetEntityWithSpec(spec);

        if (order == null)
        {
            logger.LogWarning("Stripe webhook: order not found for PaymentIntent {IntentId}", paymentIntentId);
            return;
        }

        logger.LogInformation("Stripe auto-update order #{OrderId}: PaymentStatus {Old} → {New}",
            order.Id, order.PaymentStatus, paymentStatus);

        order.PaymentStatus = paymentStatus;

        if (orderStatus.HasValue)
            order.Status = orderStatus.Value;

        order.UpdatedAt = DateTime.UtcNow;
        await unit.Complete();

        var connectionId = NotificationHub.GetConnectionIdByEmail(order.BuyerEmail);
        if (!string.IsNullOrEmpty(connectionId))
        {
            await hubContext.Clients.Client(connectionId).SendAsync("OrderCompleteNotification",
                order.ToDto());
        }
    }

    private async Task HandlePaymentIntentSucceeded(PaymentIntent intent)
    {
        if (intent.Status == "succeeded")
        {
            var spec = new OrderSpecification(intent.Id, true);

            var order = await unit.Repository<Order>().GetEntityWithSpec(spec)
                        ?? throw new Exception("Order not found");

            var orderTotalInCents = (long)Math.Round(order.GetTotal() * 100,
            MidpointRounding.AwayFromZero);

            if (orderTotalInCents != intent.Amount)
            {
                order.Status = OrderStatus.PaymentMismatch;
                order.PaymentStatus = Core.Enums.PaymentStatus.Failed;
            }
            else
            {
                order.Status = OrderStatus.Confirmed;
                order.PaymentStatus = Core.Enums.PaymentStatus.Paid;
            }

            order.UpdatedAt = DateTime.UtcNow;
            await unit.Complete();

            var connectionId = NotificationHub.GetConnectionIdByEmail(order.BuyerEmail);

            if (!string.IsNullOrEmpty(connectionId))
            {
                await hubContext.Clients.Client(connectionId).SendAsync("OrderCompleteNotification",
                    order.ToDto());
            }
        }
    }
}