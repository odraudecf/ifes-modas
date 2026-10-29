using IfesModas.Api.Dtos;
using IfesModas.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IfesModas.Api.Controllers;

/// <summary>Consulta pública das lojas e alteração dos dados da loja logada.</summary>
[ApiController]
[Route("api/lojas")]
[Produces("application/json")]
public class LojasController(LojaService lojas) : ControllerBase
{
    /// <summary>Lista as lojas agrupadas por estado e cidade (RF03). Público, sem token.</summary>
    /// <param name="uf">Filtro opcional por estado (ex.: ES).</param>
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<EstadoGrupoDto>>(StatusCodes.Status200OK)]
    public async Task<IReadOnlyList<EstadoGrupoDto>> Listar([FromQuery] string? uf, CancellationToken ct) =>
        await lojas.ListarAgrupadasAsync(uf, ct);

    /// <summary>Dados da loja, endereço, contatos e catálogo de uniformes (RF08, RF09). Público, sem token.</summary>
    /// <response code="404">Loja não encontrada.</response>
    [HttpGet("{id:int}")]
    [ProducesResponseType<LojaDetalheDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<LojaDetalheDto> Obter(int id, CancellationToken ct) =>
        await lojas.ObterDetalheAsync(id, ct);

    /// <summary>Dados da loja logada.</summary>
    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType<LojaDetalheDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<LojaDetalheDto> Minha(CancellationToken ct) =>
        await lojas.ObterDetalheAsync(User.LojaId(), ct);

    /// <summary>Altera os dados da loja logada (nome, contato, redes sociais e endereço).</summary>
    [Authorize]
    [HttpPut("me")]
    [ProducesResponseType<LojaDetalheDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<LojaDetalheDto> Atualizar(AtualizarLojaRequest req, CancellationToken ct) =>
        await lojas.AtualizarAsync(User.LojaId(), req, ct);
}
