using IfesModas.Api.Domain;
using IfesModas.Api.Dtos;
using IfesModas.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IfesModas.Api.Controllers;

/// <summary>
/// Administração: painel, lojas, catálogo de qualquer loja e usuários.
/// Exige token de administrador que já trocou o acesso inicial (senão 403).
/// </summary>
[ApiController]
[Authorize(Policy = Politicas.Admin)]
[Route("api/admin")]
[Produces("application/json")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public class AdminController(AdminService admin) : ControllerBase
{
    /// <summary>Números do painel: lojas por cidade, itens por peça e gênero, tamanhos, preços e lojas sem catálogo.</summary>
    [HttpGet("painel")]
    [ProducesResponseType<PainelDto>(StatusCodes.Status200OK)]
    public async Task<PainelDto> Painel(CancellationToken ct) => await admin.PainelAsync(ct);

    /// <summary>Lojas cadastradas, com busca opcional por nome, cidade ou CNPJ.</summary>
    /// <param name="busca">Parte do nome, da cidade ou do CNPJ.</param>
    /// <param name="ct">Cancelamento da requisição.</param>
    [HttpGet("lojas")]
    [ProducesResponseType<IReadOnlyList<AdminLojaDto>>(StatusCodes.Status200OK)]
    public async Task<IReadOnlyList<AdminLojaDto>> Lojas([FromQuery] string? busca, CancellationToken ct) =>
        await admin.ListarLojasAsync(busca, ct);

    /// <summary>Dados e catálogo de uma loja.</summary>
    /// <response code="404">Loja não encontrada.</response>
    [HttpGet("lojas/{id:int}")]
    [ProducesResponseType<LojaDetalheDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<LojaDetalheDto> Loja(int id, CancellationToken ct) => await admin.ObterLojaAsync(id, ct);

    /// <summary>Altera os dados de qualquer loja (o CNPJ continua fixo: é o login dela).</summary>
    /// <response code="404">Loja não encontrada.</response>
    [HttpPut("lojas/{id:int}")]
    [ProducesResponseType<LojaDetalheDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<LojaDetalheDto> AlterarLoja(int id, AtualizarLojaRequest req, CancellationToken ct) =>
        await admin.AtualizarLojaAsync(User.AdminId(), id, req, ct);

    /// <summary>Adiciona um uniforme ao catálogo de uma loja.</summary>
    /// <response code="404">Loja não encontrada.</response>
    [HttpPost("lojas/{id:int}/uniformes")]
    [ProducesResponseType<UniformeDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UniformeDto>> CriarItem(int id, UniformeRequest req, CancellationToken ct)
    {
        var criado = await admin.CriarItemAsync(User.AdminId(), id, req, ct);
        return CreatedAtAction(nameof(Loja), new { id }, criado);
    }

    /// <summary>Altera um uniforme de uma loja.</summary>
    /// <response code="403">O uniforme é de outra loja.</response>
    /// <response code="404">Uniforme não encontrado.</response>
    [HttpPut("lojas/{id:int}/uniformes/{uniformeId:int}")]
    [ProducesResponseType<UniformeDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<UniformeDto> AlterarItem(int id, int uniformeId, UniformeRequest req, CancellationToken ct) =>
        await admin.AtualizarItemAsync(User.AdminId(), id, uniformeId, req, ct);

    /// <summary>Exclui um uniforme de uma loja.</summary>
    /// <response code="204">Excluído.</response>
    /// <response code="403">O uniforme é de outra loja.</response>
    /// <response code="404">Uniforme não encontrado.</response>
    [HttpDelete("lojas/{id:int}/uniformes/{uniformeId:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ExcluirItem(int id, int uniformeId, CancellationToken ct)
    {
        await admin.ExcluirItemAsync(User.AdminId(), id, uniformeId, ct);
        return NoContent();
    }

    /// <summary>Quem pode entrar no sistema: administradores e lojas.</summary>
    [HttpGet("usuarios")]
    [ProducesResponseType<UsuariosDto>(StatusCodes.Status200OK)]
    public async Task<UsuariosDto> Usuarios(CancellationToken ct) => await admin.ListarUsuariosAsync(ct);

    /// <summary>Cria um administrador. A senha é provisória: ele troca no primeiro acesso.</summary>
    /// <response code="409">Já existe um administrador com este usuário.</response>
    [HttpPost("usuarios/admins")]
    [ProducesResponseType<AdminUsuarioDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AdminUsuarioDto>> CriarAdmin(NovoAdminRequest req, CancellationToken ct)
    {
        var criado = await admin.CriarAdminAsync(User.AdminId(), req, ct);
        return CreatedAtAction(nameof(Usuarios), null, criado);
    }

    /// <summary>Cria uma loja (mesmas regras do cadastro público, incluindo o CNPJ obrigatório em produção).</summary>
    /// <response code="409">Já existe uma loja com este CNPJ.</response>
    [HttpPost("usuarios/lojas")]
    [ProducesResponseType<AdminLojaDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AdminLojaDto>> CriarLoja(CadastroRequest req, CancellationToken ct)
    {
        var criada = await admin.CriarLojaAsync(User.AdminId(), req, ct);
        return CreatedAtAction(nameof(Loja), new { id = criada.Id }, criada);
    }
}

/// <summary>Conta do próprio administrador. Liberada mesmo com a troca de acesso pendente.</summary>
[ApiController]
[Authorize(Policy = Politicas.AdminConta)]
[Route("api/admin/conta")]
[Produces("application/json")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public class AdminContaController(AdminService admin) : ControllerBase
{
    /// <summary>Usuário do administrador logado e se a troca de acesso está pendente.</summary>
    [HttpGet]
    [ProducesResponseType<AdminResumoDto>(StatusCodes.Status200OK)]
    public async Task<AdminResumoDto> Obter(CancellationToken ct) => await admin.ObterContaAsync(User.AdminId(), ct);

    /// <summary>Troca usuário e senha. Devolve um token novo, já sem a troca pendente.</summary>
    /// <response code="400">Senha atual incorreta ou campos inválidos.</response>
    /// <response code="409">Já existe um administrador com este usuário.</response>
    [HttpPut]
    [ProducesResponseType<AuthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<AuthResponse> Alterar(AlterarAcessoRequest req, CancellationToken ct) =>
        await admin.AlterarAcessoAsync(User.AdminId(), req, ct);
}
