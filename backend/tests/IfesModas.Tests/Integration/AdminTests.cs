using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using IfesModas.Api.Data;
using IfesModas.Api.Domain;
using IfesModas.Api.Dtos;
using Microsoft.AspNetCore.Mvc;
using static IfesModas.Tests.Integration.TestHelpers;

namespace IfesModas.Tests.Integration;

/// <summary>Papel de administrador: primeiro acesso, troca obrigatória, separação de papéis e poderes sobre as lojas.</summary>
public class AdminTests
{
    private static async Task<AuthResponse> EntrarAsync(HttpClient client, string login, string senha)
    {
        var resp = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(login, senha), Json);
        resp.EnsureSuccessStatusCode();
        return (await resp.Content.ReadFromJsonAsync<AuthResponse>(Json))!;
    }

    private static HttpClient Com(ApiFactory factory, string token)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    /// <summary>Faz o primeiro acesso (Admin/123), troca o acesso e devolve um cliente de admin liberado.</summary>
    private static async Task<HttpClient> AdminLiberadoAsync(ApiFactory factory)
    {
        var inicial = await EntrarAsync(factory.CreateClient(), DbSeeder.AdminPadrao, DbSeeder.SenhaAdminPadrao);
        var troca = await Com(factory, inicial.Token).PutAsJsonAsync("/api/admin/conta",
            new AlterarAcessoRequest("chefe", DbSeeder.SenhaAdminPadrao, "senhaforte1", "senhaforte1"), Json);
        troca.EnsureSuccessStatusCode();
        var nova = (await troca.Content.ReadFromJsonAsync<AuthResponse>(Json))!;
        return Com(factory, nova.Token);
    }

    [Fact]
    public async Task Primeiro_acesso_do_admin_exige_trocar_usuario_e_senha_antes_do_resto()
    {
        await using var factory = new ApiFactory();

        var inicial = await EntrarAsync(factory.CreateClient(), "Admin", "123");
        Assert.Equal(Papeis.Admin, inicial.Papel);
        Assert.True(inicial.Admin!.DeveTrocarAcesso);

        var antes = Com(factory, inicial.Token);
        Assert.Equal(HttpStatusCode.Forbidden, (await antes.GetAsync("/api/admin/painel")).StatusCode);

        var troca = await antes.PutAsJsonAsync("/api/admin/conta", new AlterarAcessoRequest("diretoria", "123", "novaSenha9", "novaSenha9"), Json);
        Assert.Equal(HttpStatusCode.OK, troca.StatusCode);
        var nova = (await troca.Content.ReadFromJsonAsync<AuthResponse>(Json))!;
        Assert.False(nova.Admin!.DeveTrocarAcesso);

        Assert.Equal(HttpStatusCode.OK, (await Com(factory, nova.Token).GetAsync("/api/admin/painel")).StatusCode);
        // O acesso antigo deixou de valer e o novo usuário entra (sem diferenciar maiúsculas).
        Assert.Equal(HttpStatusCode.Unauthorized,
            (await factory.CreateClient().PostAsJsonAsync("/api/auth/login", new LoginRequest("Admin", "123"), Json)).StatusCode);
        Assert.Equal(Papeis.Admin, (await EntrarAsync(factory.CreateClient(), "DIRETORIA", "novaSenha9")).Papel);
    }

    [Fact]
    public async Task Trocar_acesso_com_senha_atual_errada_devolve_400()
    {
        await using var factory = new ApiFactory();
        var inicial = await EntrarAsync(factory.CreateClient(), "Admin", "123");

        var resp = await Com(factory, inicial.Token).PutAsJsonAsync("/api/admin/conta",
            new AlterarAcessoRequest("outro", "errada", "novaSenha9", "novaSenha9"), Json);

        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
        var problema = await resp.Content.ReadFromJsonAsync<ValidationProblemDetails>(Json);
        Assert.Contains("senhaatual", problema!.Errors.Keys, StringComparer.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Cada_papel_so_entra_nas_proprias_rotas()
    {
        await using var factory = new ApiFactory();
        var (loja, _) = await factory.LojaLogadaAsync();
        var admin = await AdminLiberadoAsync(factory);

        Assert.Equal(HttpStatusCode.Forbidden, (await loja.GetAsync("/api/admin/painel")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await admin.GetAsync("/api/uniformes/minhas")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await factory.CreateClient().GetAsync("/api/admin/painel")).StatusCode);
    }

    [Fact]
    public async Task Admin_altera_dados_e_catalogo_de_qualquer_loja()
    {
        await using var factory = new ApiFactory();
        var (_, auth) = await factory.LojaLogadaAsync(nome: "Loja Original");
        var lojaId = auth.Loja!.Id;
        var admin = await AdminLiberadoAsync(factory);

        var dados = new AtualizarLojaRequest("Loja Renomeada", "28999990000", null, null, new EnderecoDto("Rua B", "2", "Centro", "Alegre", "ES"));
        Assert.Equal(HttpStatusCode.OK, (await admin.PutAsJsonAsync($"/api/admin/lojas/{lojaId}", dados, Json)).StatusCode);

        var item = new UniformeRequest(TipoUniforme.Bermuda, null, Genero.Feminino, "M", 30m);
        var criado = await admin.PostAsJsonAsync($"/api/admin/lojas/{lojaId}/uniformes", item, Json);
        Assert.Equal(HttpStatusCode.Created, criado.StatusCode);
        var uniforme = (await criado.Content.ReadFromJsonAsync<UniformeDto>(Json))!;

        var alterado = await admin.PutAsJsonAsync($"/api/admin/lojas/{lojaId}/uniformes/{uniforme.Id}", item with { Preco = 33m }, Json);
        Assert.Equal(HttpStatusCode.OK, alterado.StatusCode);

        var pagina = await factory.CreateClient().GetFromJsonAsync<LojaDetalheDto>($"/api/lojas/{lojaId}", Json);
        Assert.Equal("Loja Renomeada", pagina!.Nome);
        Assert.Contains(pagina.Uniformes, u => u.Id == uniforme.Id && u.Preco == 33m);

        Assert.Equal(HttpStatusCode.NoContent, (await admin.DeleteAsync($"/api/admin/lojas/{lojaId}/uniformes/{uniforme.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await admin.PostAsJsonAsync("/api/admin/lojas/9999/uniformes", item, Json)).StatusCode);
    }

    [Fact]
    public async Task Admin_cria_admin_novo_e_usuario_repetido_devolve_409()
    {
        await using var factory = new ApiFactory();
        var admin = await AdminLiberadoAsync(factory);

        var criado = await admin.PostAsJsonAsync("/api/admin/usuarios/admins", new NovoAdminRequest("secretaria", "provisoria1", "provisoria1"), Json);
        Assert.Equal(HttpStatusCode.Created, criado.StatusCode);

        var repetido = await admin.PostAsJsonAsync("/api/admin/usuarios/admins", new NovoAdminRequest("SECRETARIA", "outraSenha1", "outraSenha1"), Json);
        Assert.Equal(HttpStatusCode.Conflict, repetido.StatusCode);

        // O novo admin entra com a senha provisória e também precisa trocar o acesso.
        var novo = await EntrarAsync(factory.CreateClient(), "secretaria", "provisoria1");
        Assert.True(novo.Admin!.DeveTrocarAcesso);

        var usuarios = await admin.GetFromJsonAsync<UsuariosDto>("/api/admin/usuarios", Json);
        Assert.Equal(2, usuarios!.Administradores.Count);
    }

    [Theory]
    [InlineData("ab")]                 // curto demais
    [InlineData("com espaço")]
    [InlineData("11222333000181")]     // parece CNPJ: confundiria o login
    public async Task Usuario_de_admin_invalido_devolve_400(string usuario)
    {
        await using var factory = new ApiFactory();
        var admin = await AdminLiberadoAsync(factory);

        var resp = await admin.PostAsJsonAsync("/api/admin/usuarios/admins", new NovoAdminRequest(usuario, "provisoria1", "provisoria1"), Json);

        Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
    }

    [Fact]
    public async Task Admin_cria_loja_que_consegue_entrar()
    {
        await using var factory = new ApiFactory();
        var admin = await AdminLiberadoAsync(factory);
        var cnpj = NovoCnpj();

        var resp = await admin.PostAsJsonAsync("/api/admin/usuarios/lojas", Cadastro(cnpj, nome: "Loja do Admin"), Json);

        Assert.Equal(HttpStatusCode.Created, resp.StatusCode);
        Assert.Equal(Papeis.Loja, (await EntrarAsync(factory.CreateClient(), cnpj, "senha123")).Papel);
    }

    [Fact]
    public async Task Painel_conta_lojas_cidades_itens_e_lojas_sem_catalogo()
    {
        await using var factory = new ApiFactory();
        var (loja1, _) = await factory.LojaLogadaAsync(cidade: "Alegre", uf: "ES");
        await factory.LojaLogadaAsync(cidade: "ALEGRE", uf: "ES"); // mesma cidade, outra grafia
        await factory.LojaLogadaAsync(cidade: "Carangola", uf: "MG");
        await loja1.PostAsJsonAsync("/api/uniformes", new UniformeRequest(TipoUniforme.Camisa, ModeloCamisa.Padrao, Genero.Masculino, "M", 40m), Json);
        await loja1.PostAsJsonAsync("/api/uniformes", new UniformeRequest(TipoUniforme.Camisa, ModeloCamisa.Padrao, Genero.Feminino, "P", 50m), Json);
        var admin = await AdminLiberadoAsync(factory);

        var painel = (await admin.GetFromJsonAsync<PainelDto>("/api/admin/painel", Json))!;

        Assert.Equal(3, painel.Totais.Lojas);
        Assert.Equal(2, painel.Totais.Cidades);
        Assert.Equal(2, painel.Totais.Estados);
        Assert.Equal(2, painel.Totais.Itens);
        Assert.Equal(2, painel.Totais.LojasSemCatalogo);
        Assert.Equal(2, painel.LojasPorCidade.Single(c => c.Uf == "ES").Lojas);

        var camisaPadrao = painel.ItensPorPeca.Single(p => p.Tipo == TipoUniforme.Camisa && p.Modelo == ModeloCamisa.Padrao);
        Assert.Equal((1, 1), (camisaPadrao.Masculino, camisaPadrao.Feminino));
        var preco = painel.PrecosPorPeca.Single();
        Assert.Equal((40m, 45m, 50m), (preco.Minimo, preco.Media, preco.Maximo));
    }
}
