import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, tokenStorage } from '../api/client.js'
import { AuthContext } from './AuthContext.js'

// Lê o "payload" do JWT (a parte do meio) só para exibir o nome e saber a validade.
// Quem garante que o token é verdadeiro é a API, que confere a assinatura em toda requisição.
function lerToken(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64).split('').map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join(''),
    )
    const p = JSON.parse(json)
    if (!p.exp || p.exp * 1000 < Date.now()) return null
    return { id: Number(p.sub), nome: p.name, cnpj: p.cnpj }
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [loja, setLoja] = useState(() => {
    const token = tokenStorage.ler()
    const dados = token ? lerToken(token) : null
    if (token && !dados) tokenStorage.limpar() // token vencido
    return dados
  })

  const entrar = useCallback((token) => {
    tokenStorage.salvar(token)
    setLoja(lerToken(token))
  }, [])

  const sair = useCallback(() => {
    tokenStorage.limpar()
    setLoja(null)
  }, [])

  // Atualiza o nome exibido no menu depois que a loja altera seus dados.
  const renomear = useCallback((nome) => setLoja((l) => (l ? { ...l, nome } : l)), [])

  useEffect(() => {
    window.addEventListener('ifesmodas:sessao-expirada', sair)
    return () => window.removeEventListener('ifesmodas:sessao-expirada', sair)
  }, [sair])

  const valor = useMemo(() => ({
    loja,
    logada: loja !== null,
    login: async (cnpj, senha) => entrar((await api('/api/auth/login', { method: 'POST', body: { cnpj, senha } })).token),
    cadastrar: async (dados) => entrar((await api('/api/auth/cadastro', { method: 'POST', body: dados })).token),
    sair,
    renomear,
  }), [loja, entrar, sair, renomear])

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
