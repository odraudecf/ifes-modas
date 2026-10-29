namespace IfesModas.Tests.Integration;

public class CorsTests
{
    private static async Task<HttpResponseMessage> PreflightAsync(ApiFactory factory, string origem)
    {
        var req = new HttpRequestMessage(HttpMethod.Options, "/api/lojas");
        req.Headers.Add("Origin", origem);
        req.Headers.Add("Access-Control-Request-Method", "GET");
        return await factory.CreateClient().SendAsync(req);
    }

    [Fact]
    public async Task Host_sem_esquema_vindo_do_Render_libera_a_origem_https()
    {
        await using var factory = new ApiFactory { CorsOrigins = "ifes-modas.onrender.com" };

        var resp = await PreflightAsync(factory, "https://ifes-modas.onrender.com");

        Assert.Equal("https://ifes-modas.onrender.com", resp.Headers.GetValues("Access-Control-Allow-Origin").Single());
    }

    [Fact]
    public async Task Origem_desconhecida_nao_recebe_permissao()
    {
        await using var factory = new ApiFactory { CorsOrigins = "ifes-modas.onrender.com" };

        var resp = await PreflightAsync(factory, "https://site-malicioso.com");

        Assert.False(resp.Headers.Contains("Access-Control-Allow-Origin"));
    }
}
