using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixOrderTrackingAndDecimalPrecision : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_ProductDiscounts_DiscountsId",
                table: "ProductDiscounts",
                column: "DiscountsId");

            migrationBuilder.CreateIndex(
                name: "IX_Discounts_IsActive",
                table: "Discounts",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_Discounts_IsActive_DateFrom_DateTo",
                table: "Discounts",
                columns: new[] { "IsActive", "DateFrom", "DateTo" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ProductDiscounts_DiscountsId",
                table: "ProductDiscounts");

            migrationBuilder.DropIndex(
                name: "IX_Discounts_IsActive",
                table: "Discounts");

            migrationBuilder.DropIndex(
                name: "IX_Discounts_IsActive_DateFrom_DateTo",
                table: "Discounts");
        }
    }
}
