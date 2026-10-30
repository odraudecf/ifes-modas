using System.Globalization;
using System.Net;
using System.Text.Json;
using IfesModas.Api.Domain;
using IfesModas.Api.Dtos;
using IfesModas.Api.Errors;

namespace IfesModas.Api.Services;

/// <summary>
/// Busca os dados públicos de um CNPJ para preencher o cadastro da loja.
/// Tenta três APIs gratuitas em sequência: se uma estiver fora do ar ou no limite de uso, passa para a próxima.
/// O front chama a nossa API (e não as externas direto) para não depender de CORS de terceiros
/// e para trocar de fornecedor sem mexer no site.
/// </summary>
public class ConsultaCnpjService(HttpClient http, ILogger<ConsultaCnpjService> log)
{
    private delegate DadosCnpjDto? Leitor(JsonElement json, string cnpj);

    private static readonly (string Nome, string Url, Leitor Ler)[] Fontes =
    [
        ("BrasilAPI", "https://brasilapi.com.br/api/cnpj/v1/{0}", LerBrasilApi),
        ("CNPJá", "https://open.cnpja.com/office/{0}", LerCnpja),
        ("ReceitaWS", "https://receitaws.com.br/v1/cnpj/{0}", LerReceitaWs),
    ];

    public async Task<DadosCnpjDto> ConsultarAsync(string cnpjInformado, CancellationToken ct)
    {
        if (!Cnpj.EhValido(cnpjInformado))
            throw ApiException.Validacao(new Dictionary<string, string[]> { ["cnpj"] = ["CNPJ inválido."] });

        var cnpj = Cnpj.Normalizar(cnpjInformado);
        var alguemRespondeu = false; // "não encontrado" é diferente de "todas fora do ar"

        foreach (var (nome, url, ler) in Fontes)
        {
            try
            {
                using var resposta = await http.GetAsync(string.Format(CultureInfo.InvariantCulture, url, cnpj), ct);
                if (resposta.StatusCode == HttpStatusCode.NotFound)
                {
                    alguemRespondeu = true;
                    continue;
                }
                if (!resposta.IsSuccessStatusCode)
                {
                    log.LogWarning("Consulta de CNPJ em {Fonte} respondeu {Status}", nome, (int)resposta.StatusCode);
                    continue;
                }

                await using var corpo = await resposta.Content.ReadAsStreamAsync(ct);
                using var json = await JsonDocument.ParseAsync(corpo, cancellationToken: ct);
                var dados = ler(json.RootElement, cnpj);
                if (dados is not null) return dados with { Fonte = nome };
                alguemRespondeu = true; // respondeu 200 dizendo que não achou (ReceitaWS faz isso)
            }
            catch (Exception e) when ((e is HttpRequestException or TaskCanceledException or JsonException) && !ct.IsCancellationRequested)
            {
                log.LogWarning(e, "Consulta de CNPJ em {Fonte} falhou", nome);
            }
        }

        if (alguemRespondeu)
            throw ApiException.NaoEncontrado("Não encontramos este CNPJ na Receita Federal. Confira o número ou preencha os dados à mão.");
        throw new ApiException(StatusCodes.Status503ServiceUnavailable, "A consulta de CNPJ está fora do ar agora. Preencha os dados à mão.");
    }

    // ---------- Leitura de cada fornecedor (formatos diferentes, mesma saída) ----------

    public static DadosCnpjDto? LerBrasilApi(JsonElement j, string cnpj)
    {
        var tipo = Texto(j, "descricao_tipo_de_logradouro");
        var logradouro = Texto(j, "logradouro");
        // A BrasilAPI separa o tipo ("RUA") do nome ("GARIBALDI"); às vezes o nome já começa com o tipo.
        var rua = tipo.Length > 0 && !logradouro.StartsWith(tipo, StringComparison.OrdinalIgnoreCase)
            ? $"{tipo} {logradouro}"
            : logradouro;

        return Montar(cnpj,
            razao: Texto(j, "razao_social"),
            fantasia: Texto(j, "nome_fantasia"),
            telefone: Primeiro(Texto(j, "ddd_telefone_1"), Texto(j, "ddd_telefone_2")),
            rua, Texto(j, "numero"), Texto(j, "bairro"), Texto(j, "municipio"), Texto(j, "uf"),
            situacao: Texto(j, "descricao_situacao_cadastral"));
    }

    public static DadosCnpjDto? LerCnpja(JsonElement j, string cnpj)
    {
        var empresa = j.TryGetProperty("company", out var c) ? c : default;
        var endereco = j.TryGetProperty("address", out var a) ? a : default;
        var telefone = j.TryGetProperty("phones", out var fones) && fones.ValueKind == JsonValueKind.Array && fones.GetArrayLength() > 0
            ? Texto(fones[0], "area") + Texto(fones[0], "number")
            : "";
        var situacao = j.TryGetProperty("status", out var s) ? Texto(s, "text") : "";

        return Montar(cnpj,
            razao: Texto(empresa, "name"),
            fantasia: Texto(j, "alias"),
            telefone,
            Texto(endereco, "street"), Texto(endereco, "number"), Texto(endereco, "district"),
            Texto(endereco, "city"), Texto(endereco, "state"),
            situacao);
    }

    public static DadosCnpjDto? LerReceitaWs(JsonElement j, string cnpj)
    {
        if (!Texto(j, "status").Equals("OK", StringComparison.OrdinalIgnoreCase)) return null;

        // "(61) 3493-9002/ (61) 3493-1040": fica com o primeiro número.
        var telefone = Texto(j, "telefone").Split('/')[0];

        return Montar(cnpj,
            razao: Texto(j, "nome"),
            fantasia: Texto(j, "fantasia"),
            telefone,
            Texto(j, "logradouro"), Texto(j, "numero"), Texto(j, "bairro"), Texto(j, "municipio"), Texto(j, "uf"),
            situacao: Texto(j, "situacao"));
    }

    private static DadosCnpjDto? Montar(string cnpj, string razao, string fantasia, string telefone,
        string rua, string numero, string bairro, string cidade, string uf, string situacao)
    {
        if (razao.Length == 0) return null;

        // Nome que o aluno reconhece: o fantasia; sem ele, a razão social.
        var nome = fantasia.Length > 0 && !fantasia.Contains('*') ? fantasia : razao;
        var digitos = ValidacaoLoja.SoDigitos(telefone).TrimStart('0');
        var ufNormalizada = uf.Trim().ToUpperInvariant();

        return new DadosCnpjDto(
            Cnpj: Cnpj.Formatar(cnpj),
            Nome: NomeProprio(nome),
            RazaoSocial: NomeProprio(razao),
            Telefone: digitos.Length is 10 or 11 ? digitos : null,
            Endereco: new EnderecoCnpjDto(
                Rua: NomeProprio(rua),
                Numero: numero.Trim() is "" or "SN" or "S/N" or "S N" ? "S/N" : numero.Trim(),
                Bairro: NomeProprio(bairro),
                Cidade: NomeProprio(cidade),
                Uf: Ufs.EhValida(ufNormalizada) ? ufNormalizada : ""),
            Situacao: NomeProprio(situacao),
            Ativa: situacao.Trim().Equals("ATIVA", StringComparison.OrdinalIgnoreCase),
            Fonte: "");
    }

    private static readonly HashSet<string> Minusculas = ["a", "as", "o", "os", "e", "da", "das", "de", "do", "dos", "em", "na", "no"];
    private static readonly HashSet<string> Siglas = ["SA", "S/A", "ME", "EPP", "EIRELI", "LTDA", "MEI"];

    /// <summary>
    /// A Receita guarda tudo em maiúsculas ("MALHARIA CAPARAO LTDA"). Para o site:
    /// "Malharia Caparao LTDA", com "da", "de", "do"... em minúsculas e algarismos romanos ("TORRE II") preservados.
    /// </summary>
    public static string NomeProprio(string texto)
    {
        var palavras = texto.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        for (var i = 0; i < palavras.Length; i++)
        {
            var original = palavras[i];
            var nucleo = original.TrimEnd(',', '.', ';');
            if (Siglas.Contains(nucleo.ToUpperInvariant()) || EhRomano(nucleo)) { palavras[i] = original.ToUpperInvariant(); continue; }

            var minuscula = original.ToLower(new CultureInfo("pt-BR"));
            // "da", "de", "e"... só ficam minúsculas no meio: "Rua A" e "Quadra E" terminam com a letra da rua.
            palavras[i] = i > 0 && i < palavras.Length - 1 && Minusculas.Contains(minuscula)
                ? minuscula
                : char.ToUpper(minuscula[0], new CultureInfo("pt-BR")) + minuscula[1..];
        }
        return string.Join(' ', palavras);
    }

    private static bool EhRomano(string palavra) =>
        palavra.Length is > 0 and <= 4 && palavra.All(c => "IVXivx".Contains(c));

    private static string Texto(JsonElement j, string campo) =>
        j.ValueKind == JsonValueKind.Object && j.TryGetProperty(campo, out var v) && v.ValueKind == JsonValueKind.String
            ? v.GetString()!.Trim()
            : "";

    private static string Primeiro(params string[] valores) => valores.FirstOrDefault(v => v.Length > 0) ?? "";
}
