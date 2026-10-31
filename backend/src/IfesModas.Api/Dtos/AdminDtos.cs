using System.ComponentModel.DataAnnotations;
using IfesModas.Api.Domain;

namespace IfesModas.Api.Dtos;

// ---------- Painel (dashboard) ----------

/// <summary>Números do painel do administrador: tudo calculado a partir dos cadastros atuais.</summary>
public record PainelDto(
    PainelTotaisDto Totais,
    IReadOnlyList<LojasPorCidadeDto> LojasPorCidade,
    IReadOnlyList<ItensPorPecaDto> ItensPorPeca,
    IReadOnlyList<ItensPorTamanhoDto> Tamanhos,
    IReadOnlyList<ItensPorTamanhoDto> NumeracaoCalca,
    IReadOnlyList<PrecoPorPecaDto> PrecosPorPeca,
    IReadOnlyList<AdminLojaDto> LojasSemCatalogo,
    IReadOnlyList<AdminLojaDto> UltimasLojas);

public record PainelTotaisDto(int Lojas, int Cidades, int Estados, int Itens, int Administradores, int LojasSemCatalogo);

public record LojasPorCidadeDto(string Cidade, string Uf, int Lojas);

/// <summary>Itens do catálogo de uma peça (tipo + modelo), separados por gênero.</summary>
public record ItensPorPecaDto(TipoUniforme Tipo, ModeloCamisa? Modelo, int Masculino, int Feminino);

public record ItensPorTamanhoDto(string Tamanho, int Itens);

/// <summary>Faixa de preço de uma peça entre todas as lojas que a vendem.</summary>
public record PrecoPorPecaDto(TipoUniforme Tipo, ModeloCamisa? Modelo, decimal Minimo, decimal Media, decimal Maximo, int Lojas);

// ---------- Lojas e usuários ----------

/// <summary>Loja na visão do administrador (inclui CNPJ, telefone e tamanho do catálogo).</summary>
public record AdminLojaDto(int Id, string Nome, string Cnpj, string Cidade, string Uf, string Telefone, int Itens, DateTime CriadoEm);

public record AdminUsuarioDto(int Id, string Usuario, bool DeveTrocarAcesso, DateTime CriadoEm);

/// <summary>Quem pode entrar no sistema: administradores e lojas.</summary>
public record UsuariosDto(IReadOnlyList<AdminUsuarioDto> Administradores, IReadOnlyList<AdminLojaDto> Lojas);

/// <summary>Novo administrador. A senha é provisória: ele troca no primeiro acesso.</summary>
public record NovoAdminRequest(
    [Required(ErrorMessage = "Informe o usuário.")] string Usuario,
    [Required(ErrorMessage = "Informe a senha."), StringLength(72, MinimumLength = 6, ErrorMessage = "A senha deve ter entre 6 e 72 caracteres.")] string Senha,
    [Required(ErrorMessage = "Confirme a senha.")] string ConfirmarSenha);

/// <summary>Troca de usuário e senha do próprio administrador.</summary>
public record AlterarAcessoRequest(
    [Required(ErrorMessage = "Informe o usuário.")] string Usuario,
    [Required(ErrorMessage = "Informe a senha atual.")] string SenhaAtual,
    [Required(ErrorMessage = "Informe a nova senha."), StringLength(72, MinimumLength = 6, ErrorMessage = "A nova senha deve ter entre 6 e 72 caracteres.")] string NovaSenha,
    [Required(ErrorMessage = "Confirme a nova senha.")] string ConfirmarNovaSenha);
