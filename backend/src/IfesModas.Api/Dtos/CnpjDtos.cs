namespace IfesModas.Api.Dtos;

/// <summary>
/// Dados públicos de um CNPJ, já no formato do formulário de cadastro.
/// Servem para preencher o cadastro; a loja confere e ajusta antes de enviar.
/// </summary>
public record DadosCnpjDto(
    string Cnpj,
    string Nome,
    string RazaoSocial,
    string? Telefone,
    EnderecoCnpjDto Endereco,
    string Situacao,
    bool Ativa,
    string Fonte);

/// <summary>Endereço como veio da Receita (pode ter campos vazios).</summary>
public record EnderecoCnpjDto(string Rua, string Numero, string Bairro, string Cidade, string Uf);

/// <summary>Regras do cadastro neste ambiente, para o formulário se adaptar.</summary>
public record RegrasCadastroDto(bool ExigirCnpj);
