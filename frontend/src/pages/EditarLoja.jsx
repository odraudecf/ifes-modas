import { useState } from 'react'
import { api } from '../api/client.js'
import { useAuth } from '../auth/AuthContext.js'
import { CamposContato, CamposEndereco, CamposRedes } from '../components/CamposLoja.jsx'
import { Carregando, Erro } from '../components/Estados.jsx'
import { useApi } from '../lib/useApi.js'

/** Alteração dos dados da loja: no PHP antigo, o botão "Alterar Dados da Loja" não fazia nada. */
export default function EditarLoja() {
  const { dados, erro, carregando, recarregar } = useApi('/api/lojas/me', { auth: true })

  if (carregando) return <Carregando />
  if (erro) return <Erro mensagem={erro.message} tentarDeNovo={recarregar} />
  return <Formulario inicial={dados} />
}

const BLOCOS = [
  { titulo: 'Contato', texto: 'Nome que aparece no site e o número que os alunos chamam no WhatsApp.', Campos: CamposContato },
  { titulo: 'Endereço', texto: 'Usado no botão "Como chegar" da sua página.', Campos: CamposEndereco },
  { titulo: 'Redes sociais', texto: 'Aparecem como botões na sua página.', Campos: CamposRedes },
]

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

  // Qualquer mudança apaga o "Alterações salvas" (senão ele fica mentindo).
  function alterar(valores) {
    setLoja(valores)
    if (mensagem?.tipo === 'sucesso') setMensagem(null)
  }

  async function salvar(e) {
    e.preventDefault()
    setErros({})
    setMensagem(null)
    setEnviando(true)
    try {
      const atualizada = await api('/api/lojas/me', { method: 'PUT', body: loja, auth: true })
      renomear(atualizada.nome)
      setMensagem({ tipo: 'sucesso', texto: 'Alterações salvas.' })
    } catch (err) {
      setErros(err.campos ?? {})
      setMensagem({ tipo: 'erro', texto: err.message })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form onSubmit={salvar} noValidate>
      <div className="painel-cabeca">
        <h1>Dados da loja</h1>
        <p>O CNPJ não pode ser alterado.</p>
      </div>

      {BLOCOS.map(({ titulo, texto, Campos }) => (
        <section key={titulo} className="bloco-config" aria-label={titulo}>
          <div>
            <h2>{titulo}</h2>
            <p>{texto}</p>
          </div>
          <div className="bloco-config-campos">
            <Campos valores={loja} alterar={alterar} erros={erros} />
          </div>
        </section>
      ))}

      <div className="barra-salvar">
        {mensagem && <p className={`barra-salvar-msg${mensagem.tipo === 'erro' ? ' erro' : ''}`} role="status">{mensagem.texto}</p>}
        <button className="botao grande" disabled={enviando}>{enviando ? 'Salvando…' : 'Salvar alterações'}</button>
      </div>
    </form>
  )
}
