namespace IfesModas.Api.Domain;

/// <summary>Item do catálogo de uma loja (RF05–RF07, RF09).</summary>
public class Uniforme
{
    public int Id { get; set; }
    public TipoUniforme Tipo { get; set; }

    /// <summary>Preenchido só para camisas; nulo para bermuda e calça.</summary>
    public ModeloCamisa? Modelo { get; set; }

    public Genero Genero { get; set; }

    /// <summary>"PP".."XGG" para camisa e bermuda; número (ex.: "42") para calça.</summary>
    public string Tamanho { get; set; } = string.Empty;

    /// <summary>numeric(10,2) no banco. O sistema antigo usava decimal(3,2), que limitava o preço a R$ 9,99.</summary>
    public decimal Preco { get; set; }

    public int LojaId { get; set; }
    public Loja Loja { get; set; } = null!;
}
