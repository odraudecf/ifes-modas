namespace IfesModas.Api.Domain;

/// <summary>
/// Regras de negócio do catálogo. No sistema antigo elas existiam só no JavaScript
/// do formulário (script.js); agora o back-end também valida, porque o front pode ser burlado.
/// </summary>
public static class RegrasUniforme
{
    public static readonly string[] TamanhosLetra = ["PP", "P", "M", "G", "GG", "XGG"];
    public const int TamanhoCalcaMinimo = 30;
    public const int TamanhoCalcaMaximo = 60;
    public const decimal PrecoMaximo = 9_999.99m;

    /// <summary>Devolve a lista de erros (vazia se o uniforme é válido), no formato campo → mensagem.</summary>
    public static Dictionary<string, string[]> Validar(TipoUniforme tipo, ModeloCamisa? modelo, string? tamanho, decimal preco)
    {
        var erros = new Dictionary<string, string[]>();
        var t = (tamanho ?? string.Empty).Trim().ToUpperInvariant();

        if (tipo == TipoUniforme.Calca)
        {
            if (!int.TryParse(t, out var n) || n < TamanhoCalcaMinimo || n > TamanhoCalcaMaximo)
                erros["tamanho"] = [$"Para calça, informe um número entre {TamanhoCalcaMinimo} e {TamanhoCalcaMaximo}."];
        }
        else if (!TamanhosLetra.Contains(t))
        {
            erros["tamanho"] = [$"Tamanho inválido. Use: {string.Join(", ", TamanhosLetra)}."];
        }

        if (tipo == TipoUniforme.Camisa && modelo is null)
            erros["modelo"] = ["Informe o modelo da camisa (Padrao ou Agropecuaria)."];
        if (tipo != TipoUniforme.Camisa && modelo is not null)
            erros["modelo"] = ["Somente camisas têm modelo."];

        if (preco <= 0 || preco > PrecoMaximo)
            erros["preco"] = [$"O preço deve estar entre R$ 0,01 e R$ {PrecoMaximo:N2}."];

        return erros;
    }

    /// <summary>Normaliza o tamanho para gravar ("m" → "M", " 42 " → "42").</summary>
    public static string NormalizarTamanho(string tamanho) => tamanho.Trim().ToUpperInvariant();

    /// <summary>Ordem de exibição dos tamanhos: PP, P, M... e calças em ordem numérica.</summary>
    public static int OrdemTamanho(string tamanho)
    {
        var i = Array.IndexOf(TamanhosLetra, tamanho);
        if (i >= 0) return i;
        return int.TryParse(tamanho, out var n) ? 100 + n : 1000;
    }
}
