using IfesModas.Api.Domain;
using IfesModas.Api.Services;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace IfesModas.Tests.Unit;

public class TokenServiceTests
{
    private static readonly JwtOptions Opcoes = new() { Key = new string('k', 40), ExpiracaoHoras = 8 };
    private static readonly Loja Loja = new() { Id = 7, Nome = "Loja Teste", Cnpj = "11222333000181" };

    private static TokenValidationParameters Parametros(string key) => new()
    {
        ValidIssuer = Opcoes.Issuer,
        ValidAudience = Opcoes.Audience,
        IssuerSigningKey = TokenService.ChaveDeAssinatura(key)
    };

    [Fact]
    public async Task Token_gerado_e_valido_e_carrega_o_id_da_loja()
    {
        var (token, expiraEm) = new TokenService(Options.Create(Opcoes), TimeProvider.System).Gerar(Loja);

        var resultado = await new JsonWebTokenHandler().ValidateTokenAsync(token, Parametros(Opcoes.Key));

        Assert.True(resultado.IsValid);
        Assert.Equal("7", resultado.Claims[JwtRegisteredClaimNames.Sub]);
        Assert.Equal("11222333000181", resultado.Claims["cnpj"]);
        Assert.InRange(expiraEm, DateTime.UtcNow.AddHours(7.9), DateTime.UtcNow.AddHours(8.1));
    }

    [Fact]
    public async Task Token_assinado_com_outra_chave_e_rejeitado()
    {
        var (token, _) = new TokenService(Options.Create(Opcoes), TimeProvider.System).Gerar(Loja);

        var resultado = await new JsonWebTokenHandler().ValidateTokenAsync(token, Parametros(new string('x', 40)));

        Assert.False(resultado.IsValid);
    }

    [Fact]
    public void Senha_com_BCrypt_nao_fica_em_texto_puro_e_e_verificavel()
    {
        var hash = BCrypt.Net.BCrypt.HashPassword("minha-senha");

        Assert.NotEqual("minha-senha", hash);
        Assert.StartsWith("$2", hash); // prefixo do BCrypt
        Assert.True(BCrypt.Net.BCrypt.Verify("minha-senha", hash));
        Assert.False(BCrypt.Net.BCrypt.Verify("outra-senha", hash));
    }
}
