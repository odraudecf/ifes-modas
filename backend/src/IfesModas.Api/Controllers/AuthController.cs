using IfesModas.Api.Dtos;
using IfesModas.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace IfesModas.Api.Controllers;

/// <summary>Cadastro e login das lojas parceiras.</summary>
[ApiController]
[Route("api/auth")]
[EnableRateLimiting(RateLimitPolicies.Auth)]
[Produces("application/json")]
public class AuthController(AuthService auth) : ControllerBase
{
    /// <summary>Cadastra uma nova loja (RF01) e já devolve o token de acesso.</summary>
    /// <response code="201">Loja criada.</response>
    /// <response code="400">Campos inválidos (CNPJ, senha, UF, telefone...).</response>
    /// <response code="409">CNPJ já cadastrado.</response>
    [HttpPost("cadastro")]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AuthResponse>> Cadastrar(CadastroRequest req, CancellationToken ct)
    {
        var resposta = await auth.CadastrarAsync(req, ct);
        return CreatedAtAction(nameof(LojasController.Obter), "Lojas", new { id = resposta.Loja!.Id }, resposta);
    }

    /// <summary>Regras do cadastro neste ambiente. Em produção o CNPJ é sempre obrigatório.</summary>
    [HttpGet("regras")]
    [DisableRateLimiting]
    [ProducesResponseType<RegrasCadastroDto>(StatusCodes.Status200OK)]
    public RegrasCadastroDto Regras() => auth.Regras();

    /// <summary>Login com CNPJ e senha (RF02). Devolve um JWT para usar no botão "Authorize".</summary>
    /// <response code="200">Login efetuado.</response>
    /// <response code="401">CNPJ ou senha inválidos.</response>
    [HttpPost("login")]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest req, CancellationToken ct) =>
        Ok(await auth.LoginAsync(req, ct));
}
