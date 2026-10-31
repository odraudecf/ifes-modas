import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, tokenStorage } from '../api/client.js'
import { AuthContext } from './AuthContext.js'

// Lê o "payload" do JWT (a parte do meio) só para exibir o nome, o papel e saber a validade.
// Quem garante que o token é verdadeiro é a API, que confere a assinatura e o papel em toda requisição.
function lerToken(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64).split('').map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join(''),
    )
    const p = JSON.parse(json)
    if (!p.exp || p.exp * 1000 < Date.now()) return null
    return {
      papel: p.role ?? 'loja', // tokens antigos (antes dos papéis) eram todos de loja
      id: Number(p.sub),
      nome: p.name,
      cnpj: p.cnpj,
      trocarAcesso: p.trocar_acesso === 'true',
    }
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [sessao, setSessao] = useState(() => {
    const token = tokenStorage.ler()
    const dados = token ? lerToken(token) : null
    if (token && !dados) tokenStorage.limpar() // token vencido
    return dados
  })

  const entrar = useCallback((token) => {
    tokenStorage.salvar(token)
    const dados = lerToken(token)
    setSessao(dados)
    return dados
  }, [])

  const sair = useCallback(() => {
    tokenStorage.limpar()
    setSessao(null)
  }, [])

  // Atualiza o nome exibido no menu depois que a loja (ou o admin) altera seus dados.
  const renomear = useCallback((nome) => setSessao((s) => (s ? { ...s, nome } : s)), [])

  useEffect(() => {
    window.addEventListener('ifesmodas:sessao-expirada', sair)
    return () => window.removeEventListener('ifesmodas:sessao-expirada', sair)
  }, [sair])

  const valor = useMemo(() => {
    const loja = sessao?.papel === 'loja' ? sessao : null
    const admin = sessao?.papel === 'admin' ? sessao : null
    return {
      sessao,
      loja,
      admin,
      logada: loja !== null,
      // Devolve a sessão: a tela de login decide para onde ir (loja ou administração).
      login: async (login, senha) => entrar((await api('/api/auth/login', { method: 'POST', body: { cnpj: login, senha } })).token),
      // Troca o token sem sair (o admin recebe um novo depois de trocar usuário e senha).
      entrar,
      // Devolve a loja criada: no ambiente de teste o CNPJ pode ter sido gerado pela API.
      cadastrar: async (dados) => {
        const resposta = await api('/api/auth/cadastro', { method: 'POST', body: dados })
        entrar(resposta.token)
        return resposta.loja
      },
      sair,
      renomear,
    }
  }, [sessao, entrar, sair, renomear])

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
