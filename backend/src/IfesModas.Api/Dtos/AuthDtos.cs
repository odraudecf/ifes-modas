using System.ComponentModel.DataAnnotations;

namespace IfesModas.Api.Dtos;

/// <summary>Dados do formulário de cadastro da loja (RF01).</summary>
public record CadastroRequest(
    [Required(ErrorMessage = "Informe o nome da loja."), StringLength(120, MinimumLength = 2)] string Nome,
    [Required(ErrorMessage = "Informe o telefone.")] string Telefone,
    [StringLength(255)] string? Instagram,
    [StringLength(255)] string? Facebook,
    string? Cnpj, // obrigatório em produção; a regra fica no AuthService porque muda por ambiente
    [Required(ErrorMessage = "Informe a senha."), StringLength(72, MinimumLength = 6, ErrorMessage = "A senha deve ter entre 6 e 72 caracteres.")] string Senha,
    [Required(ErrorMessage = "Confirme a senha.")] string ConfirmarSenha,
    [Required] EnderecoDto Endereco);

/// <summary>Login com CNPJ e senha (RF02). O administrador usa o mesmo campo com o nome de usuário dele.</summary>
/// <param name="Cnpj">CNPJ da loja (com ou sem pontuação) ou usuário do administrador.</param>
/// <param name="Senha">Senha.</param>
public record LoginRequest(
    [Required(ErrorMessage = "Informe o CNPJ ou o usuário.")] string Cnpj,
    [Required(ErrorMessage = "Informe a senha.")] string Senha);

/// <summary>
/// Resposta de login/cadastro: o token JWT e quem entrou. <c>Papel</c> é "loja" ou "admin";
/// conforme o papel, vem preenchido <c>Loja</c> ou <c>Admin</c>.
/// </summary>
public record AuthResponse(string Token, DateTime ExpiraEm, LojaResumoDto? Loja, string Papel = "loja", AdminResumoDto? Admin = null);

/// <summary>Administrador logado. <c>DeveTrocarAcesso</c> = true no primeiro acesso.</summary>
public record AdminResumoDto(int Id, string Usuario, bool DeveTrocarAcesso);
