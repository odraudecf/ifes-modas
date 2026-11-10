using System.Diagnostics;
using IfesModas.Api.Dtos;
using Microsoft.AspNetCore.Mvc;

namespace IfesModas.Api.Controllers;

/// <summary>Qual versão do código está no ar. Pública, sem token.</summary>
[ApiController]
[Route("api/versao")]
[Produces("application/json")]
public class VersaoController(IConfiguration config, IHostEnvironment ambiente) : ControllerBase
{
    private static readonly DateTimeOffset IniciadaEm = Process.GetCurrentProcess().StartTime.ToUniversalTime();

    /// <summary>
    /// Commit publicado: compare com o último commit da main no GitHub. O Render preenche
    /// RENDER_GIT_COMMIT e RENDER_GIT_BRANCH em cada deploy; no computador aparece "local".
    /// </summary>
    [HttpGet]
    [ProducesResponseType<VersaoDto>(StatusCodes.Status200OK)]
    public VersaoDto Obter()
    {
        var commit = config["RENDER_GIT_COMMIT"] is { Length: > 0 } c ? c : "local";
        return new VersaoDto(
            commit,
            commit.Length > 7 ? commit[..7] : commit,
            config["RENDER_GIT_BRANCH"],
            ambiente.EnvironmentName,
            IniciadaEm);
    }
}
