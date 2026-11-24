using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalEvidencias.Infraestructura.Migrations
{
    /// <inheritdoc />
    public partial class AmpliarDatosIntereses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Categoria",
                table: "Intereses",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CategoriaPersonalizada",
                table: "Intereses",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Frecuencia",
                table: "Intereses",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IncludeCV",
                table: "Intereses",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IncludePublic",
                table: "Intereses",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Tipo",
                table: "Intereses",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Categoria",
                table: "Intereses");

            migrationBuilder.DropColumn(
                name: "CategoriaPersonalizada",
                table: "Intereses");

            migrationBuilder.DropColumn(
                name: "Frecuencia",
                table: "Intereses");

            migrationBuilder.DropColumn(
                name: "IncludeCV",
                table: "Intereses");

            migrationBuilder.DropColumn(
                name: "IncludePublic",
                table: "Intereses");

            migrationBuilder.DropColumn(
                name: "Tipo",
                table: "Intereses");
        }
    }
}
