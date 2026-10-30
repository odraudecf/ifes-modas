// Regras e textos dos uniformes, espelhando o back-end (RegrasUniforme.cs).

export const GENEROS = ['Masculino', 'Feminino']

export const TAMANHOS_LETRA = ['PP', 'P', 'M', 'G', 'GG', 'XGG']
export const CALCA_MIN = 30
export const CALCA_MAX = 60

/** Numeração de calça mostrada como opção (pares, de 30 a 60). Números ímpares continuam válidos na API. */
export const TAMANHOS_CALCA = Array.from({ length: (CALCA_MAX - CALCA_MIN) / 2 + 1 }, (_, i) => String(CALCA_MIN + i * 2))

/** Numerações mais procuradas, usadas na busca rápida da página inicial. */
export const TAMANHOS_CALCA_COMUNS = ['36', '38', '40', '42', '44', '46', '48']

/**
 * As quatro peças do uniforme. Para quem compra, "tipo + modelo" é uma escolha só:
 * ninguém procura "camisa" e depois "agropecuária", procura "camisa agropecuária".
 */
export const PECAS = [
  { id: 'camisa-padrao', tipo: 'Camisa', modelo: 'Padrao', nome: 'Camisa padrão', plural: 'Camisas padrão', imagem: '/img/camisa-padrao.webp' },
  { id: 'camisa-agro', tipo: 'Camisa', modelo: 'Agropecuaria', nome: 'Camisa agropecuária', plural: 'Camisas agropecuária', imagem: '/img/camisa-agro.webp' },
  { id: 'bermuda', tipo: 'Bermuda', modelo: null, nome: 'Bermuda', plural: 'Bermudas', imagem: '/img/bermuda.webp' },
  { id: 'calca', tipo: 'Calca', modelo: null, nome: 'Calça', plural: 'Calças', imagem: '/img/calca.webp' },
]

export const pecaPorId = (id) => PECAS.find((p) => p.id === id) ?? null

/** Peça de um item vindo da API ({ tipo, modelo }). */
export const pecaDoItem = ({ tipo, modelo }) => PECAS.find((p) => p.tipo === tipo && p.modelo === (modelo ?? null))

export const nomePeca = (item) => pecaDoItem(item)?.nome ?? item.tipo
export const imagemPeca = (item) => pecaDoItem(item)?.imagem ?? '/img/camisa-padrao.webp'

export const tamanhosDaPeca = (peca) => (peca?.tipo === 'Calca' ? TAMANHOS_CALCA : TAMANHOS_LETRA)

/** Todas as peças do uniforme são palavras femininas: "camisa masculina", "calça feminina". */
export const generoNaPeca = (genero) => (genero === 'Masculino' ? 'masculina' : 'feminina')

/** "Camisa padrão masculina, tamanho M" */
export const descreverItem = (item) => `${nomePeca(item)} ${generoNaPeca(item.genero)}, tamanho ${item.tamanho}`

const ordemTamanho = (t) => {
  const i = TAMANHOS_LETRA.indexOf(t)
  return i >= 0 ? i : 100 + Number(t)
}

export const compararTamanhos = (a, b) => ordemTamanho(a) - ordemTamanho(b)

/**
 * Agrupa o catálogo de uma loja: peça → gênero → tamanhos, com a faixa de preço da peça.
 * Só devolve as peças que têm itens.
 */
export function agruparCatalogo(uniformes) {
  return PECAS.map((peca) => {
    const itens = uniformes.filter((u) => pecaDoItem(u) === peca)
    const generos = GENEROS.map((genero) => ({
      genero,
      tamanhos: itens.filter((u) => u.genero === genero).sort((a, b) => compararTamanhos(a.tamanho, b.tamanho)),
    })).filter((g) => g.tamanhos.length > 0)
    const precos = itens.map((u) => u.preco)
    return { peca, itens, generos, menor: Math.min(...precos), maior: Math.max(...precos) }
  }).filter((s) => s.itens.length > 0)
}
