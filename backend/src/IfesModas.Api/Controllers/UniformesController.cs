using IfesModas.Api.Domain;
using IfesModas.Api.Dtos;
using IfesModas.Api.Services;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IfesModas.Api.Controllers;

/// <summary>
/// Consulta pública dos uniformes (sem token) e gerenciamento do catálogo da loja logada (com token).
/// O [Authorize] vale para a classe inteira; só as duas consultas públicas têm [AllowAnonymous].
/// </summary>
[ApiController]
[Authorize(Policy = Politicas.Loja)]
[Route("api/uniformes")]
[Produces("application/json")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public class UniformesController(UniformeService uniformes) : ControllerBase
{
    /// <summary>Listagem pública e paginada dos uniformes de todas as lojas, dos mais recentes para os mais antigos. Sem token.</summary>
    /// <param name="tipo">Filtro opcional: Camisa, Bermuda ou Calca.</param>
    /// <param name="tamanho">Filtro opcional: PP..XGG ou o número da calça.</param>
    /// <param name="lojaId">Filtro opcional: só os uniformes de uma loja.</param>
    /// <param name="pagina">Número da página (começa em 1).</param>
    /// <param name="porPagina">Itens por página (1 a 50).</param>
    /// <response code="400">Página ou tamanho de página fora do limite.</response>
    [AllowAnonymous]
    [HttpGet]
    [ProducesResponseType<PaginaDto<UniformePublicoDto>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<PaginaDto<UniformePublicoDto>> Listar(
        [FromQuery] TipoUniforme? tipo,
        [FromQuery] string? tamanho,
        [FromQuery] int? lojaId,
        [FromQuery, Range(1, int.MaxValue, ErrorMessage = "A página começa em 1.")] int pagina = 1,
        [FromQuery, Range(1, 50, ErrorMessage = "Escolha de 1 a 50 itens por página.")] int porPagina = 10,
        CancellationToken ct = default) =>
        await uniformes.ListarPublicoAsync(tipo, tamanho, lojaId, pagina, porPagina, ct);

    /// <summary>Detalhe público de um uniforme, com a loja que vende. Sem token.</summary>
    /// <response code="404">Uniforme não encontrado.</response>
    [AllowAnonymous]
    [HttpGet("{id:int}")]
    [ProducesResponseType<UniformePublicoDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<UniformePublicoDto> Obter(int id, CancellationToken ct) =>
        await uniformes.ObterPublicoAsync(id, ct);

    /// <summary>Uniformes cadastrados pela loja logada.</summary>
    [HttpGet("minhas")]
    [ProducesResponseType<IReadOnlyList<UniformeDto>>(StatusCodes.Status200OK)]
    public async Task<IReadOnlyList<UniformeDto>> Minhas(CancellationToken ct) =>
        await uniformes.ListarDaLojaAsync(User.LojaId(), ct);

    /// <summary>Adiciona um uniforme ao catálogo (RF05). O cabeçalho Location aponta para o detalhe público do item.</summary>
    /// <remarks>Camisa: tamanho PP–XGG e modelo obrigatório. Bermuda: PP–XGG, sem modelo. Calça: tamanho numérico (30–60), sem modelo.</remarks>
    [HttpPost]
    [ProducesResponseType<UniformeDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<UniformeDto>> Criar(UniformeRequest req, CancellationToken ct)
    {
        var criado = await uniformes.CriarAsync(User.LojaId(), req, ct);
        return CreatedAtAction(nameof(Obter), new { id = criado.Id }, criado); // Location: /api/uniformes/{id}
    }

    /// <summary>Altera um uniforme da loja logada (RF06).</summary>
    /// <response code="403">O uniforme pertence a outra loja.</response>
    /// <response code="404">Uniforme não encontrado.</response>
    [HttpPut("{id:int}")]
    [ProducesResponseType<UniformeDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<UniformeDto> Atualizar(int id, UniformeRequest req, CancellationToken ct) =>
        await uniformes.AtualizarAsync(User.LojaId(), id, req, ct);

    /// <summary>Exclui um uniforme da loja logada (RF07).</summary>
    /// <response code="204">Excluído.</response>
    /// <response code="403">O uniforme pertence a outra loja.</response>
    /// <response code="404">Uniforme não encontrado.</response>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Excluir(int id, CancellationToken ct)
    {
        await uniformes.ExcluirAsync(User.LojaId(), id, ct);
        return NoContent();
    }
}
