using System.ComponentModel.DataAnnotations;

namespace IfesModas.Api.Dtos;

/// <summary>Dados do formulário de cadastro da loja (RF01).</summary>
public record CadastroRequest(
    [Required(ErrorMessage = "Informe o nome da loja."), StringLength(120, MinimumLength = 2)] string Nome,
    [Required(ErrorMessage = "Informe o telefone.")] string Telefone,
    [StringLength(255)] string? Instagram,
    [StringLength(255)] string? Facebook,
    [Required(ErrorMessage = "Informe o CNPJ.")] string Cnpj,
    [Required(ErrorMessage = "Informe a senha."), StringLength(72, MinimumLength = 6, ErrorMessage = "A senha deve ter entre 6 e 72 caracteres.")] string Senha,
    [Required(ErrorMessage = "Confirme a senha.")] string ConfirmarSenha,
    [Required] EnderecoDto Endereco);

/// <summary>Login com CNPJ e senha (RF02).</summary>
public record LoginRequest(
    [Required(ErrorMessage = "Informe o CNPJ.")] string Cnpj,
    [Required(ErrorMessage = "Informe a senha.")] string Senha);

/// <summary>Resposta de login/cadastro: o token JWT e dados básicos da loja logada.</summary>
public record AuthResponse(string Token, DateTime ExpiraEm, LojaResumoDto Loja);
