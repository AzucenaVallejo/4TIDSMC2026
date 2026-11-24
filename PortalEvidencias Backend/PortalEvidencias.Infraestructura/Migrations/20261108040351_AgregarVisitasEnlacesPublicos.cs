using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalEvidencias.Infraestructura.Migrations
{
    /// <inheritdoc />
    public partial class AgregarVisitasEnlacesPublicos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "VisitasEnlacesPublicos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EnlacePublicoId = table.Column<int>(type: "int", nullable: false),
                    TipoEvento = table.Column<int>(type: "int", nullable: false),
                    FechaEvento = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    IdentificadorVisitante = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VisitasEnlacesPublicos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VisitasEnlacesPublicos_EnlacesPublicos_EnlacePublicoId",
                        column: x => x.EnlacePublicoId,
                        principalTable: "EnlacesPublicos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_VisitasEnlacesPublicos_EnlacePublicoId_IdentificadorVisitante_TipoEvento",
                table: "VisitasEnlacesPublicos",
                columns: new[] { "EnlacePublicoId", "IdentificadorVisitante", "TipoEvento" },
                unique: true,
                filter: "[TipoEvento] = 2 AND [IdentificadorVisitante] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_VisitasEnlacesPublicos_EnlacePublicoId_TipoEvento_FechaEvento",
                table: "VisitasEnlacesPublicos",
                columns: new[] { "EnlacePublicoId", "TipoEvento", "FechaEvento" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "VisitasEnlacesPublicos");
        }
    }
}
