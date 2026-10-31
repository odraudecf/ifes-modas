import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound } from 'lucide-react'
import { api } from '../../api/client.js'
import { useAuth } from '../../auth/AuthContext.js'
import { Campo, CampoSenha } from '../../components/Campo.jsx'

/**
 * Troca de usuário e senha do próprio admin. No primeiro acesso (Admin/123) é obrigatória:
 * até trocar, a API recusa o resto da administração.
 */
export default function AdminConta() {
  const { admin, entrar } = useAuth()
  const navigate = useNavigate()
  const primeiroAcesso = admin.trocarAcesso
  const [form, setForm] = useState({ usuario: admin.nome, senhaAtual: '', novaSenha: '', confirmarNovaSenha: '' })
  const [erros, setErros] = useState({})
  const [mensagem, setMensagem] = useState(null)
  const [enviando, setEnviando] = useState(false)

  async function salvar(e) {
    e.preventDefault()
    setErros({})
    setMensagem(null)
    setEnviando(true)
    try {
      const resposta = await api('/api/admin/conta', { method: 'PUT', body: form, auth: true })
      entrar(resposta.token) // token novo, já sem a troca pendente
      if (primeiroAcesso) {
        navigate('/admin', { replace: true })
        return
      }
      setForm({ ...form, senhaAtual: '', novaSenha: '', confirmarNovaSenha: '' })
      setMensagem({ tipo: 'sucesso', texto: 'Usuário e senha atualizados. Use os novos dados no próximo login.' })
    } catch (err) {
      setErros(err.campos ?? {})
      setMensagem({ tipo: 'erro', texto: err.message })
    } finally {
      setEnviando(false)
    }
  }

  const campo = (nome) => (e) => setForm({ ...form, [nome]: e.target.value })

  return (
    <>
      <div className="painel-cabeca">
        <h1>{primeiroAcesso ? 'Primeiro acesso' : 'Minha conta'}</h1>
        <p>{primeiroAcesso ? 'Antes de usar a administração, troque o usuário e a senha padrão.' : 'Troque o usuário ou a senha de administrador.'}</p>
      </div>

      {primeiroAcesso && (
        <div className="aviso aviso-primeiro-acesso">
          <KeyRound size={20} />
          <p>Você entrou com o acesso padrão. Qualquer pessoa que conheça "Admin" e "123" também entraria, por isso a troca é obrigatória.</p>
        </div>
      )}

      <form className="formulario formulario-admin" onSubmit={salvar} noValidate>
        {mensagem && <div className={`alerta${mensagem.tipo === 'sucesso' ? ' sucesso' : ''}`} role={mensagem.tipo === 'erro' ? 'alert' : 'status'}>{mensagem.texto}</div>}

        <Campo rotulo="Usuário" dica="É o que você digita no lugar do CNPJ para entrar." value={form.usuario} onChange={campo('usuario')} erro={erros.usuario} autoComplete="username" autoCapitalize="none" spellCheck={false} required />
        <CampoSenha rotulo="Senha atual" value={form.senhaAtual} onChange={campo('senhaAtual')} erro={erros.senhaatual} autoComplete="current-password" required />
        <CampoSenha rotulo="Nova senha" dica="Pelo menos 6 caracteres, diferente da atual." value={form.novaSenha} onChange={campo('novaSenha')} erro={erros.novasenha} autoComplete="new-password" required />
        <CampoSenha rotulo="Repita a nova senha" value={form.confirmarNovaSenha} onChange={campo('confirmarNovaSenha')} erro={erros.confirmarnovasenha} autoComplete="new-password" required />

        <div className="formulario-acoes">
          <button className="botao grande" disabled={enviando}>{enviando ? 'Salvando…' : primeiroAcesso ? 'Salvar e entrar na administração' : 'Salvar alterações'}</button>
        </div>
      </form>
    </>
  )
}
