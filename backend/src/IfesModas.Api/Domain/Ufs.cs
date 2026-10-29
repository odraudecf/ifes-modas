namespace IfesModas.Api.Domain;

/// <summary>
/// As 27 unidades federativas. O cadastro antigo oferecia "BH" como estado (é cidade);
/// agora só siglas reais são aceitas.
/// </summary>
public static class Ufs
{
    public static readonly IReadOnlyDictionary<string, string> Nomes = new Dictionary<string, string>
    {
        ["AC"] = "Acre", ["AL"] = "Alagoas", ["AP"] = "Amapá", ["AM"] = "Amazonas",
        ["BA"] = "Bahia", ["CE"] = "Ceará", ["DF"] = "Distrito Federal", ["ES"] = "Espírito Santo",
        ["GO"] = "Goiás", ["MA"] = "Maranhão", ["MT"] = "Mato Grosso", ["MS"] = "Mato Grosso do Sul",
        ["MG"] = "Minas Gerais", ["PA"] = "Pará", ["PB"] = "Paraíba", ["PR"] = "Paraná",
        ["PE"] = "Pernambuco", ["PI"] = "Piauí", ["RJ"] = "Rio de Janeiro", ["RN"] = "Rio Grande do Norte",
        ["RS"] = "Rio Grande do Sul", ["RO"] = "Rondônia", ["RR"] = "Roraima", ["SC"] = "Santa Catarina",
        ["SP"] = "São Paulo", ["SE"] = "Sergipe", ["TO"] = "Tocantins"
    };

    public static bool EhValida(string? uf) => uf is not null && Nomes.ContainsKey(uf.ToUpperInvariant());
}
