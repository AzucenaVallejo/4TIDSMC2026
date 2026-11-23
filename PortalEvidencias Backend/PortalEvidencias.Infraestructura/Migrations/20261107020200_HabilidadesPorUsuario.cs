
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PortalEvidencias.Infraestructura.Migrations
{
    /// <inheritdoc />
    public partial class HabilidadesPorUsuario : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UsuariosHabilidades");

            migrationBuilder.DropIndex(
                name: "IX_Habilidades_Nombre",
                table: "Habilidades");

            migrationBuilder.AddColumn<string>(
                name: "Experiencia",
                table: "Habilidades",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Nivel",
                table: "Habilidades",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PorcentajeDominio",
                table: "Habilidades",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UsuarioId",
                table: "Habilidades",
                type: "int",
                nullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "UsuarioId",
                table: "Habilidades",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Habilidades_UsuarioId_Nombre",
                table: "Habilidades",
                columns: new[] { "UsuarioId", "Nombre" },
                unique: true);

            migrationBuilder.AddCheckConstraint(
                name: "CK_Habilidades_PorcentajeDominio",
                table: "Habilidades",
                sql: "[PorcentajeDominio] IS NULL OR ([PorcentajeDominio] >= 0 AND [PorcentajeDominio] <= 100)");

            migrationBuilder.AddForeignKey(
                name: "FK_Habilidades_Usuarios_UsuarioId",
                table: "Habilidades",
                column: "UsuarioId",
                principalTable: "Usuarios",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Habilidades_Usuarios_UsuarioId",
                table: "Habilidades");

            migrationBuilder.DropIndex(
                name: "IX_Habilidades_UsuarioId_Nombre",
                table: "Habilidades");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Habilidades_PorcentajeDominio",
                table: "Habilidades");

            migrationBuilder.DropColumn(
                name: "Experiencia",
                table: "Habilidades");

            migrationBuilder.DropColumn(
                name: "Nivel",
                table: "Habilidades");

            migrationBuilder.DropColumn(
                name: "PorcentajeDominio",
                table: "Habilidades");

            migrationBuilder.DropColumn(
                name: "UsuarioId",
                table: "Habilidades");

            migrationBuilder.CreateTable(
                name: "UsuariosHabilidades",
                columns: table => new
                {
                    UsuarioId = table.Column<int>(
                        type: "int",
                        nullable: false),

                    HabilidadId = table.Column<int>(
                        type: "int",
                        nullable: false),

                    Experiencia = table.Column<string>(
                        type: "nvarchar(30)",
                        maxLength: 30,
                        nullable: true),

                    Nivel = table.Column<string>(
                        type: "nvarchar(50)",
                        maxLength: 50,
                        nullable: true),

                    PorcentajeDominio = table.Column<int>(
                        type: "int",
                        nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey(
                        "PK_UsuariosHabilidades",
                        x => new { x.UsuarioId, x.HabilidadId });

                    table.CheckConstraint(
                        "CK_UsuariosHabilidades_Porcentaje",
                        "[PorcentajeDominio] IS NULL OR ([PorcentajeDominio] >= 0 AND [PorcentajeDominio] <= 100)");

                    table.ForeignKey(
                        name: "FK_UsuariosHabilidades_Habilidades_HabilidadId",
                        column: x => x.HabilidadId,
                        principalTable: "Habilidades",
                        principalColumn: "Id");

                    table.ForeignKey(
                        name: "FK_UsuariosHabilidades_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Habilidades_Nombre",
                table: "Habilidades",
                column: "Nombre",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UsuariosHabilidades_HabilidadId",
                table: "UsuariosHabilidades",
                column: "HabilidadId");
        }
    }
}
