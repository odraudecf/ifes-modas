using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using IfesModas.Api.Data;
using IfesModas.Api.Dtos;
using IfesModas.Api.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace IfesModas.Tests.Integration;

/// <summary>
/// Sobe a API de verdade (Program.cs inteiro: JWT, validação, controllers) dentro do teste,
/// trocando só o Postgres por um banco em memória. Cada fábrica tem o próprio banco.
/// </summary>
public class ApiFactory : WebApplicationFactory<Program>
{
    private readonly string _banco = $"ifes-testes-{Guid.NewGuid()}";
    public int LimiteAuthPorMinuto { get; init; } = 1000;
    public string CorsOrigins { get; init; } = "http://localhost:5173";
    public bool ExigirCnpj { get; init; } = true;

    /// <summary>
    /// Respostas falsas das APIs de CNPJ (BrasilAPI, CNPJá, ReceitaWS): os testes nunca acessam a internet.
    /// Por padrão, todas respondem 404.
    /// </summary>
    public Func<HttpRequestMessage, HttpResponseMessage> ApisCnpj { get; set; } = _ => new HttpResponseMessage(HttpStatusCode.NotFound);

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("ConnectionStrings:Default", "Host=nao-usado");
        builder.UseSetting("Jwt:Key", "chave-de-teste-com-mais-de-32-caracteres!!");
        builder.UseSetting("Seed:Enabled", "false");
        builder.UseSetting("RateLimit:AuthPorMinuto", LimiteAuthPorMinuto.ToString());
        builder.UseSetting("Cors:Origins", CorsOrigins);
        builder.UseSetting("Cadastro:ExigirCnpj", ExigirCnpj.ToString());

        builder.ConfigureServices(services =>
        {
            // Remove o registro do Npgsql feito no Program.cs e registra o provedor em memória.
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<AppDbContext>>();
            services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase(_banco));

            services.AddHttpClient<ConsultaCnpjService>()
                .ConfigurePrimaryHttpMessageHandler(() => new HandlerFalso(req => ApisCnpj(req)));
        });
    }
}

/// <summary>Responde às requisições HTTP com a função dada, sem sair da máquina.</summary>
public class HandlerFalso(Func<HttpRequestMessage, HttpResponseMessage> responder) : HttpMessageHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct) =>
        Task.FromResult(responder(request));
}

public static class TestHelpers
{
    public static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

    private static int _contador = 1000;

    /// <summary>Gera um CNPJ válido e diferente a cada chamada (para os testes não colidirem).</summary>
    public static string NovoCnpj()
    {
        var baseCnpj = $"9{Interlocked.Increment(ref _contador):D7}0001";
        var dv1 = Digito(baseCnpj, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
        var dv2 = Digito(baseCnpj + dv1, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
        return $"{baseCnpj}{dv1}{dv2}";

        static int Digito(string s, int[] pesos)
        {
            var resto = pesos.Select((p, i) => (s[i] - '0') * p).Sum() % 11;
            return resto < 2 ? 0 : 11 - resto;
        }
    }

    public static CadastroRequest Cadastro(string cnpj, string cidade = "Alegre", string uf = "ES", string nome = "Loja Teste") => new(
        Nome: nome,
        Telefone: "(28) 99999-0000",
        Instagram: "https://instagram.com/lojateste",
        Facebook: null,
        Cnpj: cnpj,
        Senha: "senha123",
        ConfirmarSenha: "senha123",
        Endereco: new EnderecoDto("Rua A", "10", "Centro", cidade, uf));

    /// <summary>Cadastra uma loja e devolve um HttpClient já autenticado com o token dela.</summary>
    public static async Task<(HttpClient Client, AuthResponse Auth)> LojaLogadaAsync(
        this ApiFactory factory, string cidade = "Alegre", string uf = "ES", string nome = "Loja Teste")
    {
        var client = factory.CreateClient();
        var resp = await client.PostAsJsonAsync("/api/auth/cadastro", Cadastro(NovoCnpj(), cidade, uf, nome), Json);
        resp.EnsureSuccessStatusCode();
        var auth = (await resp.Content.ReadFromJsonAsync<AuthResponse>(Json))!;
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.Token);
        return (client, auth);
    }
}
