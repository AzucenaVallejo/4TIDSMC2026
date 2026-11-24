using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalEvidencias.Infraestructura.Migrations
{
    /// <inheritdoc />
    public partial class AgregarCurpPerfil : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Curp",
                table: "Perfiles",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Curp",
                table: "Perfiles");
        }
    }
}
