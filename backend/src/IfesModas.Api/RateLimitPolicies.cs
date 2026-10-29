namespace IfesModas.Api;

public static class RateLimitPolicies
{
    /// <summary>Limita tentativas de login/cadastro por IP (dificulta "chutar" senhas em massa).</summary>
    public const string Auth = "auth";
}
