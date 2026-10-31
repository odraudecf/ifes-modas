import { useRef, useState } from 'react'
import { api } from '../api/client.js'
import { cnpjValido } from './cnpj.js'

/** Preenche o formulário da loja com o que a Receita devolveu, sem apagar o que a Receita não tem. */
export function preencherComCnpj(loja, dados) {
  return {
    ...loja,
    nome: dados.nome,
    telefone: dados.telefone ?? loja.telefone,
    endereco: {
      rua: dados.endereco.rua || loja.endereco.rua,
      numero: dados.endereco.numero || loja.endereco.numero,
      bairro: dados.endereco.bairro || loja.endereco.bairro,
      cidade: dados.endereco.cidade || loja.endereco.cidade,
      uf: dados.endereco.uf || loja.endereco.uf,
    },
  }
}

/**
 * Busca o CNPJ na API quando ele fica completo e válido (usado no cadastro e na criação de loja pelo admin).
 * `aoEncontrar(dados)` recebe a resposta. Respostas atrasadas de um CNPJ que já mudou são ignoradas.
 */
export function useConsultaCnpj(aoEncontrar) {
  const [consulta, setConsulta] = useState({ estado: 'parada' }) // parada | buscando | achou | falhou
  const ultima = useRef('')

  async function consultar(c) {
    ultima.current = c
    setConsulta({ estado: 'buscando' })
    try {
      const dados = await api(`/api/cnpj/${c}`)
      if (ultima.current !== c) return // o CNPJ mudou enquanto a resposta vinha
      aoEncontrar(dados)
      setConsulta({ estado: 'achou', dados })
    } catch (err) {
      if (ultima.current !== c) return
      setConsulta({ estado: 'falhou', mensagem: err.message })
    }
  }

  /** Chame a cada mudança do campo, com o CNPJ já normalizado. */
  function aoMudar(c) {
    if (c.length < 14) limpar()
    else if (cnpjValido(c) && c !== ultima.current) consultar(c)
  }

  function limpar() {
    ultima.current = ''
    setConsulta({ estado: 'parada' })
  }

  return { consulta, buscando: consulta.estado === 'buscando', aoMudar, limpar }
}
