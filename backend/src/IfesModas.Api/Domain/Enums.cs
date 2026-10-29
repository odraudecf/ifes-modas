namespace IfesModas.Api.Domain;

/// <summary>Peças de uniforme vendidas pelas lojas (RF05).</summary>
public enum TipoUniforme
{
    Camisa,
    Bermuda,
    Calca
}

/// <summary>Modelo da camisa. Só faz sentido quando o tipo é <see cref="TipoUniforme.Camisa"/>.</summary>
public enum ModeloCamisa
{
    Padrao,
    Agropecuaria
}

public enum Genero
{
    Masculino,
    Feminino
}
