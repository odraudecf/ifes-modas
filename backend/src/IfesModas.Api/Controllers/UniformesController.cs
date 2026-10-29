using IfesModas.Api.Dtos;
using IfesModas.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IfesModas.Api.Controllers;

/// <summary>Gerenciamento do catálogo da loja logada. Todas as rotas exigem token.</summary>
[ApiController]
[Authorize]
[Route("api/uniformes")]
[Produces("application/json")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
public class UniformesController(UniformeService uniformes) : ControllerBase
{
    /// <summary>Uniformes cadastrados pela loja logada.</summary>
    [HttpGet("minhas")]
    [ProducesResponseType<IReadOnlyList<UniformeDto>>(StatusCodes.Status200OK)]
    public async Task<IReadOnlyList<UniformeDto>> Minhas(CancellationToken ct) =>
        await uniformes.ListarDaLojaAsync(User.LojaId(), ct);

    /// <summary>Adiciona um uniforme ao catálogo (RF05).</summary>
    /// <remarks>Camisa: tamanho PP–XGG e modelo obrigatório. Bermuda: PP–XGG, sem modelo. Calça: tamanho numérico (30–60), sem modelo.</remarks>
    [HttpPost]
    [ProducesResponseType<UniformeDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<UniformeDto>> Criar(UniformeRequest req, CancellationToken ct)
    {
        var criado = await uniformes.CriarAsync(User.LojaId(), req, ct);
        return CreatedAtAction(nameof(Minhas), null, criado);
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
