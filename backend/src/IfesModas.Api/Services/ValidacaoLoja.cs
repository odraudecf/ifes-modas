using IfesModas.Api.Domain;
using IfesModas.Api.Dtos;

namespace IfesModas.Api.Services;

/// <summary>Validações compartilhadas entre cadastro e alteração de loja.</summary>
public static class ValidacaoLoja
{
    public static Dictionary<string, string[]> Validar(string telefone, string? instagram, string? facebook, EnderecoDto endereco)
    {
        var erros = new Dictionary<string, string[]>();

        var digitos = SoDigitos(telefone);
        if (digitos.Length is < 10 or > 11)
            erros["telefone"] = ["Telefone deve ter DDD + número (10 ou 11 dígitos)."];

        if (!LinkValido(instagram)) erros["instagram"] = ["Informe um link completo (https://...)."];
        if (!LinkValido(facebook)) erros["facebook"] = ["Informe um link completo (https://...)."];

        if (!Ufs.EhValida(endereco.Uf)) erros["endereco.uf"] = ["UF inválida."];

        return erros;
    }

    public static string SoDigitos(string? valor) => string.Concat((valor ?? string.Empty).Where(char.IsDigit));

    /// <summary>Texto vazio vira null, para não gravar "" no banco.</summary>
    public static string? Limpar(string? valor) => string.IsNullOrWhiteSpace(valor) ? null : valor.Trim();

    /// <summary>
    /// Só aceita http/https. Isso impede que alguém cadastre "javascript:alert(1)" como Instagram
    /// e o link execute código no navegador de quem visita a página da loja (XSS).
    /// </summary>
    private static bool LinkValido(string? link) =>
        string.IsNullOrWhiteSpace(link) ||
        (Uri.TryCreate(link.Trim(), UriKind.Absolute, out var uri) && (uri.Scheme == Uri.UriSchemeHttps || uri.Scheme == Uri.UriSchemeHttp));
}
