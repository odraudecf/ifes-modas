// Regras e textos dos uniformes, espelhando o back-end (RegrasUniforme.cs).

export const TIPOS = [
  { valor: 'Camisa', rotulo: 'Camisa' },
  { valor: 'Bermuda', rotulo: 'Bermuda' },
  { valor: 'Calca', rotulo: 'Calça' },
]

export const MODELOS = [
  { valor: 'Padrao', rotulo: 'Padrão' },
  { valor: 'Agropecuaria', rotulo: 'Agropecuária' },
]

export const GENEROS = ['Masculino', 'Feminino']

export const TAMANHOS_LETRA = ['PP', 'P', 'M', 'G', 'GG', 'XGG']
export const CALCA_MIN = 30
export const CALCA_MAX = 60

const rotuloTipo = Object.fromEntries(TIPOS.map((t) => [t.valor, t.rotulo]))
const rotuloModelo = Object.fromEntries(MODELOS.map((m) => [m.valor, m.rotulo]))

/** Nome curto da peça: "Camisa agropecuária", "Bermuda", "Calça". */
export function nomePeca({ tipo, modelo }) {
  if (tipo === 'Camisa') return `Camisa ${rotuloModelo[modelo]?.toLowerCase() ?? ''}`.trim()
  return rotuloTipo[tipo] ?? tipo
}

/** Foto da peça. Como no sistema antigo, a imagem vem do tipo + modelo (a loja não envia foto). */
export function imagemPeca({ tipo, modelo }) {
  if (tipo === 'Camisa') return modelo === 'Agropecuaria' ? '/img/camisa-agro.webp' : '/img/camisa-padrao.webp'
  return tipo === 'Calca' ? '/img/calca.webp' : '/img/bermuda.webp'
}

const ordemTamanho = (t) => {
  const i = TAMANHOS_LETRA.indexOf(t)
  return i >= 0 ? i : 100 + Number(t)
}

const SECOES = [
  { chave: 'Camisa|Padrao', titulo: 'Camisas padrão' },
  { chave: 'Camisa|Agropecuaria', titulo: 'Camisas agropecuária' },
  { chave: 'Bermuda|', titulo: 'Bermudas' },
  { chave: 'Calca|', titulo: 'Calças' },
]

/**
 * Agrupa o catálogo para a página da loja: peça → gênero → tamanhos.
 * Só devolve as seções que têm itens.
 */
export function agruparCatalogo(uniformes) {
  return SECOES.map(({ chave, titulo }) => {
    const itens = uniformes.filter((u) => `${u.tipo}|${u.modelo ?? ''}` === chave)
    const generos = GENEROS.map((genero) => ({
      genero,
      tamanhos: itens.filter((u) => u.genero === genero).sort((a, b) => ordemTamanho(a.tamanho) - ordemTamanho(b.tamanho)),
    })).filter((g) => g.tamanhos.length > 0)
    return { chave, titulo, imagem: itens[0] ? imagemPeca(itens[0]) : null, generos }
  }).filter((s) => s.generos.length > 0)
}
