using IfesModas.Api.Data;
using IfesModas.Api.Domain;
using IfesModas.Api.Dtos;
using IfesModas.Api.Errors;
using Microsoft.EntityFrameworkCore;

namespace IfesModas.Api.Services;

/// <summary>CRUD do catálogo da loja logada (RF05–RF07).</summary>
public class UniformeService(AppDbContext db)
{
    public async Task<IReadOnlyList<UniformeDto>> ListarDaLojaAsync(int lojaId, CancellationToken ct)
    {
        var itens = await db.Uniformes.AsNoTracking().Where(u => u.LojaId == lojaId).ToListAsync(ct);
        return Ordenar(itens).Select(ParaDto).ToList();
    }

    public async Task<UniformeDto> CriarAsync(int lojaId, UniformeRequest req, CancellationToken ct)
    {
        Validar(req);
        var uniforme = new Uniforme { LojaId = lojaId };
        Aplicar(uniforme, req);

        db.Uniformes.Add(uniforme);
        await db.SaveChangesAsync(ct);
        return ParaDto(uniforme);
    }

    public async Task<UniformeDto> AtualizarAsync(int lojaId, int id, UniformeRequest req, CancellationToken ct)
    {
        Validar(req);
        var uniforme = await BuscarDaLojaAsync(lojaId, id, ct);
        Aplicar(uniforme, req);

        await db.SaveChangesAsync(ct);
        return ParaDto(uniforme);
    }

    public async Task ExcluirAsync(int lojaId, int id, CancellationToken ct)
    {
        var uniforme = await BuscarDaLojaAsync(lojaId, id, ct);
        db.Uniformes.Remove(uniforme);
        await db.SaveChangesAsync(ct);
    }

    /// <summary>
    /// Autorização por dono: a loja só mexe nos próprios uniformes. Com o token, o id da loja vem
    /// assinado; no sistema antigo bastava trocar o CNPJ na URL.
    /// </summary>
    private async Task<Uniforme> BuscarDaLojaAsync(int lojaId, int id, CancellationToken ct)
    {
        var uniforme = await db.Uniformes.FirstOrDefaultAsync(u => u.Id == id, ct)
            ?? throw ApiException.NaoEncontrado("Uniforme não encontrado.");

        if (uniforme.LojaId != lojaId)
            throw ApiException.Proibido("Este uniforme pertence a outra loja.");

        return uniforme;
    }

    private static void Validar(UniformeRequest req)
    {
        var erros = RegrasUniforme.Validar(req.Tipo!.Value, req.Modelo, req.Tamanho, req.Preco!.Value);
        if (erros.Count > 0) throw ApiException.Validacao(erros);
    }

    private static void Aplicar(Uniforme u, UniformeRequest req)
    {
        u.Tipo = req.Tipo!.Value;
        u.Modelo = req.Modelo;
        u.Genero = req.Genero!.Value;
        u.Tamanho = RegrasUniforme.NormalizarTamanho(req.Tamanho);
        u.Preco = decimal.Round(req.Preco!.Value, 2);
    }

    public static IEnumerable<Uniforme> Ordenar(IEnumerable<Uniforme> itens) => itens
        .OrderBy(u => u.Tipo)
        .ThenBy(u => u.Modelo)
        .ThenBy(u => u.Genero)
        .ThenBy(u => RegrasUniforme.OrdemTamanho(u.Tamanho));

    public static UniformeDto ParaDto(Uniforme u) => new(u.Id, u.Tipo, u.Modelo, u.Genero, u.Tamanho, u.Preco);
}
