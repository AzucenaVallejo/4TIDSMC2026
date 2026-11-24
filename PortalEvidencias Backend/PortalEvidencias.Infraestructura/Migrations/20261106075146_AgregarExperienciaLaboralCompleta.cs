using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalEvidencias.Infraestructura.Migrations
{
    /// <inheritdoc />
    public partial class AgregarExperienciaLaboralCompleta : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<DateTime>(
                name: "FechaCreacion",
                table: "ExperienciasLaborales",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "SYSUTCDATETIME()",
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.AlterColumn<string>(
                name: "Empresa",
                table: "ExperienciasLaborales",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(200)",
                oldMaxLength: 200);

            migrationBuilder.AlterColumn<string>(
                name: "Descripcion",
                table: "ExperienciasLaborales",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(3000)",
                oldMaxLength: 3000,
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Modalidad",
                table: "ExperienciasLaborales",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "Tipo",
                table: "ExperienciasLaborales",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<string>(
                name: "Ubicacion",
                table: "ExperienciasLaborales",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ExperienciaLaboralId",
                table: "Documentos",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Documentos_ExperienciaLaboralId",
                table: "Documentos",
                column: "ExperienciaLaboralId",
                unique: true,
                filter: "[ExperienciaLaboralId] IS NOT NULL");

            migrationBuilder.AddForeignKey(
                name: "FK_Documentos_ExperienciasLaborales_ExperienciaLaboralId",
                table: "Documentos",
                column: "ExperienciaLaboralId",
                principalTable: "ExperienciasLaborales",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Documentos_ExperienciasLaborales_ExperienciaLaboralId",
                table: "Documentos");

            migrationBuilder.DropIndex(
                name: "IX_Documentos_ExperienciaLaboralId",
                table: "Documentos");

            migrationBuilder.DropColumn(
                name: "Modalidad",
                table: "ExperienciasLaborales");

            migrationBuilder.DropColumn(
                name: "Tipo",
                table: "ExperienciasLaborales");

            migrationBuilder.DropColumn(
                name: "Ubicacion",
                table: "ExperienciasLaborales");

            migrationBuilder.DropColumn(
                name: "ExperienciaLaboralId",
                table: "Documentos");

            migrationBuilder.AlterColumn<DateTime>(
                name: "FechaCreacion",
                table: "ExperienciasLaborales",
                type: "datetime2",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldDefaultValueSql: "SYSUTCDATETIME()");

            migrationBuilder.AlterColumn<string>(
                name: "Empresa",
                table: "ExperienciasLaborales",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(150)",
                oldMaxLength: 150);

            migrationBuilder.AlterColumn<string>(
                name: "Descripcion",
                table: "ExperienciasLaborales",
                type: "nvarchar(3000)",
                maxLength: 3000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(1000)",
                oldMaxLength: 1000,
                oldNullable: true);
        }
    }
}
