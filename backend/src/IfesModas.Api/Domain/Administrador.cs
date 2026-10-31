namespace IfesModas.Api.Domain;

/// <summary>
/// Administrador do sistema. Entra pela mesma tela das lojas, mas com um nome de usuário (não CNPJ),
/// e pode alterar qualquer loja e o catálogo dela.
/// </summary>
public class Administrador
{
    public int Id { get; set; }

    /// <summary>Nome de usuário do login. Único, sem diferenciar maiúsculas de minúsculas.</summary>
    public string Usuario { get; set; } = string.Empty;

    /// <summary>Hash BCrypt da senha.</summary>
    public string SenhaHash { get; set; } = string.Empty;

    /// <summary>
    /// Enquanto for true, o admin só consegue trocar o próprio acesso: vale para o admin padrão
    /// (Admin/123) e para os admins criados por outro admin, que receberam uma senha provisória.
    /// </summary>
    public bool DeveTrocarAcesso { get; set; }

    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
}
