using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBestReviewedFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<float>(
                name: "AdminRating",
                table: "Products",
                type: "real",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsBestReviewed",
                table: "Products",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AdminRating",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "IsBestReviewed",
                table: "Products");
        }
    }
}
