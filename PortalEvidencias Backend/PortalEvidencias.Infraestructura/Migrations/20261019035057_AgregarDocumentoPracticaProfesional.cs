using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalEvidencias.Infraestructura.Migrations
{
    /// <inheritdoc />
    public partial class AgregarDocumentoPracticaProfesional : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DocumentoId",
                table: "PracticasProfesionales",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PracticasProfesionales_DocumentoId",
                table: "PracticasProfesionales",
                column: "DocumentoId");

            migrationBuilder.AddForeignKey(
                name: "FK_PracticasProfesionales_Documentos_DocumentoId",
                table: "PracticasProfesionales",
                column: "DocumentoId",
                principalTable: "Documentos",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PracticasProfesionales_Documentos_DocumentoId",
                table: "PracticasProfesionales");

            migrationBuilder.DropIndex(
                name: "IX_PracticasProfesionales_DocumentoId",
                table: "PracticasProfesionales");

            migrationBuilder.DropColumn(
                name: "DocumentoId",
                table: "PracticasProfesionales");
        }
    }
}
