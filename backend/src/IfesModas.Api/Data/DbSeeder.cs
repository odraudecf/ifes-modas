using IfesModas.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace IfesModas.Api.Data;

/// <summary>
/// Dados de demonstração para o seminário. Só roda com o banco vazio, então nunca
/// sobrescreve lojas reais. Lojas e CNPJs são fictícios (os CNPJs passam na validação).
/// </summary>
public static class DbSeeder
{
    public const string SenhaDemo = "ifes2024";

    public static async Task SeedAsync(AppDbContext db, CancellationToken ct = default)
    {
        if (await db.Lojas.AnyAsync(ct)) return;

        var hash = BCrypt.Net.BCrypt.HashPassword(SenhaDemo);

        var lojas = new[]
        {
            NovaLoja("20240101000147", "Malharia Caparaó", "28999990001", "Rua Romualdo Nogueira da Gama", "120", "Centro", "Alegre", "ES", hash),
            NovaLoja("20240202000118", "Uniformes Guararema", "28999990002", "Rua Ascendino Rodrigues do Vale", "9", "Guararema", "Alegre", "ES", hash),
            NovaLoja("20240303000199", "Confecções Itapemirim", "28999990003", "Avenida Beira Rio", "455", "Centro", "Cachoeiro de Itapemirim", "ES", hash),
            NovaLoja("20240404000160", "Ateliê Carangola", "32999990004", "Praça Coronel Maximiano", "33", "Centro", "Carangola", "MG", hash),
            NovaLoja("20240505000130", "Bazar Itaperuna", "22999990005", "Rua 10 de Maio", "780", "Centro", "Itaperuna", "RJ", hash),
        };

        AdicionarCatalogo(lojas[0], 40m);
        AdicionarCatalogo(lojas[1], 37.5m);
        AdicionarCatalogo(lojas[2], 42m);
        AdicionarCatalogo(lojas[3], 45m);
        AdicionarCatalogo(lojas[4], 39.9m);

        db.Lojas.AddRange(lojas);
        await db.SaveChangesAsync(ct);
    }

    /// <summary>Usuário do primeiro acesso do admin. A senha precisa ser trocada logo no primeiro login.</summary>
    public const string AdminPadrao = "Admin";
    public const string SenhaAdminPadrao = "123";

    /// <summary>
    /// Garante que exista ao menos um administrador. Roda em toda subida (também em produção) e
    /// só cria o "Admin" se a tabela estiver vazia, então nunca recria nem sobrescreve.
    /// </summary>
    public static async Task SeedAdminAsync(AppDbContext db, CancellationToken ct = default)
    {
        if (await db.Administradores.AnyAsync(ct)) return;

        db.Administradores.Add(new Administrador
        {
            Usuario = AdminPadrao,
            SenhaHash = BCrypt.Net.BCrypt.HashPassword(SenhaAdminPadrao),
            DeveTrocarAcesso = true
        });
        await db.SaveChangesAsync(ct);
    }

    private static Loja NovaLoja(string cnpj, string nome, string telefone, string rua, string numero, string bairro,
        string cidade, string uf, string hash) => new()
    {
        Cnpj = cnpj,
        Nome = nome,
        Telefone = telefone,
        SenhaHash = hash,
        Endereco = new Endereco { Rua = rua, Numero = numero, Bairro = bairro, Cidade = cidade, Uf = uf }
    };

    private static void AdicionarCatalogo(Loja loja, decimal precoBase)
    {
        foreach (var genero in Enum.GetValues<Genero>())
        {
            foreach (var tamanho in new[] { "P", "M", "G" })
            {
                loja.Uniformes.Add(new Uniforme { Tipo = TipoUniforme.Camisa, Modelo = ModeloCamisa.Padrao, Genero = genero, Tamanho = tamanho, Preco = precoBase });
                loja.Uniformes.Add(new Uniforme { Tipo = TipoUniforme.Camisa, Modelo = ModeloCamisa.Agropecuaria, Genero = genero, Tamanho = tamanho, Preco = precoBase + 5 });
                loja.Uniformes.Add(new Uniforme { Tipo = TipoUniforme.Bermuda, Genero = genero, Tamanho = tamanho, Preco = precoBase - 5 });
            }

            foreach (var tamanho in genero == Genero.Masculino ? new[] { "40", "42", "44" } : ["36", "38", "40"])
                loja.Uniformes.Add(new Uniforme { Tipo = TipoUniforme.Calca, Genero = genero, Tamanho = tamanho, Preco = precoBase + 25 });
        }
    }
}
