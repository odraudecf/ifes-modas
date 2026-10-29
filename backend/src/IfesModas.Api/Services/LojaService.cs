using IfesModas.Api.Data;
using IfesModas.Api.Domain;
using IfesModas.Api.Dtos;
using IfesModas.Api.Errors;
using Microsoft.EntityFrameworkCore;

namespace IfesModas.Api.Services;

public class LojaService(AppDbContext db)
{
    /// <summary>
    /// RF03: lojas agrupadas por Estado → Cidade. O PHP antigo fazia isso com 3 blocos copiados
    /// e uma consulta ao banco dentro de outro loop. Aqui é UMA consulta e o agrupamento é feito em memória.
    /// O Espírito Santo (estado do campus) aparece primeiro; os demais em ordem alfabética.
    /// </summary>
    public async Task<IReadOnlyList<EstadoGrupoDto>> ListarAgrupadasAsync(string? uf, CancellationToken ct)
    {
        var query = db.Enderecos.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(uf))
        {
            var ufNormalizada = uf.Trim().ToUpperInvariant();
            query = query.Where(e => e.Uf == ufNormalizada);
        }

        var linhas = await query
            .Select(e => new { e.Uf, e.Cidade, e.Bairro, e.LojaId, e.Loja.Nome })
            .ToListAsync(ct);

        return linhas
            .GroupBy(l => l.Uf)
            .OrderBy(g => g.Key == "ES" ? 0 : 1)
            .ThenBy(g => Ufs.Nomes.GetValueOrDefault(g.Key, g.Key))
            .Select(g => new EstadoGrupoDto(
                g.Key,
                Ufs.Nomes.GetValueOrDefault(g.Key, g.Key),
                g.GroupBy(l => l.Cidade, StringComparer.OrdinalIgnoreCase)
                    .OrderBy(c => c.Key)
                    .Select(c => new CidadeGrupoDto(
                        c.First().Cidade,
                        c.OrderBy(l => l.Nome).Select(l => new LojaItemDto(l.LojaId, l.Nome, l.Bairro)).ToList()))
                    .ToList()))
            .ToList();
    }

    /// <summary>RF08 + RF09: dados públicos da loja e seu catálogo.</summary>
    public async Task<LojaDetalheDto> ObterDetalheAsync(int id, CancellationToken ct)
    {
        var loja = await db.Lojas.AsNoTracking()
            .Include(l => l.Endereco)
            .Include(l => l.Uniformes)
            .FirstOrDefaultAsync(l => l.Id == id, ct)
            ?? throw ApiException.NaoEncontrado("Loja não encontrada.");

        return ParaDetalhe(loja);
    }

    /// <summary>Alteração dos dados da loja logada. O CNPJ não pode ser alterado (é o login).</summary>
    public async Task<LojaDetalheDto> AtualizarAsync(int lojaId, AtualizarLojaRequest req, CancellationToken ct)
    {
        var erros = ValidacaoLoja.Validar(req.Telefone, req.Instagram, req.Facebook, req.Endereco);
        if (erros.Count > 0) throw ApiException.Validacao(erros);

        var loja = await db.Lojas
            .Include(l => l.Endereco)
            .Include(l => l.Uniformes)
            .FirstOrDefaultAsync(l => l.Id == lojaId, ct)
            ?? throw ApiException.NaoEncontrado("Loja não encontrada.");

        loja.Nome = req.Nome.Trim();
        loja.Telefone = ValidacaoLoja.SoDigitos(req.Telefone);
        loja.Instagram = ValidacaoLoja.Limpar(req.Instagram);
        loja.Facebook = ValidacaoLoja.Limpar(req.Facebook);
        loja.Endereco.Rua = req.Endereco.Rua.Trim();
        loja.Endereco.Numero = req.Endereco.Numero.Trim();
        loja.Endereco.Bairro = req.Endereco.Bairro.Trim();
        loja.Endereco.Cidade = req.Endereco.Cidade.Trim();
        loja.Endereco.Uf = req.Endereco.Uf.ToUpperInvariant();

        await db.SaveChangesAsync(ct);
        return ParaDetalhe(loja);
    }

    private static LojaDetalheDto ParaDetalhe(Loja loja) => new(
        loja.Id,
        loja.Nome,
        Cnpj.Formatar(loja.Cnpj),
        loja.Telefone,
        loja.Instagram,
        loja.Facebook,
        new EnderecoDto(loja.Endereco.Rua, loja.Endereco.Numero, loja.Endereco.Bairro, loja.Endereco.Cidade, loja.Endereco.Uf),
        UniformeService.Ordenar(loja.Uniformes).Select(UniformeService.ParaDto).ToList());
}
