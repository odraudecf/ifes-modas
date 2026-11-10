using System.Net;
using System.Net.Http.Json;
using IfesModas.Api.Domain;
using IfesModas.Api.Dtos;
using Microsoft.AspNetCore.Hosting;
using static IfesModas.Tests.Integration.TestHelpers;

namespace IfesModas.Tests.Integration;

/// <summary>Rotas públicas da demonstração: versão publicada, listagem paginada e detalhe do uniforme.</summary>
public class PublicoTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private static UniformeRequest Camisa(string tamanho, decimal preco) =>
        new(TipoUniforme.Camisa, ModeloCamisa.Padrao, Genero.Masculino, tamanho, preco);

    [Fact]
    public async Task Versao_devolve_o_commit_que_o_Render_informa()
    {
        var commit = "0123456789abcdef0123456789abcdef01234567";
        var client = factory.WithWebHostBuilder(b => b
            .UseSetting("RENDER_GIT_COMMIT", commit)
            .UseSetting("RENDER_GIT_BRANCH", "main")).CreateClient();

        var versao = await client.GetFromJsonAsync<VersaoDto>("/api/versao", Json);

        Assert.Equal(commit, versao!.Commit);
        Assert.Equal("0123456", versao.CommitCurto);
        Assert.Equal("main", versao.Branch);
    }

    [Fact]
    public async Task Versao_fora_do_Render_mostra_local()
    {
        var versao = await factory.CreateClient().GetFromJsonAsync<VersaoDto>("/api/versao", Json);
        Assert.Equal("local", versao!.Commit);
    }

    [Fact]
    public async Task Criar_devolve_Location_do_detalhe_publico_que_abre_sem_token()
    {
        var (loja, auth) = await factory.LojaLogadaAsync(nome: "Loja Location");

        var resp = await loja.PostAsJsonAsync("/api/uniformes", Camisa("G", 52.9m), Json);
        var criado = (await resp.Content.ReadFromJsonAsync<UniformeDto>(Json))!;

        Assert.Equal(HttpStatusCode.Created, resp.StatusCode);
        Assert.EndsWith($"/api/uniformes/{criado.Id}", resp.Headers.Location!.ToString(), StringComparison.OrdinalIgnoreCase);

        var detalhe = await factory.CreateClient().GetFromJsonAsync<UniformePublicoDto>(resp.Headers.Location, Json);
        Assert.Equal(52.9m, detalhe!.Preco);
        Assert.Equal(auth.Loja!.Id, detalhe.Loja.Id);
        Assert.Equal("Loja Location", detalhe.Loja.Nome);
    }

    [Fact]
    public async Task Listagem_publica_e_paginada_e_mostra_os_mais_recentes_primeiro()
    {
        var (loja, auth) = await factory.LojaLogadaAsync(nome: "Loja Paginada");
        var ids = new List<int>();
        foreach (var tamanho in new[] { "P", "M", "G" })
        {
            var resp = await loja.PostAsJsonAsync("/api/uniformes", Camisa(tamanho, 40m), Json);
            ids.Add((await resp.Content.ReadFromJsonAsync<UniformeDto>(Json))!.Id);
        }
        var anonimo = factory.CreateClient();

        var pagina1 = await anonimo.GetFromJsonAsync<PaginaDto<UniformePublicoDto>>($"/api/uniformes?lojaId={auth.Loja!.Id}&porPagina=2", Json);
        var pagina2 = await anonimo.GetFromJsonAsync<PaginaDto<UniformePublicoDto>>($"/api/uniformes?lojaId={auth.Loja.Id}&porPagina=2&pagina=2", Json);

        Assert.Equal(3, pagina1!.Total);
        Assert.Equal(2, pagina1.TotalPaginas);
        Assert.Equal([ids[2], ids[1]], pagina1.Itens.Select(i => i.Id));
        Assert.Equal([ids[0]], pagina2!.Itens.Select(i => i.Id));
    }

    [Fact]
    public async Task Listagem_filtra_por_tipo_e_tamanho()
    {
        var (loja, auth) = await factory.LojaLogadaAsync(nome: "Loja Filtro");
        await loja.PostAsJsonAsync("/api/uniformes", Camisa("M", 40m), Json);
        await loja.PostAsJsonAsync("/api/uniformes", new UniformeRequest(TipoUniforme.Calca, null, Genero.Feminino, "42", 70m), Json);

        var calcas = await factory.CreateClient().GetFromJsonAsync<PaginaDto<UniformePublicoDto>>(
            $"/api/uniformes?lojaId={auth.Loja!.Id}&tipo=Calca&tamanho=42", Json);

        var item = Assert.Single(calcas!.Itens);
        Assert.Equal(TipoUniforme.Calca, item.Tipo);
    }

    [Theory]
    [InlineData("porPagina=500", "porPagina")]
    [InlineData("pagina=0", "pagina")]
    public async Task Paginacao_fora_do_limite_devolve_400_com_o_campo(string query, string campo)
    {
        var resp = await factory.CreateClient().GetAsync($"/api/uniformes?{query}");
        var problema = await resp.Content.ReadFromJsonAsync<Microsoft.AspNetCore.Mvc.ValidationProblemDetails>(Json);

        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
        Assert.Contains(problema!.Errors.Keys, k => k.Equals(campo, StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task Detalhe_de_uniforme_inexistente_devolve_404()
    {
        var resp = await factory.CreateClient().GetAsync("/api/uniformes/999999");
        Assert.Equal(HttpStatusCode.NotFound, resp.StatusCode);
    }
}
