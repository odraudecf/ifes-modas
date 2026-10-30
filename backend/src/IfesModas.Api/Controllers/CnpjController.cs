using IfesModas.Api.Dtos;
using IfesModas.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace IfesModas.Api.Controllers;

/// <summary>Consulta de CNPJ para preencher o cadastro da loja.</summary>
[ApiController]
[Route("api/cnpj")]
[EnableRateLimiting(RateLimitPolicies.Auth)] // as APIs gratuitas têm limite de uso: não deixamos um robô gastar tudo
[Produces("application/json")]
public class CnpjController(ConsultaCnpjService consulta) : ControllerBase
{
    /// <summary>Busca nome, telefone, endereço e situação de um CNPJ na Receita (via APIs públicas).</summary>
    /// <param name="cnpj">CNPJ com ou sem pontuação.</param>
    /// <param name="ct">Cancelamento da requisição.</param>
    /// <response code="200">Dados encontrados.</response>
    /// <response code="400">CNPJ inválido.</response>
    /// <response code="404">CNPJ não encontrado na Receita.</response>
    /// <response code="503">Nenhuma das APIs de consulta respondeu.</response>
    [HttpGet("{cnpj}")]
    [ProducesResponseType<DadosCnpjDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<DadosCnpjDto>> Consultar(string cnpj, CancellationToken ct) =>
        Ok(await consulta.ConsultarAsync(cnpj, ct));
}
