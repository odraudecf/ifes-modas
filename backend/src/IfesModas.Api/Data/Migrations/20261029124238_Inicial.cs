using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace IfesModas.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class Inicial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "lojas",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    cnpj = table.Column<string>(type: "character varying(14)", maxLength: 14, nullable: false),
                    nome = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    telefone = table.Column<string>(type: "character varying(11)", maxLength: 11, nullable: false),
                    instagram = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    facebook = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    senha_hash = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    criado_em = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_lojas", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "enderecos",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    rua = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    numero = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    bairro = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    cidade = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    uf = table.Column<string>(type: "character(2)", fixedLength: true, maxLength: 2, nullable: false),
                    loja_id = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_enderecos", x => x.id);
                    table.ForeignKey(
                        name: "fk_enderecos_lojas_loja_id",
                        column: x => x.loja_id,
                        principalTable: "lojas",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "uniformes",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    tipo = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    modelo = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    genero = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    tamanho = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: false),
                    preco = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    loja_id = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_uniformes", x => x.id);
                    table.ForeignKey(
                        name: "fk_uniformes_lojas_loja_id",
                        column: x => x.loja_id,
                        principalTable: "lojas",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_enderecos_loja_id",
                table: "enderecos",
                column: "loja_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_enderecos_uf_cidade",
                table: "enderecos",
                columns: new[] { "uf", "cidade" });

            migrationBuilder.CreateIndex(
                name: "ix_lojas_cnpj",
                table: "lojas",
                column: "cnpj",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_uniformes_loja_id",
                table: "uniformes",
                column: "loja_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "enderecos");

            migrationBuilder.DropTable(
                name: "uniformes");

            migrationBuilder.DropTable(
                name: "lojas");
        }
    }
}
