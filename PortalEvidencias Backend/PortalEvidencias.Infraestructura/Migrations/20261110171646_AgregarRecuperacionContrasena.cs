using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalEvidencias.Infraestructura.Migrations
{
    /// <inheritdoc />
    public partial class AgregarRecuperacionContrasena : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SolicitudesRecuperacionContrasena",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    CodigoHash = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    FechaExpiracionCodigo = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IntentosFallidos = table.Column<int>(type: "int", nullable: false),
                    FechaUltimoEnvio = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TokenRestablecimientoHash = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: true),
                    FechaExpiracionToken = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Estado = table.Column<int>(type: "int", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaVerificacion = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FechaCompletada = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SolicitudesRecuperacionContrasena", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SolicitudesRecuperacionContrasena_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SolicitudesRecuperacionContrasena_Estado",
                table: "SolicitudesRecuperacionContrasena",
                column: "Estado");

            migrationBuilder.CreateIndex(
                name: "IX_SolicitudesRecuperacionContrasena_UsuarioId",
                table: "SolicitudesRecuperacionContrasena",
                column: "UsuarioId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SolicitudesRecuperacionContrasena");
        }
    }
}
