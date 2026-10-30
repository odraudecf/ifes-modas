import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client.js'

/**
 * Lista de lojas já com o catálogo de cada uma, para comparar peça, tamanho e preço.
 * A listagem (RF03) traz só nome e bairro; o catálogo vem da página de cada loja (RF08).
 * Com poucas lojas, buscar as páginas em paralelo é rápido. Se o número crescer,
 * o caminho é um endpoint de busca na API (ex.: /api/uniformes?peca=...&tamanho=...).
 */
async function carregar() {
  const estados = await api('/api/lojas')
  const lojas = estados.flatMap((e) => e.cidades.flatMap((c) => c.lojas.map((l) => ({ ...l, cidade: c.cidade, uf: e.uf }))))
  const paginas = await Promise.allSettled(lojas.map((l) => api(`/api/lojas/${l.id}`)))
  return lojas.map((l, i) => {
    const pagina = paginas[i].status === 'fulfilled' ? paginas[i].value : null
    return { ...l, telefone: pagina?.telefone ?? null, uniformes: pagina?.uniformes ?? [] }
  })
}

export function useLojasComCatalogo() {
  const [versao, setVersao] = useState(0)
  const [resultado, setResultado] = useState({ versao: -1, lojas: null, erro: null })

  useEffect(() => {
    let ativo = true
    carregar()
      .then((lojas) => ativo && setResultado({ versao, lojas, erro: null }))
      .catch((erro) => ativo && setResultado({ versao, lojas: null, erro }))
    return () => { ativo = false }
  }, [versao])

  const recarregar = useCallback(() => setVersao((v) => v + 1), [])

  const carregando = resultado.versao !== versao
  return {
    lojas: carregando ? null : resultado.lojas,
    erro: carregando ? null : resultado.erro,
    carregando,
    recarregar,
  }
}
