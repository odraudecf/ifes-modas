using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace IfesModas.Api.Errors;

/// <summary>Converte <see cref="ApiException"/> em ProblemDetails. Outras exceções viram 500 sem expor detalhes internos.</summary>
public class ApiExceptionHandler(IProblemDetailsService problemDetails, ILogger<ApiExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken ct)
    {
        ProblemDetails problem;

        if (exception is ApiException api)
        {
            problem = api.Erros is null
                ? new ProblemDetails { Status = api.Status, Title = api.Message }
                : new ValidationProblemDetails(api.Erros) { Status = api.Status, Title = api.Message };
        }
        else
        {
            logger.LogError(exception, "Erro não tratado em {Path}", context.Request.Path);
            problem = new ProblemDetails
            {
                Status = StatusCodes.Status500InternalServerError,
                Title = "Erro interno. Tente novamente em instantes."
            };
        }

        context.Response.StatusCode = problem.Status!.Value;
        return await problemDetails.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = context,
            ProblemDetails = problem,
            Exception = exception
        });
    }
}
