using IfesModas.Api.Domain;

namespace IfesModas.Tests.Unit;

public class RegrasUniformeTests
{
    [Theory]
    [InlineData(TipoUniforme.Camisa, ModeloCamisa.Padrao, "M")]
    [InlineData(TipoUniforme.Camisa, ModeloCamisa.Agropecuaria, "xgg")]
    [InlineData(TipoUniforme.Bermuda, null, "PP")]
    [InlineData(TipoUniforme.Calca, null, "42")]
    public void Validar_aceita_combinacoes_corretas(TipoUniforme tipo, ModeloCamisa? modelo, string tamanho) =>
        Assert.Empty(RegrasUniforme.Validar(tipo, modelo, tamanho, 40m));

    [Fact]
    public void Camisa_sem_modelo_e_invalida() =>
        Assert.Contains("modelo", RegrasUniforme.Validar(TipoUniforme.Camisa, null, "M", 40m).Keys);

    [Fact]
    public void Bermuda_com_modelo_e_invalida() =>
        Assert.Contains("modelo", RegrasUniforme.Validar(TipoUniforme.Bermuda, ModeloCamisa.Padrao, "M", 40m).Keys);

    [Theory]
    [InlineData("M")]   // calça usa número
    [InlineData("29")]  // abaixo do mínimo
    [InlineData("61")]  // acima do máximo
    public void Calca_com_tamanho_invalido(string tamanho) =>
        Assert.Contains("tamanho", RegrasUniforme.Validar(TipoUniforme.Calca, null, tamanho, 40m).Keys);

    [Fact]
    public void Camisa_com_tamanho_numerico_e_invalida() =>
        Assert.Contains("tamanho", RegrasUniforme.Validar(TipoUniforme.Camisa, ModeloCamisa.Padrao, "42", 40m).Keys);

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(10000)]
    public void Preco_fora_da_faixa_e_invalido(decimal preco) =>
        Assert.Contains("preco", RegrasUniforme.Validar(TipoUniforme.Bermuda, null, "M", preco).Keys);

    [Fact]
    public void Preco_de_40_reais_e_valido_diferente_do_decimal_3_2_antigo() =>
        Assert.Empty(RegrasUniforme.Validar(TipoUniforme.Bermuda, null, "M", 40.00m));

    [Fact]
    public void OrdemTamanho_ordena_letras_antes_de_numeros()
    {
        var ordenados = new[] { "42", "G", "PP", "40", "XGG", "M" }.OrderBy(RegrasUniforme.OrdemTamanho);
        Assert.Equal(["PP", "M", "G", "XGG", "40", "42"], ordenados);
    }
}
