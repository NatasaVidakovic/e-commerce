using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFavouriteAndReviewIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Brand",
                table: "Products",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Orders",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "PaymentIntentId",
                table: "Orders",
                type: "nvarchar(450)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "BuyerEmail",
                table: "Orders",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "BuyerEmail",
                table: "Favourites",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.Sql("IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Reviews_ParentCommentId' AND object_id = OBJECT_ID(N'[Reviews]')) CREATE INDEX [IX_Reviews_ParentCommentId] ON [Reviews] ([ParentCommentId]);");
            migrationBuilder.Sql("IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Products_Brand' AND object_id = OBJECT_ID(N'[Products]')) CREATE INDEX [IX_Products_Brand] ON [Products] ([Brand]);");
            migrationBuilder.Sql("IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Products_IsBestReviewed' AND object_id = OBJECT_ID(N'[Products]')) CREATE INDEX [IX_Products_IsBestReviewed] ON [Products] ([IsBestReviewed]);");
            migrationBuilder.Sql("IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Products_IsBestSelling' AND object_id = OBJECT_ID(N'[Products]')) CREATE INDEX [IX_Products_IsBestSelling] ON [Products] ([IsBestSelling]);");
            migrationBuilder.Sql("IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Products_IsSuggested' AND object_id = OBJECT_ID(N'[Products]')) CREATE INDEX [IX_Products_IsSuggested] ON [Products] ([IsSuggested]);");
            migrationBuilder.Sql("IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Products_Price' AND object_id = OBJECT_ID(N'[Products]')) CREATE INDEX [IX_Products_Price] ON [Products] ([Price]);");
            migrationBuilder.Sql("IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Products_ProductTypeId_Brand' AND object_id = OBJECT_ID(N'[Products]')) CREATE INDEX [IX_Products_ProductTypeId_Brand] ON [Products] ([ProductTypeId], [Brand]);");
            migrationBuilder.Sql("IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Orders_BuyerEmail' AND object_id = OBJECT_ID(N'[Orders]')) CREATE INDEX [IX_Orders_BuyerEmail] ON [Orders] ([BuyerEmail]);");
            migrationBuilder.Sql("IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Orders_BuyerEmail_Status' AND object_id = OBJECT_ID(N'[Orders]')) CREATE INDEX [IX_Orders_BuyerEmail_Status] ON [Orders] ([BuyerEmail], [Status]);");
            migrationBuilder.Sql("IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Orders_DeliveryStatus' AND object_id = OBJECT_ID(N'[Orders]')) CREATE INDEX [IX_Orders_DeliveryStatus] ON [Orders] ([DeliveryStatus]);");
            migrationBuilder.Sql("IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Orders_OrderDate' AND object_id = OBJECT_ID(N'[Orders]')) CREATE INDEX [IX_Orders_OrderDate] ON [Orders] ([OrderDate]);");
            migrationBuilder.Sql("IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Orders_PaymentIntentId' AND object_id = OBJECT_ID(N'[Orders]')) CREATE INDEX [IX_Orders_PaymentIntentId] ON [Orders] ([PaymentIntentId]);");
            migrationBuilder.Sql("IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Orders_PaymentStatus' AND object_id = OBJECT_ID(N'[Orders]')) CREATE INDEX [IX_Orders_PaymentStatus] ON [Orders] ([PaymentStatus]);");
            migrationBuilder.Sql("IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Orders_Status' AND object_id = OBJECT_ID(N'[Orders]')) CREATE INDEX [IX_Orders_Status] ON [Orders] ([Status]);");
            migrationBuilder.Sql("IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Favourites_BuyerEmail' AND object_id = OBJECT_ID(N'[Favourites]')) CREATE INDEX [IX_Favourites_BuyerEmail] ON [Favourites] ([BuyerEmail]);");
            migrationBuilder.Sql("IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Favourites_BuyerEmail_ProductId' AND object_id = OBJECT_ID(N'[Favourites]')) CREATE UNIQUE INDEX [IX_Favourites_BuyerEmail_ProductId] ON [Favourites] ([BuyerEmail], [ProductId]);");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Reviews_ParentCommentId' AND object_id = OBJECT_ID(N'[Reviews]')) DROP INDEX [IX_Reviews_ParentCommentId] ON [Reviews];");
            migrationBuilder.Sql("IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Products_Brand' AND object_id = OBJECT_ID(N'[Products]')) DROP INDEX [IX_Products_Brand] ON [Products];");
            migrationBuilder.Sql("IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Products_IsBestReviewed' AND object_id = OBJECT_ID(N'[Products]')) DROP INDEX [IX_Products_IsBestReviewed] ON [Products];");
            migrationBuilder.Sql("IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Products_IsBestSelling' AND object_id = OBJECT_ID(N'[Products]')) DROP INDEX [IX_Products_IsBestSelling] ON [Products];");
            migrationBuilder.Sql("IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Products_IsSuggested' AND object_id = OBJECT_ID(N'[Products]')) DROP INDEX [IX_Products_IsSuggested] ON [Products];");
            migrationBuilder.Sql("IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Products_Price' AND object_id = OBJECT_ID(N'[Products]')) DROP INDEX [IX_Products_Price] ON [Products];");
            migrationBuilder.Sql("IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Products_ProductTypeId_Brand' AND object_id = OBJECT_ID(N'[Products]')) DROP INDEX [IX_Products_ProductTypeId_Brand] ON [Products];");
            migrationBuilder.Sql("IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Orders_BuyerEmail' AND object_id = OBJECT_ID(N'[Orders]')) DROP INDEX [IX_Orders_BuyerEmail] ON [Orders];");
            migrationBuilder.Sql("IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Orders_BuyerEmail_Status' AND object_id = OBJECT_ID(N'[Orders]')) DROP INDEX [IX_Orders_BuyerEmail_Status] ON [Orders];");
            migrationBuilder.Sql("IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Orders_DeliveryStatus' AND object_id = OBJECT_ID(N'[Orders]')) DROP INDEX [IX_Orders_DeliveryStatus] ON [Orders];");
            migrationBuilder.Sql("IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Orders_OrderDate' AND object_id = OBJECT_ID(N'[Orders]')) DROP INDEX [IX_Orders_OrderDate] ON [Orders];");
            migrationBuilder.Sql("IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Orders_PaymentIntentId' AND object_id = OBJECT_ID(N'[Orders]')) DROP INDEX [IX_Orders_PaymentIntentId] ON [Orders];");
            migrationBuilder.Sql("IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Orders_PaymentStatus' AND object_id = OBJECT_ID(N'[Orders]')) DROP INDEX [IX_Orders_PaymentStatus] ON [Orders];");
            migrationBuilder.Sql("IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Orders_Status' AND object_id = OBJECT_ID(N'[Orders]')) DROP INDEX [IX_Orders_Status] ON [Orders];");
            migrationBuilder.Sql("IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Favourites_BuyerEmail' AND object_id = OBJECT_ID(N'[Favourites]')) DROP INDEX [IX_Favourites_BuyerEmail] ON [Favourites];");
            migrationBuilder.Sql("IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Favourites_BuyerEmail_ProductId' AND object_id = OBJECT_ID(N'[Favourites]')) DROP INDEX [IX_Favourites_BuyerEmail_ProductId] ON [Favourites];");

            migrationBuilder.AlterColumn<string>(
                name: "Brand",
                table: "Products",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AlterColumn<string>(
                name: "PaymentIntentId",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "BuyerEmail",
                table: "Orders",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AlterColumn<string>(
                name: "BuyerEmail",
                table: "Favourites",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");
        }
    }
}
