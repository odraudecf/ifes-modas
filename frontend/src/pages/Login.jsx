import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.js'
import { Campo } from '../components/Campo.jsx'
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
    <div className="form-pagina">
      <form className="cartao-form" onSubmit={enviar} noValidate>
        <h1>Login</h1>
        {erro && <div className="alerta" role="alert">{erro}</div>}

        <fieldset className="grupo-campos">
          <Campo
            rotulo="CNPJ"
            inputMode="text"
            placeholder="00.000.000/0000-00"
            value={formatarCnpj(cnpj)}
            onChange={(e) => setCnpj(e.target.value)}
            autoComplete="username"
            required
          />
          <Campo rotulo="Senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" required />
        </fieldset>

        <div className="form-acoes">
          <button className="botao" disabled={enviando}>{enviando ? 'Entrando…' : 'Entrar'}</button>
        </div>
        <p className="form-rodape">Ainda não tem conta? <Link to="/cadastro">Cadastre sua loja</Link></p>
      </form>
    </div>
  )
}
