using System.Net;
using System.Net.Http.Json;
using IfesModas.Api.Dtos;
using static IfesModas.Tests.Integration.TestHelpers;

namespace IfesModas.Tests.Integration;

public class LojasTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    [Fact]
    public async Task Rotas_publicas_funcionam_sem_token()
    {
        var (_, auth) = await factory.LojaLogadaAsync();
        var anonimo = factory.CreateClient();

        Assert.Equal(HttpStatusCode.OK, (await anonimo.GetAsync("/api/lojas")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await anonimo.GetAsync($"/api/lojas/{auth.Loja!.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await anonimo.GetAsync("/health")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await anonimo.GetAsync("/swagger/v1/swagger.json")).StatusCode);
    }

    [Fact]
    public async Task Listagem_agrupa_por_estado_e_cidade_com_ES_primeiro()
    {
        await factory.LojaLogadaAsync("Carangola", "MG", "Loja MG");
        await factory.LojaLogadaAsync("Alegre", "ES", "Loja Alegre 1");
        await factory.LojaLogadaAsync("alegre", "ES", "Loja Alegre 2"); // mesma cidade com outra caixa
        await factory.LojaLogadaAsync("Itaperuna", "RJ", "Loja RJ");

        var estados = await factory.CreateClient().GetFromJsonAsync<List<EstadoGrupoDto>>("/api/lojas", Json);

        Assert.Equal("ES", estados![0].Uf);
        Assert.Equal("Espírito Santo", estados[0].NomeEstado);
        var alegre = Assert.Single(estados[0].Cidades, c => c.Cidade.Equals("Alegre", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(alegre.Lojas, l => l.Nome == "Loja Alegre 1");
        Assert.Contains(alegre.Lojas, l => l.Nome == "Loja Alegre 2");
        Assert.Contains(estados, e => e.Uf == "MG");
        Assert.Contains(estados, e => e.Uf == "RJ");
    }

    [Fact]
    public async Task Filtro_por_uf_traz_so_aquele_estado()
    {
        await factory.LojaLogadaAsync("Itaperuna", "RJ", "Loja RJ filtro");

        var estados = await factory.CreateClient().GetFromJsonAsync<List<EstadoGrupoDto>>("/api/lojas?uf=rj", Json);

        Assert.All(estados!, e => Assert.Equal("RJ", e.Uf));
    }

    [Fact]
    public async Task Loja_inexistente_devolve_404() =>
        Assert.Equal(HttpStatusCode.NotFound, (await factory.CreateClient().GetAsync("/api/lojas/999999")).StatusCode);

    [Fact]
    public async Task Me_sem_token_devolve_401_com_mensagem_em_portugues()
    {
        var resp = await factory.CreateClient().GetAsync("/api/lojas/me");

        Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
        Assert.Contains("Faça login", await resp.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Validacao_automatica_responde_em_portugues()
    {
        var resp = await factory.CreateClient().PostAsJsonAsync("/api/auth/login", new { cnpj = "", senha = "" });

        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
        var corpo = await resp.Content.ReadAsStringAsync();
        Assert.Contains("Há campos inválidos.", corpo);
        Assert.Contains("Informe o CNPJ ou o usuário.", corpo);
    }

    [Fact]
    public async Task Detalhe_nao_expoe_hash_da_senha()
    {
        var (_, auth) = await factory.LojaLogadaAsync();

        var json = await factory.CreateClient().GetStringAsync($"/api/lojas/{auth.Loja!.Id}");

        Assert.DoesNotContain("senha", json, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Loja_altera_os_proprios_dados()
    {
        var (client, auth) = await factory.LojaLogadaAsync();
        var req = new AtualizarLojaRequest("Nome Novo", "28988887777", "https://instagram.com/novo", null,
            new EnderecoDto("Rua Nova", "S/N", "Vila", "Guaçuí", "ES"));

        var resp = await client.PutAsJsonAsync("/api/lojas/me", req, Json);

        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        var detalhe = await factory.CreateClient().GetFromJsonAsync<LojaDetalheDto>($"/api/lojas/{auth.Loja!.Id}", Json);
        Assert.Equal("Nome Novo", detalhe!.Nome);
        Assert.Equal("Guaçuí", detalhe.Endereco.Cidade);
        Assert.Equal("S/N", detalhe.Endereco.Numero);
    }
}
