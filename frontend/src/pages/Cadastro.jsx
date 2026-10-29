import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.js'
import { Campo } from '../components/Campo.jsx'
import { CamposLoja } from '../components/CamposLoja.jsx'
import { formatarCnpj } from '../lib/format.js'
import { lojaVazia } from '../lib/loja.js'

/** RF01: cadastro da loja. A API devolve o token e a loja já entra logada. */
export default function Cadastro() {
  const { cadastrar, logada } = useAuth()
  const navigate = useNavigate()
  const [loja, setLoja] = useState(lojaVazia)
  const [acesso, setAcesso] = useState({ cnpj: '', senha: '', confirmarSenha: '' })
  const [erro, setErro] = useState(null)
  const [erros, setErros] = useState({})
  const [enviando, setEnviando] = useState(false)

  if (logada && !enviando) return <Navigate to="/gerenciamento" replace />

  async function enviar(e) {
    e.preventDefault()
    setErro(null)
    setErros({})

    if (acesso.senha !== acesso.confirmarSenha) {
      setErros({ confirmarsenha: 'As senhas não conferem.' })
      return
    }

    setEnviando(true)
    try {
      await cadastrar({ ...loja, ...acesso })
      navigate('/gerenciamento/roupas', { replace: true, state: { boasVindas: true } })
    } catch (err) {
      setErro(err.message)
      setErros(err.campos ?? {})
      setEnviando(false)
    }
  }

  const acessoCampo = (nome) => (e) => setAcesso({ ...acesso, [nome]: e.target.value })

  return (
    <div className="form-pagina">
      <form className="cartao-form" onSubmit={enviar} noValidate>
        <h1>Cadastro</h1>
        {erro && <div className="alerta" role="alert">{erro}</div>}

        <CamposLoja valores={loja} alterar={setLoja} erros={erros} />

        <fieldset className="grupo-campos">
          <legend>Acesso</legend>
          <Campo
            rotulo="CNPJ"
            placeholder="00.000.000/0000-00"
            value={formatarCnpj(acesso.cnpj)}
            onChange={acessoCampo('cnpj')}
            erro={erros.cnpj}
            autoComplete="username"
            required
          />
          <Campo rotulo="Senha (mínimo 6 caracteres)" type="password" value={acesso.senha} onChange={acessoCampo('senha')} erro={erros.senha} autoComplete="new-password" minLength={6} required />
          <Campo rotulo="Confirmar senha" type="password" value={acesso.confirmarSenha} onChange={acessoCampo('confirmarSenha')} erro={erros.confirmarsenha} autoComplete="new-password" required />
        </fieldset>

        <div className="form-acoes">
          <button className="botao" disabled={enviando}>{enviando ? 'Cadastrando…' : 'Cadastrar loja'}</button>
        </div>
        <p className="form-rodape">Já tem conta? <Link to="/login">Entrar</Link></p>
      </form>
    </div>
  )
}
