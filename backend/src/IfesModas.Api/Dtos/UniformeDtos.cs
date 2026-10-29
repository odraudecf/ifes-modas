using System.ComponentModel.DataAnnotations;
using IfesModas.Api.Domain;

namespace IfesModas.Api.Dtos;

/// <summary>Criação/alteração de um item do catálogo (RF05, RF06).</summary>
public record UniformeRequest(
    [Required] TipoUniforme? Tipo,
    ModeloCamisa? Modelo,
    [Required] Genero? Genero,
    [Required(ErrorMessage = "Informe o tamanho.")] string Tamanho,
    [Required(ErrorMessage = "Informe o preço.")] decimal? Preco);

public record UniformeDto(int Id, TipoUniforme Tipo, ModeloCamisa? Modelo, Genero Genero, string Tamanho, decimal Preco);
