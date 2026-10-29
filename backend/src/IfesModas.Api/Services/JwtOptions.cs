using System.ComponentModel.DataAnnotations;

namespace IfesModas.Api.Services;

/// <summary>Configuração do JWT (seção "Jwt" do appsettings / variáveis Jwt__Key etc.).</summary>
public class JwtOptions
{
    public const string Secao = "Jwt";

    /// <summary>Chave secreta HMAC-SHA256. Precisa de pelo menos 32 caracteres (256 bits).</summary>
    [Required, MinLength(32, ErrorMessage = "Jwt:Key precisa ter pelo menos 32 caracteres.")]
    public string Key { get; set; } = string.Empty;

    [Required] public string Issuer { get; set; } = "ifes-modas-api";
    [Required] public string Audience { get; set; } = "ifes-modas-web";

    [Range(1, 168)] public int ExpiracaoHoras { get; set; } = 8;
}
