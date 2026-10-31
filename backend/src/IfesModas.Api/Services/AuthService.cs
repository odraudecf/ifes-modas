using IfesModas.Api.Data;
using IfesModas.Api.Domain;
using IfesModas.Api.Dtos;
using IfesModas.Api.Errors;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace IfesModas.Api.Services;

/// <summary>Cadastro (RF01) e login (RF02) das lojas, e login do administrador.</summary>
public class AuthService(AppDbContext db, TokenService tokens, IOptions<CadastroOptions> regras, ILogger<AuthService> log)
{
    // Hash de uma senha qualquer, usado quando o login não existe: o login demora o mesmo tempo
    // nos dois casos, então não dá para descobrir quais CNPJs estão cadastrados medindo o tempo de resposta.
    private static readonly string HashFalso = BCrypt.Net.BCrypt.HashPassword("senha-inexistente");

    public async Task<AuthResponse> CadastrarAsync(CadastroRequest req, CancellationToken ct)
    {
        var loja = await CriarLojaAsync(req, ct);
        return CriarResposta(loja);
    }

    /// <summary>Valida e grava uma loja nova. Usado pelo cadastro público e pelo administrador.</summary>
    public async Task<Loja> CriarLojaAsync(CadastroRequest req, CancellationToken ct)
    {
        var semCnpj = string.IsNullOrWhiteSpace(req.Cnpj);
        var erros = ValidacaoLoja.Validar(req.Telefone, req.Instagram, req.Facebook, req.Endereco);
        if (semCnpj && regras.Value.ExigirCnpj) erros["cnpj"] = ["Informe o CNPJ."];
        else if (!semCnpj && !Cnpj.EhValido(req.Cnpj)) erros["cnpj"] = ["CNPJ inválido."];
        if (req.Senha != req.ConfirmarSenha) erros["confirmarSenha"] = ["As senhas não conferem."];
        if (erros.Count > 0) throw ApiException.Validacao(erros);

        // Sem CNPJ só chega aqui no ambiente de teste: geramos um, que vira o login da loja.
        var cnpj = semCnpj ? await GerarCnpjDeTesteAsync(ct) : Cnpj.Normalizar(req.Cnpj);
        if (await db.Lojas.AnyAsync(l => l.Cnpj == cnpj, ct))
            throw ApiException.Conflito("Já existe uma loja cadastrada com este CNPJ.");

        var loja = new Loja
        {
            Cnpj = cnpj,
            Nome = req.Nome.Trim(),
            Telefone = ValidacaoLoja.SoDigitos(req.Telefone),
            Instagram = ValidacaoLoja.Limpar(req.Instagram),
            Facebook = ValidacaoLoja.Limpar(req.Facebook),
            // BCrypt gera um "sal" aleatório por senha: duas lojas com a mesma senha têm hashes diferentes.
            SenhaHash = BCrypt.Net.BCrypt.HashPassword(req.Senha),
            Endereco = new Endereco
            {
                Rua = req.Endereco.Rua.Trim(),
                Numero = req.Endereco.Numero.Trim(),
                Bairro = req.Endereco.Bairro.Trim(),
                Cidade = req.Endereco.Cidade.Trim(),
                Uf = req.Endereco.Uf.ToUpperInvariant()
            }
        };

        db.Lojas.Add(loja);
        await db.SaveChangesAsync(ct);

        log.LogInformation("Loja {LojaId} cadastrada em {Cidade}/{Uf} (CNPJ gerado para teste: {CnpjGerado})",
            loja.Id, loja.Endereco.Cidade, loja.Endereco.Uf, semCnpj);
        return loja;
    }

    /// <summary>
    /// Um campo só para os dois papéis: se o texto é um CNPJ válido, procura a loja;
    /// senão, procura um administrador com esse usuário.
    /// </summary>
    public async Task<AuthResponse> LoginAsync(LoginRequest req, CancellationToken ct)
    {
        var login = req.Cnpj.Trim();

        if (Cnpj.EhValido(login))
        {
            var cnpj = Cnpj.Normalizar(login);
            var loja = await db.Lojas.AsNoTracking().FirstOrDefaultAsync(l => l.Cnpj == cnpj, ct);
            var senhaConfere = BCrypt.Net.BCrypt.Verify(req.Senha, loja?.SenhaHash ?? HashFalso);

            // Mesma mensagem para "não existe" e "senha errada": não revela qual dos dois falhou.
            if (loja is null || !senhaConfere) throw LoginInvalido();
            return CriarResposta(loja);
        }

        var usuario = login.ToLowerInvariant();
        var admin = await db.Administradores.AsNoTracking().FirstOrDefaultAsync(a => a.Usuario.ToLower() == usuario, ct);
        var adminConfere = BCrypt.Net.BCrypt.Verify(req.Senha, admin?.SenhaHash ?? HashFalso);
        if (admin is null || !adminConfere) throw LoginInvalido();

        log.LogInformation("Administrador {AdminId} entrou (troca de acesso pendente: {TrocaPendente})", admin.Id, admin.DeveTrocarAcesso);
        return RespostaAdmin(admin);
    }

    /// <summary>Regras do cadastro neste ambiente (o formulário mostra ou esconde a opção "sem CNPJ").</summary>
    public RegrasCadastroDto Regras() => new(regras.Value.ExigirCnpj);

    public AuthResponse RespostaAdmin(Administrador admin)
    {
        var (token, expiraEm) = tokens.GerarAdmin(admin);
        return new AuthResponse(token, expiraEm, null, Papeis.Admin, new AdminResumoDto(admin.Id, admin.Usuario, admin.DeveTrocarAcesso));
    }

    private static ApiException LoginInvalido() => ApiException.NaoAutorizado("CNPJ, usuário ou senha inválidos.");

    private async Task<string> GerarCnpjDeTesteAsync(CancellationToken ct)
    {
        while (true)
        {
            var cnpj = Cnpj.GerarValido(Random.Shared);
            if (!await db.Lojas.AnyAsync(l => l.Cnpj == cnpj, ct)) return cnpj;
        }
    }

    private AuthResponse CriarResposta(Loja loja)
    {
        var (token, expiraEm) = tokens.Gerar(loja);
        return new AuthResponse(token, expiraEm, new LojaResumoDto(loja.Id, loja.Nome, Cnpj.Formatar(loja.Cnpj)));
    }
}
