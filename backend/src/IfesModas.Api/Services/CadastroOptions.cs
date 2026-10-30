namespace IfesModas.Api.Services;

/// <summary>Regras do cadastro que mudam por ambiente (seção "Cadastro" / variável Cadastro__ExigirCnpj).</summary>
public class CadastroOptions
{
    public const string Secao = "Cadastro";

    /// <summary>
    /// Produção: sempre true. No ambiente de teste (render.dev.yaml) fica false, e uma loja pode se
    /// cadastrar sem CNPJ; a API gera um CNPJ fictício válido, que passa a ser o login dela.
    /// </summary>
    public bool ExigirCnpj { get; set; } = true;
}
