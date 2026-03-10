export interface Order {
    id: number
    orderDate: string
    updatedAt: string
    buyerEmail: string
    orderNumber?: string
    shippingAddress: ShippingAddress
    deliveryMethod: string
    shippingPrice: number
    paymentSummary?: PaymentSummary
    orderItems: OrderItem[]
    subtotal: number
    discount?: number
    currency: string
    status: string
    paymentType: string
    paymentStatus: string
    deliveryStatus: string
    paymentIntentId?: string
    invoiceNumber?: string
    specialNotes?: string
    voucherCode?: string
    // couponCode?: string
    appliedDiscountType?: string
    tracking?: OrderTracking
    comments: OrderComment[]
    auditLogs: OrderAuditLog[]
    refundAmount?: number
    refundedAt?: string
    total: number
  }
  
  export interface ShippingAddress {
    name: string
    line1: string
    line2?: string
    city: string
    postalCode: string
    country: string
  }
  
  export interface PaymentSummary {
    last4: number
    brand: string
    expMonth: number
    expYear: number
  }
  
  export interface OrderItem {
    productId: number
    productName: string
    pictureUrl: string
    price: number
    quantity: number
  }

  export interface OrderTracking {
    courierName?: string
    trackingNumber?: string
    trackingUrl?: string
    estimatedDeliveryDate?: string
  }

  export interface OrderComment {
    id: number
    authorEmail: string
    content: string
    isInternal: boolean
    createdAt: string
  }

  export interface OrderAuditLog {
    id: number
    userEmail: string
    timestamp: string
    fieldChanged: string
    oldValue?: string
    newValue?: string
    comment?: string
    action: string
  }
  
  export interface OrderToCreate {
    cartId: string
    deliveryMethodId: number
    shippingAddress: ShippingAddress
    paymentSummary?: PaymentSummary
    discount?: number
    paymentType: string
    specialNotes?: string
    voucherCode?: string
    // couponCode?: string
  }

  export interface UpdateOrderStatusDto {
    orderStatus?: string
    paymentStatus?: string
    deliveryStatus?: string
    comment?: string
    sendEmailNotification?: boolean
  }

  export interface OrderTrackingDto {
    courierName?: string
    trackingNumber?: string
    trackingUrl?: string
    estimatedDeliveryDate?: string
  }

  export interface AddCommentDto {
    content: string
    isInternal: boolean
  }

  export interface SendEmailDto {
    emailType: string
    oldValue?: string
    adminNotes?: string
  }