using System.Security.Claims;
using System.Text;
using IfesModas.Api.Domain;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace IfesModas.Api.Services;

/// <summary>
/// Gera o JWT da loja logada. Ele substitui o "?nome_loja=...&amp;cnpj=..." que o sistema antigo
/// passava pela URL: o token é assinado com uma chave secreta, então não dá para forjá-lo editando a URL.
/// </summary>
public class TokenService(IOptions<JwtOptions> options, TimeProvider time)
{
    private readonly JwtOptions _opt = options.Value;

    public (string Token, DateTime ExpiraEm) Gerar(Loja loja)
    {
        var agora = time.GetUtcNow().UtcDateTime;
        var expiraEm = agora.AddHours(_opt.ExpiracaoHoras);

        var descriptor = new SecurityTokenDescriptor
        {
            Issuer = _opt.Issuer,
            Audience = _opt.Audience,
            IssuedAt = agora,
            NotBefore = agora,
            Expires = expiraEm,
            Subject = new ClaimsIdentity(
            [
                new Claim(JwtRegisteredClaimNames.Sub, loja.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Name, loja.Nome),
                new Claim("cnpj", loja.Cnpj)
            ]),
            SigningCredentials = new SigningCredentials(ChaveDeAssinatura(_opt.Key), SecurityAlgorithms.HmacSha256)
        };

        return (new JsonWebTokenHandler().CreateToken(descriptor), expiraEm);
    }

    public static SymmetricSecurityKey ChaveDeAssinatura(string key) => new(Encoding.UTF8.GetBytes(key));
}
