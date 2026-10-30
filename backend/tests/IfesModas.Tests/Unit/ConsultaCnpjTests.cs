using System.Text.Json;
using IfesModas.Api.Domain;
using IfesModas.Api.Services;

namespace IfesModas.Tests.Unit;

/// <summary>
/// Leitura das respostas de cada API de CNPJ. Os JSONs têm o formato real de cada fornecedor
/// (conferido nas APIs), mas os dados são inventados.
/// </summary>
public class ConsultaCnpjTests
{
    private const string CnpjExemplo = "99123456000100";

    private static JsonElement Json(string json) => JsonDocument.Parse(json).RootElement;

    [Fact]
    public void BrasilAPI_junta_tipo_e_logradouro_e_prefere_nome_fantasia()
    {
        var dados = ConsultaCnpjService.LerBrasilApi(Json("""
            {"razao_social":"MALHARIA EXEMPLO DO CAPARAO LTDA","nome_fantasia":"MALHARIA EXEMPLO",
             "descricao_tipo_de_logradouro":"RUA","logradouro":"DAS FLORES","numero":"120","bairro":"CENTRO",
             "municipio":"ALEGRE","uf":"ES","ddd_telefone_1":"2835521234","ddd_telefone_2":"",
             "descricao_situacao_cadastral":"ATIVA"}
            """), CnpjExemplo)!;

        Assert.Equal("Malharia Exemplo", dados.Nome);
        Assert.Equal("Malharia Exemplo do Caparao LTDA", dados.RazaoSocial);
        Assert.Equal("Rua das Flores", dados.Endereco.Rua);
        Assert.Equal("Alegre", dados.Endereco.Cidade);
        Assert.Equal("ES", dados.Endereco.Uf);
        Assert.Equal("2835521234", dados.Telefone);
        Assert.True(dados.Ativa);
        Assert.Equal("99.123.456/0001-00", dados.Cnpj);
    }

    [Fact]
    public void BrasilAPI_nao_repete_o_tipo_quando_o_logradouro_ja_comeca_com_ele()
    {
        var dados = ConsultaCnpjService.LerBrasilApi(Json("""
            {"razao_social":"X","descricao_tipo_de_logradouro":"AVENIDA","logradouro":"AVENIDA BEIRA RIO","numero":"SN",
             "bairro":"","municipio":"","uf":"","ddd_telefone_1":""}
            """), CnpjExemplo)!;

        Assert.Equal("Avenida Beira Rio", dados.Endereco.Rua);
        Assert.Equal("S/N", dados.Endereco.Numero);
        Assert.Null(dados.Telefone);
    }

    [Fact]
    public void CNPJa_le_empresa_endereco_e_primeiro_telefone()
    {
        var dados = ConsultaCnpjService.LerCnpja(Json("""
            {"alias":"Ateliê Exemplo","company":{"name":"ATELIE EXEMPLO ME"},"status":{"id":8,"text":"Baixada"},
             "address":{"street":"Praça Central","number":"33","district":"Centro","city":"Carangola","state":"MG"},
             "phones":[{"area":"32","number":"999990004"},{"area":"32","number":"37411234"}]}
            """), CnpjExemplo)!;

        Assert.Equal("Ateliê Exemplo", dados.Nome);
        Assert.Equal("32999990004", dados.Telefone);
        Assert.Equal("Carangola", dados.Endereco.Cidade);
        Assert.False(dados.Ativa);
        Assert.Equal("Baixada", dados.Situacao);
    }

    [Fact]
    public void ReceitaWS_com_status_de_erro_conta_como_nao_encontrado()
    {
        Assert.Null(ConsultaCnpjService.LerReceitaWs(Json("""{"status":"ERROR","message":"CNPJ inválido"}"""), CnpjExemplo));
    }

    [Fact]
    public void ReceitaWS_fica_com_o_primeiro_telefone()
    {
        var dados = ConsultaCnpjService.LerReceitaWs(Json("""
            {"status":"OK","nome":"BAZAR EXEMPLO","fantasia":"","logradouro":"R 10 DE MAIO","numero":"780",
             "bairro":"CENTRO","municipio":"ITAPERUNA","uf":"RJ","telefone":"(22) 3822-1234/ (22) 3822-5678","situacao":"ATIVA"}
            """), CnpjExemplo)!;

        Assert.Equal("Bazar Exemplo", dados.Nome); // sem fantasia: usa a razão social
        Assert.Equal("2238221234", dados.Telefone);
    }

    [Theory]
    [InlineData("CONFECCOES DA SILVA E FILHOS LTDA", "Confeccoes da Silva e Filhos LTDA")]
    [InlineData("SAUN QUADRA 5 BLOCO B TORRE I, II, III", "Saun Quadra 5 Bloco B Torre I, II, III")]
    [InlineData("DE OLHO NA MODA", "De Olho na Moda")]
    [InlineData("RUA A", "Rua A")]
    public void NomeProprio_converte_maiusculas_da_Receita(string entrada, string esperado) =>
        Assert.Equal(esperado, ConsultaCnpjService.NomeProprio(entrada));

    [Fact]
    public void CNPJ_gerado_para_teste_e_sempre_valido()
    {
        var sorteio = new Random(42);
        for (var i = 0; i < 200; i++)
            Assert.True(Cnpj.EhValido(Cnpj.GerarValido(sorteio)));
    }
}
