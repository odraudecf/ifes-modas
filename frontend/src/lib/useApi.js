import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client.js'

/** Busca dados da API ao montar a página. Devolve { dados, erro, carregando, recarregar }. */
export function useApi(caminho, { auth = false } = {}) {
  const [versao, setVersao] = useState(0)
  const chave = `${caminho}#${versao}`
  const [resultado, setResultado] = useState({ chave: null, dados: null, erro: null })

  useEffect(() => {
    let ativo = true
    api(caminho, { auth })
      .then((dados) => ativo && setResultado({ chave, dados, erro: null }))
      .catch((erro) => ativo && setResultado({ chave, dados: null, erro }))
    return () => { ativo = false }
  }, [caminho, auth, chave])

  const recarregar = useCallback(() => setVersao((v) => v + 1), [])

  // "Carregando" é derivado: o resultado guardado ainda é de outra busca (outro caminho ou versão).
  const carregando = resultado.chave !== chave
  return {
    dados: carregando ? null : resultado.dados,
    erro: carregando ? null : resultado.erro,
    carregando,
    recarregar,
  }
}
