namespace IfesModas.Api.Domain;

/// <summary>Loja parceira que vende uniformes do Ifes. É também o "usuário" que faz login.</summary>
public class Loja
{
    public int Id { get; set; }

    /// <summary>CNPJ só com os 14 caracteres (sem pontuação). Pode ser alfanumérico (regra da Receita a partir de 2026).</summary>
    public string Cnpj { get; set; } = string.Empty;

    public string Nome { get; set; } = string.Empty;

    /// <summary>Telefone só com dígitos, com DDD (10 ou 11 dígitos).</summary>
    public string Telefone { get; set; } = string.Empty;

    public string? Instagram { get; set; }
    public string? Facebook { get; set; }

    /// <summary>Hash BCrypt da senha. A senha em texto puro nunca é salva.</summary>
    public string SenhaHash { get; set; } = string.Empty;

    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

    public Endereco Endereco { get; set; } = null!;
    public List<Uniforme> Uniformes { get; set; } = [];
}
