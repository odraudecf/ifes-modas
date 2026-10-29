namespace IfesModas.Api.Domain;

/// <summary>Endereço da loja (relação 1:1 com <see cref="Loja"/>).</summary>
public class Endereco
{
    public int Id { get; set; }
    public string Rua { get; set; } = string.Empty;

    /// <summary>Texto, e não int, para aceitar "S/N" e números como "12A".</summary>
    public string Numero { get; set; } = string.Empty;

    public string Bairro { get; set; } = string.Empty;
    public string Cidade { get; set; } = string.Empty;

    /// <summary>Sigla do estado (ex.: "ES"). Validada contra <see cref="Ufs"/>.</summary>
    public string Uf { get; set; } = string.Empty;

    public int LojaId { get; set; }
    public Loja Loja { get; set; } = null!;
}
