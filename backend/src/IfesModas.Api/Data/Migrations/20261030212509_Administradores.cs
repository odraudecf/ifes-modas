using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace IfesModas.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class Administradores : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "administradores",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    usuario = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    senha_hash = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    deve_trocar_acesso = table.Column<bool>(type: "boolean", nullable: false),
                    criado_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_administradores", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_administradores_usuario",
                table: "administradores",
                column: "usuario",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "administradores");
        }
    }
}
