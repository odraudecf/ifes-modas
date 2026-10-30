import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.js'
import { Campo, CampoSenha } from '../components/Campo.jsx'
import { MolduraAcesso } from '../components/MolduraAcesso.jsx'
import { formatarCnpj } from '../lib/format.js'

/** RF02: login da loja com CNPJ e senha. */
export default function Login() {
  const { login, logada } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [cnpj, setCnpj] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)

  if (logada) return <Navigate to="/gerenciamento" replace />

  async function enviar(e) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      await login(cnpj, senha)
      navigate(location.state?.voltarPara ?? '/gerenciamento', { replace: true })
    } catch (err) {
      setErro(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <MolduraAcesso>
      <form className="formulario" onSubmit={enviar} noValidate>
        <h1>Entrar na área da loja</h1>
        <p className="formulario-sub">Use o CNPJ e a senha do cadastro.</p>
        {erro && <div className="alerta" role="alert">{erro}</div>}

        <Campo
          rotulo="CNPJ"
          inputMode="text"
          placeholder="00.000.000/0000-00"
          value={formatarCnpj(cnpj)}
          onChange={(e) => setCnpj(e.target.value)}
          autoComplete="username"
          required
        />
        <CampoSenha rotulo="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" required />

        <button className="botao grande largo" disabled={enviando}>{enviando ? 'Entrando…' : 'Entrar'}</button>
        <p className="formulario-rodape">Ainda não tem cadastro? <Link to="/cadastro">Cadastrar minha loja</Link></p>
      </form>
    </MolduraAcesso>
  )
}
