import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.js'
import { Campo, CampoSenha } from '../components/Campo.jsx'
import { MolduraAcesso } from '../components/MolduraAcesso.jsx'
import { formatarCnpj } from '../lib/format.js'

// Só números e pontuação: é CNPJ, aplica a máscara. Com letras, pode ser o usuário do admin
// (ou um CNPJ alfanumérico), então fica como foi digitado.
const pareceCnpj = (valor) => /^[\d.\-/\s]*$/.test(valor)

/** RF02: login da loja com CNPJ e senha. O administrador entra pelo mesmo formulário, com o usuário dele. */
export default function Login() {
  const { login, logada, admin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [identificacao, setIdentificacao] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)

  if (logada) return <Navigate to="/gerenciamento" replace />
  if (admin && !enviando) return <Navigate to={admin.trocarAcesso ? '/admin/conta' : '/admin'} replace />

  async function enviar(e) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      const sessao = await login(identificacao, senha)
      const voltarPara = location.state?.voltarPara
      if (sessao.papel === 'admin') {
        navigate(sessao.trocarAcesso ? '/admin/conta' : voltarPara?.startsWith('/admin') ? voltarPara : '/admin', { replace: true })
      } else {
        navigate(voltarPara?.startsWith('/gerenciamento') ? voltarPara : '/gerenciamento', { replace: true })
      }
    } catch (err) {
      setErro(err.message)
      setEnviando(false)
    }
  }

  return (
    <MolduraAcesso>
      <form className="formulario" onSubmit={enviar} noValidate>
        <h1>Entrar na área da loja</h1>
        <p className="formulario-sub">Lojas entram com o CNPJ. Administradores, com o usuário.</p>
        {erro && <div className="alerta" role="alert">{erro}</div>}

        <Campo
          rotulo="CNPJ ou usuário"
          inputMode="text"
          placeholder="00.000.000/0000-00"
          value={pareceCnpj(identificacao) ? formatarCnpj(identificacao) : identificacao}
          onChange={(e) => setIdentificacao(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
        />
        <CampoSenha rotulo="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" required />

        <button className="botao grande largo" disabled={enviando}>{enviando ? 'Entrando…' : 'Entrar'}</button>
        <p className="formulario-rodape">Ainda não tem cadastro? <Link to="/cadastro">Cadastrar minha loja</Link></p>
      </form>
    </MolduraAcesso>
  )
}
