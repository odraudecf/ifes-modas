// Cliente HTTP da API. Centraliza: endereço da API, token JWT e tradução dos erros (ProblemDetails).

const urlConfigurada = import.meta.env.VITE_API_URL || 'http://localhost:5112'

// Aceita o endereço com ou sem esquema ("ifes-modas-api.onrender.com" vira "https://...").
export const API_URL = (urlConfigurada.includes('://') ? urlConfigurada : `https://${urlConfigurada}`).replace(/\/$/, '')

const CHAVE_TOKEN = 'ifesmodas.token'

export const tokenStorage = {
  ler: () => {
    try { return localStorage.getItem(CHAVE_TOKEN) } catch { return null }
  },
  salvar: (token) => {
    try { localStorage.setItem(CHAVE_TOKEN, token) } catch { /* modo privado: segue sem persistir */ }
  },
  limpar: () => {
    try { localStorage.removeItem(CHAVE_TOKEN) } catch { /* idem */ }
  },
}

/** Erro vindo da API, com a mensagem principal e os erros por campo (validação). */
export class ApiError extends Error {
  constructor(status, titulo, campos = {}) {
    super(titulo)
    this.status = status
    this.campos = campos
  }
}

// A API responde ProblemDetails com chaves em PascalCase/camelCase ("Endereco.Uf", "cnpj").
// Normalizamos para minúsculas para os formulários acharem o erro do campo certo.
function normalizarCampos(errors = {}) {
  return Object.fromEntries(
    Object.entries(errors).map(([campo, msgs]) => [campo.toLowerCase().replace(/^\$\./, ''), msgs[0]]),
  )
}

export async function api(caminho, { method = 'GET', body, auth = false } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  if (auth) {
    const token = tokenStorage.ler()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let resposta
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'Não foi possível falar com o servidor. Verifique sua conexão e tente de novo.')
  }

  if (resposta.status === 204) return null

  const dados = await resposta.json().catch(() => null)

  if (!resposta.ok) {
    if (resposta.status === 401 && auth) {
      // Token vencido ou inválido: avisa o AuthProvider para encerrar a sessão.
      window.dispatchEvent(new Event('ifesmodas:sessao-expirada'))
    }
    const titulo = resposta.status === 429
      ? 'Muitas tentativas seguidas. Aguarde um minuto e tente de novo.'
      : dados?.title ?? `Erro ${resposta.status}.`
    throw new ApiError(resposta.status, titulo, normalizarCampos(dados?.errors))
  }

  return dados
}
