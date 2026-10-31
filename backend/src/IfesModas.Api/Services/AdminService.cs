using System.Text.RegularExpressions;
using IfesModas.Api.Data;
using IfesModas.Api.Domain;
using IfesModas.Api.Dtos;
using IfesModas.Api.Errors;
using Microsoft.EntityFrameworkCore;

namespace IfesModas.Api.Services;

/// <summary>
/// Tudo que só o administrador faz: painel com os números do sistema, alteração de qualquer loja
/// e do catálogo dela, lista e criação de usuários, troca do próprio acesso.
/// Reaproveita as regras de LojaService, UniformeService e AuthService: o admin passa pelas mesmas validações.
/// </summary>
public partial class AdminService(
    AppDbContext db,
    LojaService lojas,
    UniformeService uniformes,
    AuthService auth,
    ILogger<AdminService> log)
{
    // ---------- Painel ----------

    public async Task<PainelDto> PainelAsync(CancellationToken ct)
    {
        // O sistema é pequeno: uma consulta por tabela e o resto em memória.
        var todas = await db.Lojas.AsNoTracking().Include(l => l.Endereco).ToListAsync(ct);
        var itens = await db.Uniformes.AsNoTracking().ToListAsync(ct);
        var admins = await db.Administradores.CountAsync(ct);

        var itensPorLoja = itens.GroupBy(u => u.LojaId).ToDictionary(g => g.Key, g => g.Count());
        var resumo = todas.Select(l => ParaAdminLoja(l, itensPorLoja.GetValueOrDefault(l.Id))).ToList();

        var porCidade = todas
            .GroupBy(l => (Cidade: l.Endereco.Cidade.Trim(), l.Endereco.Uf), CidadeIgual.Instancia)
            .Select(g => new LojasPorCidadeDto(g.First().Endereco.Cidade.Trim(), g.Key.Uf, g.Count()))
            .OrderByDescending(c => c.Lojas).ThenBy(c => c.Cidade)
            .ToList();

        var pecas = new (TipoUniforme Tipo, ModeloCamisa? Modelo)[]
        {
            (TipoUniforme.Camisa, ModeloCamisa.Padrao), (TipoUniforme.Camisa, ModeloCamisa.Agropecuaria),
            (TipoUniforme.Bermuda, null), (TipoUniforme.Calca, null),
        };

        var porPeca = pecas.Select(p =>
        {
            var daPeca = itens.Where(u => u.Tipo == p.Tipo && u.Modelo == p.Modelo).ToList();
            return new ItensPorPecaDto(p.Tipo, p.Modelo,
                daPeca.Count(u => u.Genero == Genero.Masculino), daPeca.Count(u => u.Genero == Genero.Feminino));
        }).ToList();

        var precos = pecas.Select(p => (p, daPeca: itens.Where(u => u.Tipo == p.Tipo && u.Modelo == p.Modelo).ToList()))
            .Where(x => x.daPeca.Count > 0)
            .Select(x => new PrecoPorPecaDto(x.p.Tipo, x.p.Modelo,
                x.daPeca.Min(u => u.Preco),
                Math.Round(x.daPeca.Average(u => u.Preco), 2),
                x.daPeca.Max(u => u.Preco),
                x.daPeca.Select(u => u.LojaId).Distinct().Count()))
            .ToList();

        // Tamanhos com letra (camisas e bermudas) e numeração de calça, na ordem de vestir.
        var letras = RegrasUniforme.TamanhosLetra
            .Select(t => new ItensPorTamanhoDto(t, itens.Count(u => u.Tipo != TipoUniforme.Calca && u.Tamanho == t)))
            .ToList();
        var calcas = itens.Where(u => u.Tipo == TipoUniforme.Calca)
            .GroupBy(u => u.Tamanho)
            .OrderBy(g => RegrasUniforme.OrdemTamanho(g.Key))
            .Select(g => new ItensPorTamanhoDto(g.Key, g.Count()))
            .ToList();

        var semCatalogo = resumo.Where(l => l.Itens == 0).OrderBy(l => l.Nome).ToList();

        return new PainelDto(
            new PainelTotaisDto(
                Lojas: todas.Count,
                Cidades: porCidade.Count,
                Estados: todas.Select(l => l.Endereco.Uf).Distinct().Count(),
                Itens: itens.Count,
                Administradores: admins,
                LojasSemCatalogo: semCatalogo.Count),
            porCidade, porPeca, letras, calcas, precos, semCatalogo,
            resumo.OrderByDescending(l => l.CriadoEm).ThenByDescending(l => l.Id).Take(5).ToList());
    }

    // ---------- Lojas e catálogo ----------

    public async Task<IReadOnlyList<AdminLojaDto>> ListarLojasAsync(string? busca, CancellationToken ct)
    {
        var query = db.Lojas.AsNoTracking().Include(l => l.Endereco).AsQueryable();
        if (!string.IsNullOrWhiteSpace(busca))
        {
            var termo = busca.Trim().ToLower();
            var cnpj = Cnpj.Normalizar(busca);
            query = query.Where(l => l.Nome.ToLower().Contains(termo)
                                     || l.Endereco.Cidade.ToLower().Contains(termo)
                                     || (cnpj.Length >= 4 && l.Cnpj.Contains(cnpj)));
        }

        var encontradas = await query.OrderBy(l => l.Nome).ToListAsync(ct);
        var ids = encontradas.Select(l => l.Id).ToList();
        var contagem = await db.Uniformes.AsNoTracking().Where(u => ids.Contains(u.LojaId))
            .GroupBy(u => u.LojaId).Select(g => new { g.Key, Total = g.Count() })
            .ToDictionaryAsync(g => g.Key, g => g.Total, ct);

        return encontradas.Select(l => ParaAdminLoja(l, contagem.GetValueOrDefault(l.Id))).ToList();
    }

    public Task<LojaDetalheDto> ObterLojaAsync(int lojaId, CancellationToken ct) => lojas.ObterDetalheAsync(lojaId, ct);

    public async Task<LojaDetalheDto> AtualizarLojaAsync(int adminId, int lojaId, AtualizarLojaRequest req, CancellationToken ct)
    {
        var atualizada = await lojas.AtualizarAsync(lojaId, req, ct);
        log.LogInformation("Administrador {AdminId} alterou os dados da loja {LojaId}", adminId, lojaId);
        return atualizada;
    }

    public async Task<UniformeDto> CriarItemAsync(int adminId, int lojaId, UniformeRequest req, CancellationToken ct)
    {
        await GarantirLojaAsync(lojaId, ct);
        var criado = await uniformes.CriarAsync(lojaId, req, ct);
        log.LogInformation("Administrador {AdminId} adicionou o uniforme {UniformeId} à loja {LojaId}", adminId, criado.Id, lojaId);
        return criado;
    }

    public async Task<UniformeDto> AtualizarItemAsync(int adminId, int lojaId, int id, UniformeRequest req, CancellationToken ct)
    {
        var alterado = await uniformes.AtualizarAsync(lojaId, id, req, ct);
        log.LogInformation("Administrador {AdminId} alterou o uniforme {UniformeId} da loja {LojaId}", adminId, id, lojaId);
        return alterado;
    }

    public async Task ExcluirItemAsync(int adminId, int lojaId, int id, CancellationToken ct)
    {
        await uniformes.ExcluirAsync(lojaId, id, ct);
        log.LogInformation("Administrador {AdminId} excluiu o uniforme {UniformeId} da loja {LojaId}", adminId, id, lojaId);
    }

    private async Task GarantirLojaAsync(int lojaId, CancellationToken ct)
    {
        if (!await db.Lojas.AnyAsync(l => l.Id == lojaId, ct))
            throw ApiException.NaoEncontrado("Loja não encontrada.");
    }

    // ---------- Usuários ----------

    public async Task<UsuariosDto> ListarUsuariosAsync(CancellationToken ct)
    {
        var admins = await db.Administradores.AsNoTracking().OrderBy(a => a.Usuario)
            .Select(a => new AdminUsuarioDto(a.Id, a.Usuario, a.DeveTrocarAcesso, a.CriadoEm))
            .ToListAsync(ct);
        return new UsuariosDto(admins, await ListarLojasAsync(null, ct));
    }

    public async Task<AdminUsuarioDto> CriarAdminAsync(int adminId, NovoAdminRequest req, CancellationToken ct)
    {
        var erros = ValidarUsuario(req.Usuario);
        if (req.Senha != req.ConfirmarSenha) erros["confirmarSenha"] = ["As senhas não conferem."];
        if (erros.Count > 0) throw ApiException.Validacao(erros);

        var usuario = req.Usuario.Trim();
        await GarantirUsuarioLivreAsync(usuario, outroQue: null, ct);

        var novo = new Administrador
        {
            Usuario = usuario,
            SenhaHash = BCrypt.Net.BCrypt.HashPassword(req.Senha),
            DeveTrocarAcesso = true // senha provisória: o novo admin troca no primeiro acesso
        };
        db.Administradores.Add(novo);
        await db.SaveChangesAsync(ct);

        log.LogInformation("Administrador {AdminId} criou o administrador {NovoAdminId}", adminId, novo.Id);
        return new AdminUsuarioDto(novo.Id, novo.Usuario, novo.DeveTrocarAcesso, novo.CriadoEm);
    }

    public async Task<AdminLojaDto> CriarLojaAsync(int adminId, CadastroRequest req, CancellationToken ct)
    {
        var loja = await auth.CriarLojaAsync(req, ct);
        log.LogInformation("Administrador {AdminId} criou a loja {LojaId}", adminId, loja.Id);
        return ParaAdminLoja(loja, 0);
    }

    // ---------- Conta do próprio admin ----------

    public async Task<AdminResumoDto> ObterContaAsync(int adminId, CancellationToken ct)
    {
        var admin = await BuscarAdminAsync(adminId, ct);
        return new AdminResumoDto(admin.Id, admin.Usuario, admin.DeveTrocarAcesso);
    }

    /// <summary>
    /// Troca usuário e senha. Pede a senha atual (um token esquecido aberto não basta para tomar a conta)
    /// e devolve um token novo, já sem a troca pendente.
    /// </summary>
    public async Task<AuthResponse> AlterarAcessoAsync(int adminId, AlterarAcessoRequest req, CancellationToken ct)
    {
        var admin = await BuscarAdminAsync(adminId, ct);

        var erros = ValidarUsuario(req.Usuario);
        if (!BCrypt.Net.BCrypt.Verify(req.SenhaAtual, admin.SenhaHash)) erros["senhaAtual"] = ["Senha atual incorreta."];
        if (req.NovaSenha != req.ConfirmarNovaSenha) erros["confirmarNovaSenha"] = ["As senhas não conferem."];
        else if (req.NovaSenha == req.SenhaAtual) erros["novaSenha"] = ["A nova senha precisa ser diferente da atual."];
        if (erros.Count > 0) throw ApiException.Validacao(erros);

        var usuario = req.Usuario.Trim();
        await GarantirUsuarioLivreAsync(usuario, outroQue: admin.Id, ct);

        admin.Usuario = usuario;
        admin.SenhaHash = BCrypt.Net.BCrypt.HashPassword(req.NovaSenha);
        admin.DeveTrocarAcesso = false;
        await db.SaveChangesAsync(ct);

        log.LogInformation("Administrador {AdminId} trocou o usuário e a senha", admin.Id);
        return auth.RespostaAdmin(admin);
    }

    private async Task<Administrador> BuscarAdminAsync(int adminId, CancellationToken ct) =>
        await db.Administradores.FirstOrDefaultAsync(a => a.Id == adminId, ct)
        ?? throw ApiException.NaoAutorizado("Administrador não encontrado.");

    [GeneratedRegex("^[A-Za-z0-9._-]{3,40}$")]
    private static partial Regex FormatoUsuario();

    /// <summary>
    /// O usuário entra no mesmo campo do CNPJ, então não pode parecer um CNPJ (o login confundiria os dois).
    /// </summary>
    private static Dictionary<string, string[]> ValidarUsuario(string usuario)
    {
        var erros = new Dictionary<string, string[]>();
        var u = usuario.Trim();
        if (!FormatoUsuario().IsMatch(u))
            erros["usuario"] = ["Use de 3 a 40 caracteres: letras, números, ponto, hífen ou sublinhado."];
        else if (Cnpj.EhValido(u))
            erros["usuario"] = ["O usuário não pode ser um CNPJ."];
        return erros;
    }

    private async Task GarantirUsuarioLivreAsync(string usuario, int? outroQue, CancellationToken ct)
    {
        var minusculo = usuario.ToLowerInvariant();
        if (await db.Administradores.AnyAsync(a => a.Usuario.ToLower() == minusculo && a.Id != outroQue, ct))
            throw ApiException.Conflito("Já existe um administrador com este usuário.");
    }

    private static AdminLojaDto ParaAdminLoja(Loja l, int itens) =>
        new(l.Id, l.Nome, Cnpj.Formatar(l.Cnpj), l.Endereco.Cidade, l.Endereco.Uf, l.Telefone, itens, l.CriadoEm);

    /// <summary>"Alegre" e "ALEGRE" no mesmo estado são a mesma cidade.</summary>
    private sealed class CidadeIgual : IEqualityComparer<(string Cidade, string Uf)>
    {
        public static readonly CidadeIgual Instancia = new();
        public bool Equals((string Cidade, string Uf) a, (string Cidade, string Uf) b) =>
            string.Equals(a.Cidade, b.Cidade, StringComparison.OrdinalIgnoreCase) && a.Uf == b.Uf;
        public int GetHashCode((string Cidade, string Uf) c) =>
            HashCode.Combine(c.Cidade.ToLowerInvariant(), c.Uf);
    }
}
