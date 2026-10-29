import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'
import { useAuth } from '../auth/AuthContext.js'
import { CamposLoja } from '../components/CamposLoja.jsx'
import { Carregando, Erro } from '../components/Estados.jsx'
import { useApi } from '../lib/useApi.js'

/** Alteração dos dados da loja: no PHP antigo, o botão "Alterar Dados da Loja" não fazia nada. */
export default function EditarLoja() {
  const { dados, erro, carregando, recarregar } = useApi('/api/lojas/me', { auth: true })

  if (carregando) return <Carregando />
  if (erro) return <Erro mensagem={erro.message} tentarDeNovo={recarregar} />
  return <Formulario inicial={dados} />
}

function Formulario({ inicial }) {
  const { renomear } = useAuth()
  const [loja, setLoja] = useState({
    nome: inicial.nome,
    telefone: inicial.telefone,
    instagram: inicial.instagram ?? '',
    facebook: inicial.facebook ?? '',
    endereco: inicial.endereco,
  })
  const [erros, setErros] = useState({})
  const [mensagem, setMensagem] = useState(null)
  const [enviando, setEnviando] = useState(false)

  async function salvar(e) {
    e.preventDefault()
    setErros({})
    setMensagem(null)
    setEnviando(true)
    try {
      const atualizada = await api('/api/lojas/me', { method: 'PUT', body: loja, auth: true })
      renomear(atualizada.nome)
      setMensagem({ tipo: 'sucesso', texto: 'Dados salvos.' })
    } catch (err) {
      setErros(err.campos ?? {})
      setMensagem({ tipo: 'erro', texto: err.message })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="form-pagina">
      <form className="cartao-form" onSubmit={salvar} noValidate>
        <h1>Dados da loja</h1>
        <p className="form-rodape" style={{ marginTop: -12, marginBottom: 20 }}>CNPJ {inicial.cnpj}</p>
        {mensagem && <div className={`alerta${mensagem.tipo === 'sucesso' ? ' sucesso' : ''}`} role="status">{mensagem.texto}</div>}

        <CamposLoja valores={loja} alterar={setLoja} erros={erros} />

        <div className="form-acoes">
          <Link to="/gerenciamento" className="botao secundario">Voltar</Link>
          <button className="botao" disabled={enviando}>{enviando ? 'Salvando…' : 'Salvar alterações'}</button>
        </div>
      </form>
    </div>
  )
}
