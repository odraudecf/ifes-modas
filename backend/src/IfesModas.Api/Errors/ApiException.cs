namespace IfesModas.Api.Errors;

/// <summary>
/// Erro de regra de negócio com o status HTTP correspondente. Os serviços lançam essas exceções
/// e o <see cref="ApiExceptionHandler"/> as transforma em respostas ProblemDetails (RFC 9457).
/// </summary>
public class ApiException(int status, string titulo, IDictionary<string, string[]>? erros = null) : Exception(titulo)
{
    public int Status { get; } = status;
    public IDictionary<string, string[]>? Erros { get; } = erros;

    public static ApiException Validacao(IDictionary<string, string[]> erros) =>
        new(StatusCodes.Status400BadRequest, "Há campos inválidos.", erros);

    public static ApiException NaoEncontrado(string titulo) => new(StatusCodes.Status404NotFound, titulo);
    public static ApiException Conflito(string titulo) => new(StatusCodes.Status409Conflict, titulo);
    public static ApiException NaoAutorizado(string titulo) => new(StatusCodes.Status401Unauthorized, titulo);
    public static ApiException Proibido(string titulo) => new(StatusCodes.Status403Forbidden, titulo);
}
