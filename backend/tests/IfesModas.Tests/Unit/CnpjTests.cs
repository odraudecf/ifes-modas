using IfesModas.Api.Domain;

namespace IfesModas.Tests.Unit;

public class CnpjTests
{
    [Theory]
    [InlineData("11.222.333/0001-81")]   // com pontuação
    [InlineData("11222333000181")]       // só dígitos
    [InlineData("20240101000147")]       // CNPJ do seed
    [InlineData("12.ABC.345/01DE-35")]   // exemplo oficial da Receita de CNPJ alfanumérico
    [InlineData("12abc34501de35")]       // alfanumérico em minúsculas
    public void EhValido_aceita_cnpjs_corretos(string cnpj) =>
        Assert.True(Cnpj.EhValido(cnpj));

    [Theory]
    [InlineData("11.222.333/0001-82")]   // dígito verificador errado
    [InlineData("00000000000000")]       // todos iguais
    [InlineData("11111111111111")]
    [InlineData("1122233300018")]        // 13 caracteres
    [InlineData("12.ABC.345/01DE-3A")]   // DV precisa ser número
    [InlineData("' OR '1'='1")]          // tentativa de SQL injection do sistema antigo
    [InlineData("")]
    [InlineData(null)]
    public void EhValido_rejeita_cnpjs_incorretos(string? cnpj) =>
        Assert.False(Cnpj.EhValido(cnpj));

    [Fact]
    public void Normalizar_remove_pontuacao_e_poe_maiusculas() =>
        Assert.Equal("12ABC34501DE35", Cnpj.Normalizar("12.abc.345/01de-35"));

    [Fact]
    public void Formatar_aplica_mascara() =>
        Assert.Equal("11.222.333/0001-81", Cnpj.Formatar("11222333000181"));
}
