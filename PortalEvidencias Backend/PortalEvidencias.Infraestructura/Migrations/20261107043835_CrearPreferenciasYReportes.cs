using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalEvidencias.Infraestructura.Migrations
{
    /// <inheritdoc />
    public partial class CrearPreferenciasYReportes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PreferenciasUsuarios",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    Tema = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    ColorAcento = table.Column<string>(type: "nvarchar(7)", maxLength: 7, nullable: false),
                    TamanoTexto = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    ReducirAnimaciones = table.Column<bool>(type: "bit", nullable: false),
                    DensidadCompacta = table.Column<bool>(type: "bit", nullable: false),
                    NotificacionesGenerales = table.Column<bool>(type: "bit", nullable: false),
                    RecordatoriosPerfil = table.Column<bool>(type: "bit", nullable: false),
                    AvisosEvidencias = table.Column<bool>(type: "bit", nullable: false),
                    Idioma = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: false),
                    FechaActualizacion = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PreferenciasUsuarios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PreferenciasUsuarios_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "ReportesProblemas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    Tipo = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Asunto = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    Estado = table.Column<int>(type: "int", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaActualizacion = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReportesProblemas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReportesProblemas_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_PreferenciasUsuarios_UsuarioId",
                table: "PreferenciasUsuarios",
                column: "UsuarioId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReportesProblemas_UsuarioId",
                table: "ReportesProblemas",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_ReportesProblemas_UsuarioId_FechaCreacion",
                table: "ReportesProblemas",
                columns: new[] { "UsuarioId", "FechaCreacion" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PreferenciasUsuarios");

            migrationBuilder.DropTable(
                name: "ReportesProblemas");
        }
    }
}
