using System.ComponentModel.DataAnnotations;

namespace IfesModas.Api.Dtos;

public record EnderecoDto(
    [Required(ErrorMessage = "Informe a rua."), StringLength(150)] string Rua,
    [Required(ErrorMessage = "Informe o número."), StringLength(10)] string Numero,
    [Required(ErrorMessage = "Informe o bairro."), StringLength(100)] string Bairro,
    [Required(ErrorMessage = "Informe a cidade."), StringLength(100)] string Cidade,
    [Required(ErrorMessage = "Informe o estado (UF)."), StringLength(2, MinimumLength = 2)] string Uf);

public record LojaResumoDto(int Id, string Nome, string Cnpj);

/// <summary>Página da loja (RF08 + RF09): dados de contato, endereço e catálogo.</summary>
public record LojaDetalheDto(
    int Id,
    string Nome,
    string Cnpj,
    string Telefone,
    string? Instagram,
    string? Facebook,
    EnderecoDto Endereco,
    IReadOnlyList<UniformeDto> Uniformes);

/// <summary>Alteração dos dados da própria loja (o "Alterar Dados da Loja" que ficou sem implementação no PHP).</summary>
public record AtualizarLojaRequest(
    [Required(ErrorMessage = "Informe o nome da loja."), StringLength(120, MinimumLength = 2)] string Nome,
    [Required(ErrorMessage = "Informe o telefone.")] string Telefone,
    [StringLength(255)] string? Instagram,
    [StringLength(255)] string? Facebook,
    [Required] EnderecoDto Endereco);

// ---- Listagem agrupada (RF03): Estado → Cidade → Lojas ----

public record LojaItemDto(int Id, string Nome, string Bairro);

public record CidadeGrupoDto(string Cidade, IReadOnlyList<LojaItemDto> Lojas);

public record EstadoGrupoDto(string Uf, string NomeEstado, IReadOnlyList<CidadeGrupoDto> Cidades);
