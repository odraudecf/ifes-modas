namespace IfesModas.Api.Domain;

/// <summary>Papéis gravados no JWT (claim "role") e as políticas de autorização que usam eles.</summary>
public static class Papeis
{
    public const string Loja = "loja";
    public const string Admin = "admin";

    /// <summary>Claim presente no token do admin que ainda precisa trocar usuário e senha.</summary>
    public const string ClaimTrocarAcesso = "trocar_acesso";
}

public static class Politicas
{
    /// <summary>Rotas da loja logada (catálogo e dados da própria loja).</summary>
    public const string Loja = "Loja";

    /// <summary>Rotas de administração. Bloqueadas enquanto o admin não troca o acesso inicial.</summary>
    public const string Admin = "Admin";

    /// <summary>Só a troca de acesso do próprio admin (liberada mesmo com a troca pendente).</summary>
    public const string AdminConta = "AdminConta";
}
