using System.Text.RegularExpressions;

namespace IfesModas.Api.Domain;

/// <summary>
/// Validação e formatação de CNPJ, incluindo o CNPJ alfanumérico da Receita Federal
/// (novos CNPJs a partir de julho de 2026: 12 caracteres [0-9A-Z] + 2 dígitos verificadores).
/// O cálculo do dígito usa o valor ASCII do caractere menos 48, então para CNPJs só
/// numéricos o resultado é idêntico ao algoritmo tradicional.
/// </summary>
public static partial class Cnpj
{
    private static readonly int[] Pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    private static readonly int[] Pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    [GeneratedRegex("^[0-9A-Z]{12}[0-9]{2}$")]
    private static partial Regex Formato();

    /// <summary>Remove pontuação e espaços e coloca em maiúsculas. "11.222.333/0001-81" → "11222333000181".</summary>
    public static string Normalizar(string? cnpj) =>
        string.Concat((cnpj ?? string.Empty).Where(char.IsLetterOrDigit)).ToUpperInvariant();

    public static bool EhValido(string? cnpj)
    {
        var c = Normalizar(cnpj);
        if (!Formato().IsMatch(c)) return false;
        if (c.Distinct().Count() == 1) return false; // 00000000000000, 11111111111111...

        var dv1 = CalcularDigito(c[..12], Pesos1);
        var dv2 = CalcularDigito(c[..12] + dv1, Pesos2);
        return c[12] - '0' == dv1 && c[13] - '0' == dv2;
    }

    /// <summary>
    /// Gera um CNPJ numérico com dígitos verificadores corretos (matriz, "0001"), para lojas de teste
    /// cadastradas sem CNPJ. Começa com "99" só para ficar fácil de reconhecer; não há garantia de que
    /// não exista na Receita, por isso só o ambiente de teste usa.
    /// </summary>
    public static string GerarValido(Random sorteio)
    {
        var baseCnpj = $"99{sorteio.Next(0, 1_000_000):D6}0001";
        var dv1 = CalcularDigito(baseCnpj, Pesos1);
        var dv2 = CalcularDigito(baseCnpj + dv1, Pesos2);
        return $"{baseCnpj}{dv1}{dv2}";
    }

    /// <summary>"11222333000181" → "11.222.333/0001-81".</summary>
    public static string Formatar(string cnpj)
    {
        var c = Normalizar(cnpj);
        return c.Length != 14 ? cnpj : $"{c[..2]}.{c[2..5]}.{c[5..8]}/{c[8..12]}-{c[12..]}";
    }

    private static int CalcularDigito(string baseCnpj, int[] pesos)
    {
        var soma = 0;
        for (var i = 0; i < pesos.Length; i++)
            soma += (baseCnpj[i] - '0') * pesos[i];

        var resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    }
}
