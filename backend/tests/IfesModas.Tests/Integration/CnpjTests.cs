using System.Net;
using System.Net.Http.Json;
using System.Text;
using IfesModas.Api.Domain;
using IfesModas.Api.Dtos;
using Microsoft.AspNetCore.Mvc;
using static IfesModas.Tests.Integration.TestHelpers;

namespace IfesModas.Tests.Integration;

/// <summary>Consulta de CNPJ (GET /api/cnpj/{cnpj}) com as APIs externas simuladas.</summary>
public class ConsultaCnpjEndpointTests
{
    private const string RespostaBrasilApi = """
        {"razao_social":"LOJA EXEMPLO LTDA","nome_fantasia":"LOJA EXEMPLO","descricao_tipo_de_logradouro":"RUA",
         "logradouro":"A","numero":"10","bairro":"CENTRO","municipio":"ALEGRE","uf":"ES",
         "ddd_telefone_1":"2899990000","descricao_situacao_cadastral":"ATIVA"}
        """;

    private const string RespostaCnpja = """
        {"alias":"Loja Reserva","company":{"name":"LOJA RESERVA LTDA"},"status":{"text":"Ativa"},
         "address":{"street":"Rua B","number":"5","district":"Centro","city":"Alegre","state":"ES"},"phones":[]}
        """;

    private static HttpResponseMessage Json(string json) =>
        new(HttpStatusCode.OK) { Content = new StringContent(json, Encoding.UTF8, "application/json") };

    [Fact]
    public async Task Cnpj_encontrado_devolve_dados_prontos_para_o_formulario()
    {
        await using var factory = new ApiFactory
        {
            ApisCnpj = req => req.RequestUri!.Host == "brasilapi.com.br" ? Json(RespostaBrasilApi) : new(HttpStatusCode.NotFound)
        };

        var dados = await factory.CreateClient().GetFromJsonAsync<DadosCnpjDto>($"/api/cnpj/{NovoCnpj()}", TestHelpers.Json);

        Assert.Equal("Loja Exemplo", dados!.Nome);
        Assert.Equal("Rua A", dados.Endereco.Rua);
        Assert.Equal("BrasilAPI", dados.Fonte);
    }

    [Fact]
    public async Task Se_a_primeira_API_falha_usa_a_proxima()
    {
        await using var factory = new ApiFactory
        {
            ApisCnpj = req => req.RequestUri!.Host switch
            {
                "brasilapi.com.br" => new HttpResponseMessage(HttpStatusCode.InternalServerError),
                "open.cnpja.com" => Json(RespostaCnpja),
                _ => new HttpResponseMessage(HttpStatusCode.NotFound),
            }
        };

        var dados = await factory.CreateClient().GetFromJsonAsync<DadosCnpjDto>($"/api/cnpj/{NovoCnpj()}", TestHelpers.Json);

        Assert.Equal("Loja Reserva", dados!.Nome);
        Assert.Equal("CNPJá", dados.Fonte);
    }

    [Fact]
    public async Task Cnpj_que_nenhuma_API_conhece_devolve_404()
    {
        await using var factory = new ApiFactory(); // padrão: todas respondem 404

        var resp = await factory.CreateClient().GetAsync($"/api/cnpj/{NovoCnpj()}");

        Assert.Equal(HttpStatusCode.NotFound, resp.StatusCode);
    }

    [Fact]
    public async Task Todas_as_APIs_fora_do_ar_devolve_503()
    {
        await using var factory = new ApiFactory { ApisCnpj = _ => new HttpResponseMessage(HttpStatusCode.BadGateway) };

        var resp = await factory.CreateClient().GetAsync($"/api/cnpj/{NovoCnpj()}");

        Assert.Equal(HttpStatusCode.ServiceUnavailable, resp.StatusCode);
    }

    [Fact]
    public async Task Cnpj_invalido_devolve_400_sem_consultar_ninguem()
    {
        var consultou = false;
        await using var factory = new ApiFactory { ApisCnpj = _ => { consultou = true; return new HttpResponseMessage(HttpStatusCode.NotFound); } };

        var resp = await factory.CreateClient().GetAsync("/api/cnpj/11222333000182");

        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
        Assert.False(consultou);
    }
}

/// <summary>Regra de ambiente: produção exige CNPJ; o ambiente de teste aceita cadastro sem ele.</summary>
public class CadastroSemCnpjTests
{
    [Fact]
    public async Task Em_producao_cadastro_sem_cnpj_devolve_400_no_campo_cnpj()
    {
        await using var factory = new ApiFactory(); // ExigirCnpj = true, como em produção
        var client = factory.CreateClient();

        var resp = await client.PostAsJsonAsync("/api/auth/cadastro", Cadastro("") with { Cnpj = null }, Json);

        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
        var problema = await resp.Content.ReadFromJsonAsync<ValidationProblemDetails>(Json);
        Assert.Contains("cnpj", problema!.Errors.Keys);
        Assert.True((await client.GetFromJsonAsync<RegrasCadastroDto>("/api/auth/regras", Json))!.ExigirCnpj);
    }

    [Fact]
    public async Task No_ambiente_de_teste_cadastro_sem_cnpj_gera_um_cnpj_valido_que_serve_de_login()
    {
        await using var factory = new ApiFactory { ExigirCnpj = false };
        var client = factory.CreateClient();

        var resp = await client.PostAsJsonAsync("/api/auth/cadastro", Cadastro("") with { Cnpj = null }, Json);

        Assert.Equal(HttpStatusCode.Created, resp.StatusCode);
        var auth = await resp.Content.ReadFromJsonAsync<AuthResponse>(Json);
        Assert.True(Cnpj.EhValido(auth!.Loja!.Cnpj));

        var login = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(auth.Loja!.Cnpj, "senha123"), Json);
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        Assert.False((await client.GetFromJsonAsync<RegrasCadastroDto>("/api/auth/regras", Json))!.ExigirCnpj);
    }
}
