namespace IfesModas.Api.Errors;

/// <summary>
/// O ASP.NET gera alguns erros sozinho (validação automática do [ApiController], 401 do JWT, 404 de rota)
/// com títulos em inglês. Aqui eles viram português; títulos escritos por nós passam sem mudança.
/// </summary>
public static class MensagensPadrao
{
    private static readonly HashSet<string> TitulosEmIngles =
    [
        "One or more validation errors occurred.", "Bad Request", "Unauthorized", "Forbidden",
        "Not Found", "Method Not Allowed", "Too Many Requests", "An error occurred while processing your request."
    ];

    public static string? Traduzir(int? status, string? titulo)
    {
        if (titulo is not null && !TitulosEmIngles.Contains(titulo)) return titulo;

        return status switch
        {
            400 => "Há campos inválidos.",
            401 => "Faça login para continuar.",
            403 => "Você não tem permissão para esta ação.",
            404 => "Não encontrado.",
            405 => "Método não permitido.",
            429 => "Muitas tentativas seguidas. Aguarde um minuto e tente de novo.",
            _ => "Erro interno. Tente novamente em instantes."
        };
    }
}
