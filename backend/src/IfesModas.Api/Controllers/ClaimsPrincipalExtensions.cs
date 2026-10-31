using System.Security.Claims;
using Microsoft.IdentityModel.JsonWebTokens;

namespace IfesModas.Api.Controllers;

public static class ClaimsPrincipalExtensions
{
    /// <summary>Id da loja logada, lido do claim "sub" do JWT (que foi assinado pelo servidor).</summary>
    public static int LojaId(this ClaimsPrincipal user) =>
        int.Parse(user.FindFirstValue(JwtRegisteredClaimNames.Sub)
                  ?? throw new InvalidOperationException("Token sem o claim 'sub'."));

    /// <summary>Id do administrador logado (mesmo claim "sub"; a política de autorização garante que é um admin).</summary>
    public static int AdminId(this ClaimsPrincipal user) => user.LojaId();
}
