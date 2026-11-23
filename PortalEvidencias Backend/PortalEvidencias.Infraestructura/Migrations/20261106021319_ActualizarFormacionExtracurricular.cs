using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalEvidencias.Infraestructura.Migrations
{
    /// <inheritdoc />
    public partial class ActualizarFormacionExtracurricular : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ActividadExtracurricularId",
                table: "Documentos",
                type: "int",
                nullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "FechaCreacion",
                table: "ActividadesExtracurriculares",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "SYSUTCDATETIME()",
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.AddColumn<decimal>(
                name: "Duracion",
                table: "ActividadesExtracurriculares",
                type: "decimal(8,2)",
                precision: 8,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Estado",
                table: "ActividadesExtracurriculares",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Modalidad",
                table: "ActividadesExtracurriculares",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Tipo",
                table: "ActividadesExtracurriculares",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "UnidadDuracion",
                table: "ActividadesExtracurriculares",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Documentos_ActividadExtracurricularId",
                table: "Documentos",
                column: "ActividadExtracurricularId",
                unique: true,
                filter: "[ActividadExtracurricularId] IS NOT NULL");

            migrationBuilder.AddCheckConstraint(
                name: "CK_ActividadesExtracurriculares_Duracion",
                table: "ActividadesExtracurriculares",
                sql: "[Duracion] IS NULL OR [Duracion] > 0");

            migrationBuilder.AddForeignKey(
                name: "FK_Documentos_ActividadesExtracurriculares_ActividadExtracurricularId",
                table: "Documentos",
                column: "ActividadExtracurricularId",
                principalTable: "ActividadesExtracurriculares",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Documentos_ActividadesExtracurriculares_ActividadExtracurricularId",
                table: "Documentos");

            migrationBuilder.DropIndex(
                name: "IX_Documentos_ActividadExtracurricularId",
                table: "Documentos");

            migrationBuilder.DropCheckConstraint(
                name: "CK_ActividadesExtracurriculares_Duracion",
                table: "ActividadesExtracurriculares");

            migrationBuilder.DropColumn(
                name: "ActividadExtracurricularId",
                table: "Documentos");

            migrationBuilder.DropColumn(
                name: "Duracion",
                table: "ActividadesExtracurriculares");

            migrationBuilder.DropColumn(
                name: "Estado",
                table: "ActividadesExtracurriculares");

            migrationBuilder.DropColumn(
                name: "Modalidad",
                table: "ActividadesExtracurriculares");

            migrationBuilder.DropColumn(
                name: "Tipo",
                table: "ActividadesExtracurriculares");

            migrationBuilder.DropColumn(
                name: "UnidadDuracion",
                table: "ActividadesExtracurriculares");

            migrationBuilder.AlterColumn<DateTime>(
                name: "FechaCreacion",
                table: "ActividadesExtracurriculares",
                type: "datetime2",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldDefaultValueSql: "SYSUTCDATETIME()");
        }
    }
}
