using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalEvidencias.Infraestructura.Migrations
{
    /// <inheritdoc />
    public partial class AgregarCodigoAccesoEnlacePublico : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CodigoAcceso",
                table: "EnlacesPublicos",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_EnlacesPublicos_CodigoAcceso",
                table: "EnlacesPublicos",
                column: "CodigoAcceso",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_EnlacesPublicos_CodigoAcceso",
                table: "EnlacesPublicos");

            migrationBuilder.DropColumn(
                name: "CodigoAcceso",
                table: "EnlacesPublicos");
        }
    }
}
