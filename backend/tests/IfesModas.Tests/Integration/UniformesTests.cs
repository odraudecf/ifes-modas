using System.Net;
using System.Net.Http.Json;
using IfesModas.Api.Domain;
using IfesModas.Api.Dtos;
using static IfesModas.Tests.Integration.TestHelpers;

namespace IfesModas.Tests.Integration;

public class UniformesTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    private static readonly UniformeRequest CamisaM = new(TipoUniforme.Camisa, ModeloCamisa.Padrao, Genero.Masculino, "M", 40m);

    [Fact]
    public async Task Criar_sem_token_devolve_401()
    {
        var resp = await factory.CreateClient().PostAsJsonAsync("/api/uniformes", CamisaM, Json);
        Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
    }

    [Fact]
    public async Task Token_forjado_devolve_401()
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new("Bearer", "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.assinatura-falsa");

        var resp = await client.GetAsync("/api/uniformes/minhas");

        Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
    }

    [Fact]
    public async Task Fluxo_completo_criar_alterar_excluir_e_aparecer_na_pagina_da_loja()
    {
        var (client, auth) = await factory.LojaLogadaAsync();

        // RF05: cria
        var criar = await client.PostAsJsonAsync("/api/uniformes", CamisaM, Json);
        Assert.Equal(HttpStatusCode.Created, criar.StatusCode);
        var criado = (await criar.Content.ReadFromJsonAsync<UniformeDto>(Json))!;

        // RF09: aparece na página pública da loja
        var pagina = await factory.CreateClient().GetFromJsonAsync<LojaDetalheDto>($"/api/lojas/{auth.Loja.Id}", Json);
        Assert.Contains(pagina!.Uniformes, u => u.Id == criado.Id && u.Preco == 40m);

        // RF06: altera
        var alterar = await client.PutAsJsonAsync($"/api/uniformes/{criado.Id}", CamisaM with { Tamanho = "gg", Preco = 45.5m }, Json);
        Assert.Equal(HttpStatusCode.OK, alterar.StatusCode);
        var alterado = (await alterar.Content.ReadFromJsonAsync<UniformeDto>(Json))!;
        Assert.Equal("GG", alterado.Tamanho);
        Assert.Equal(45.5m, alterado.Preco);

        // RF07: exclui
        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync($"/api/uniformes/{criado.Id}")).StatusCode);
        var minhas = await client.GetFromJsonAsync<List<UniformeDto>>("/api/uniformes/minhas", Json);
        Assert.DoesNotContain(minhas!, u => u.Id == criado.Id);
    }

    [Fact]
    public async Task Loja_nao_altera_nem_exclui_uniforme_de_outra_loja()
    {
        var (lojaA, _) = await factory.LojaLogadaAsync(nome: "Loja A");
        var (lojaB, _) = await factory.LojaLogadaAsync(nome: "Loja B");
        var resp = await lojaA.PostAsJsonAsync("/api/uniformes", CamisaM, Json);
        var daLojaA = (await resp.Content.ReadFromJsonAsync<UniformeDto>(Json))!;

        Assert.Equal(HttpStatusCode.Forbidden, (await lojaB.PutAsJsonAsync($"/api/uniformes/{daLojaA.Id}", CamisaM, Json)).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await lojaB.DeleteAsync($"/api/uniformes/{daLojaA.Id}")).StatusCode);
        Assert.DoesNotContain(await lojaB.GetFromJsonAsync<List<UniformeDto>>("/api/uniformes/minhas", Json) ?? [], u => u.Id == daLojaA.Id);
    }

    [Fact]
    public async Task Calca_com_tamanho_em_letra_devolve_400()
    {
        var (client, _) = await factory.LojaLogadaAsync();

        var resp = await client.PostAsJsonAsync("/api/uniformes", new UniformeRequest(TipoUniforme.Calca, null, Genero.Feminino, "M", 60m), Json);

        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }

    [Fact]
    public async Task Tipo_inexistente_no_json_devolve_400()
    {
        var (client, _) = await factory.LojaLogadaAsync();

        var resp = await client.PostAsJsonAsync("/api/uniformes", new { tipo = "Jaqueta", genero = "Masculino", tamanho = "M", preco = 10 });

        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }

    [Fact]
    public async Task Uniforme_inexistente_devolve_404()
    {
        var (client, _) = await factory.LojaLogadaAsync();
        Assert.Equal(HttpStatusCode.NotFound, (await client.DeleteAsync("/api/uniformes/999999")).StatusCode);
    }
}
