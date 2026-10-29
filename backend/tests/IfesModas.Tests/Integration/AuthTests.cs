using System.Net;
using System.Net.Http.Json;
using IfesModas.Api.Dtos;
using Microsoft.AspNetCore.Mvc;
using static IfesModas.Tests.Integration.TestHelpers;

namespace IfesModas.Tests.Integration;

public class AuthTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    [Fact]
    public async Task Cadastro_valido_devolve_201_com_token()
    {
        var resp = await _client.PostAsJsonAsync("/api/auth/cadastro", Cadastro(NovoCnpj()), Json);

        Assert.Equal(HttpStatusCode.Created, resp.StatusCode);
        var auth = await resp.Content.ReadFromJsonAsync<AuthResponse>(Json);
        Assert.False(string.IsNullOrWhiteSpace(auth!.Token));
        Assert.Equal("Loja Teste", auth.Loja.Nome);
    }

    [Fact]
    public async Task Cadastro_com_cnpj_invalido_devolve_400_com_campo_cnpj()
    {
        var resp = await _client.PostAsJsonAsync("/api/auth/cadastro", Cadastro("11.222.333/0001-82"), Json);

        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
        var problema = await resp.Content.ReadFromJsonAsync<ValidationProblemDetails>(Json);
        Assert.Contains("cnpj", problema!.Errors.Keys);
    }

    [Fact]
    public async Task Cadastro_com_senhas_diferentes_devolve_400()
    {
        var req = Cadastro(NovoCnpj()) with { ConfirmarSenha = "outra-senha" };

        var resp = await _client.PostAsJsonAsync("/api/auth/cadastro", req, Json);

        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }

    [Fact]
    public async Task Cadastro_com_uf_BH_devolve_400()
    {
        // O formulário antigo oferecia "BH" como estado.
        var req = Cadastro(NovoCnpj()) with { Endereco = new EnderecoDto("Rua A", "1", "Centro", "Belo Horizonte", "BH") };

        var resp = await _client.PostAsJsonAsync("/api/auth/cadastro", req, Json);

        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }

    [Fact]
    public async Task Cadastro_com_instagram_javascript_devolve_400()
    {
        var req = Cadastro(NovoCnpj()) with { Instagram = "javascript:alert(1)" };

        var resp = await _client.PostAsJsonAsync("/api/auth/cadastro", req, Json);

        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }

    [Fact]
    public async Task Cadastro_com_cnpj_repetido_devolve_409()
    {
        var cnpj = NovoCnpj();
        await _client.PostAsJsonAsync("/api/auth/cadastro", Cadastro(cnpj), Json);

        var resp = await _client.PostAsJsonAsync("/api/auth/cadastro", Cadastro(Cnpj_com_mascara(cnpj)), Json);

        Assert.Equal(HttpStatusCode.Conflict, resp.StatusCode);
    }

    [Fact]
    public async Task Login_com_cnpj_mascarado_e_senha_correta_devolve_200()
    {
        var cnpj = NovoCnpj();
        await _client.PostAsJsonAsync("/api/auth/cadastro", Cadastro(cnpj), Json);

        var resp = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest(Cnpj_com_mascara(cnpj), "senha123"), Json);

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
    }

    [Theory]
    [InlineData("senha-errada")]
    [InlineData("' OR '1'='1")]
    public async Task Login_com_senha_errada_devolve_401(string senha)
    {
        var cnpj = NovoCnpj();
        await _client.PostAsJsonAsync("/api/auth/cadastro", Cadastro(cnpj), Json);

        var resp = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest(cnpj, senha), Json);

        Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
    }

    [Fact]
    public async Task Login_de_cnpj_inexistente_devolve_401_com_mesma_mensagem()
    {
        var resp = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest(NovoCnpj(), "qualquer"), Json);

        Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
        var problema = await resp.Content.ReadFromJsonAsync<ProblemDetails>(Json);
        Assert.Equal("CNPJ ou senha inválidos.", problema!.Title);
    }

    private static string Cnpj_com_mascara(string c) => $"{c[..2]}.{c[2..5]}.{c[5..8]}/{c[8..12]}-{c[12..]}";
}

public class RateLimitTests
{
    [Fact]
    public async Task Muitas_tentativas_de_login_devolvem_429()
    {
        await using var factory = new ApiFactory { LimiteAuthPorMinuto = 3 };
        var client = factory.CreateClient();

        var status = new List<HttpStatusCode>();
        for (var i = 0; i < 5; i++)
            status.Add((await client.PostAsJsonAsync("/api/auth/login", new LoginRequest("11222333000181", "x"), Json)).StatusCode);

        Assert.Equal(HttpStatusCode.TooManyRequests, status[^1]);
    }
}
