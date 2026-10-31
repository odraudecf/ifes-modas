import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, LoaderCircle, ShieldCheck, Store } from 'lucide-react'
import { api } from '../../api/client.js'
import { Campo, CampoSenha } from '../../components/Campo.jsx'
import { CamposContato, CamposEndereco, CamposRedes } from '../../components/CamposLoja.jsx'
import { ResultadoConsulta } from '../../components/ResultadoConsulta.jsx'
import { normalizarCnpj } from '../../lib/cnpj.js'
import { formatarCnpj } from '../../lib/format.js'
import { lojaVazia } from '../../lib/loja.js'
import { useApi } from '../../lib/useApi.js'
import { preencherComCnpj, useConsultaCnpj } from '../../lib/useConsultaCnpj.js'

const TIPOS = [
  { valor: 'loja', titulo: 'Loja', texto: 'Entra com o CNPJ e cuida do próprio catálogo.', Icone: Store },
  { valor: 'admin', titulo: 'Administrador', texto: 'Entra com um usuário e pode alterar qualquer loja.', Icone: ShieldCheck },
]

/** Criação de usuário pelo admin: uma loja (mesmas regras do cadastro) ou outro administrador. */
export default function AdminNovoUsuario() {
  const location = useLocation()
  const [tipo, setTipo] = useState(location.state?.tipo ?? 'loja')

  return (
    <>
      <Link to="/admin/usuarios" className="voltar"><ArrowLeft size={16} />Usuários</Link>
      <div className="painel-cabeca">
        <h1>Criar usuário</h1>
        <p>Você define uma senha provisória e a passa para a pessoa junto com o login. Um novo administrador é obrigado a trocá-la no primeiro acesso.</p>
      </div>

      <div className="tipo-usuario" role="radiogroup" aria-label="Tipo de usuário">
        {TIPOS.map(({ valor, titulo, texto, Icone }) => (
          <button key={valor} type="button" role="radio" aria-checked={tipo === valor} className="tipo-opcao" onClick={() => setTipo(valor)}>
            <Icone size={24} />
            <strong>{titulo}</strong>
            <span>{texto}</span>
          </button>
        ))}
      </div>

      {tipo === 'loja' ? <NovaLoja /> : <NovoAdmin />}
    </>
  )
}

function NovoAdmin() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ usuario: '', senha: '', confirmarSenha: '' })
  const [erros, setErros] = useState({})
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    setErro(null)
    setErros({})
    setEnviando(true)
    try {
      const criado = await api('/api/admin/usuarios/admins', { method: 'POST', body: form, auth: true })
      navigate('/admin/usuarios', { state: { criado: `Administrador "${criado.usuario}" criado. Ele troca a senha provisória no primeiro acesso.` } })
    } catch (err) {
      setErro(err.message)
      setErros(err.campos ?? {})
      setEnviando(false)
    }
  }

  const campo = (nome) => (e) => setForm({ ...form, [nome]: e.target.value })

  return (
    <form className="formulario formulario-admin" onSubmit={enviar} noValidate>
      {erro && <div className="alerta" role="alert">{erro}</div>}
      <Campo rotulo="Usuário" dica="De 3 a 40 caracteres: letras, números, ponto, hífen ou sublinhado." value={form.usuario} onChange={campo('usuario')} erro={erros.usuario} autoComplete="off" autoCapitalize="none" spellCheck={false} required />
      <CampoSenha rotulo="Senha provisória" dica="Pelo menos 6 caracteres." value={form.senha} onChange={campo('senha')} erro={erros.senha} autoComplete="new-password" required />
      <CampoSenha rotulo="Repita a senha" value={form.confirmarSenha} onChange={campo('confirmarSenha')} erro={erros.confirmarsenha} autoComplete="new-password" required />
      <div className="formulario-acoes">
        <button className="botao grande" disabled={enviando}>{enviando ? 'Criando…' : 'Criar administrador'}</button>
      </div>
    </form>
  )
}

function NovaLoja() {
  const navigate = useNavigate()
  const regras = useApi('/api/auth/regras')
  const cnpjOpcional = regras.dados?.exigirCnpj === false
  const [loja, setLoja] = useState(lojaVazia)
  const [cnpj, setCnpj] = useState('')
  const [senha, setSenha] = useState({ senha: '', confirmarSenha: '' })
  const [erros, setErros] = useState({})
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const { consulta, buscando, aoMudar } = useConsultaCnpj((dados) => {
    setLoja((l) => preencherComCnpj(l, dados))
    setErros({})
  })

  function mudarCnpj(e) {
    const c = normalizarCnpj(e.target.value)
    setCnpj(c)
    aoMudar(c)
  }

  async function enviar(e) {
    e.preventDefault()
    setErro(null)
    setErros({})
    setEnviando(true)
    try {
      const criada = await api('/api/admin/usuarios/lojas', { method: 'POST', body: { ...loja, ...senha, cnpj: cnpj || null }, auth: true })
      navigate('/admin/usuarios', { state: { criado: `Loja "${criada.nome}" criada. O login dela é o CNPJ ${criada.cnpj}.` } })
    } catch (err) {
      setErro(err.message)
      setErros(err.status === 409 ? { cnpj: err.message } : err.campos ?? {})
      setEnviando(false)
    }
  }

  return (
    <form className="formulario formulario-admin" onSubmit={enviar} noValidate>
      {erro && <div className="alerta" role="alert">{erro}</div>}

      <fieldset className="grupo-campos">
        <legend className="etapa-titulo">Loja</legend>
        <div className="cnpj-bloco">
          <Campo
            rotulo={cnpjOpcional ? 'CNPJ (opcional no ambiente de teste)' : 'CNPJ'}
            dica={cnpjOpcional ? 'Sem CNPJ, a API gera um fictício, que vira o login da loja.' : 'Com o CNPJ, buscamos nome, telefone e endereço na Receita.'}
            placeholder="00.000.000/0000-00"
            value={formatarCnpj(cnpj)}
            onChange={mudarCnpj}
            erro={erros.cnpj}
            autoComplete="off"
            sufixo={<span className="campo-status">{buscando && <LoaderCircle size={18} className="girando" />}</span>}
          />
          <ResultadoConsulta consulta={consulta} />
        </div>
        <CamposContato valores={loja} alterar={setLoja} erros={erros} />
      </fieldset>

      <fieldset className="grupo-campos">
        <legend className="etapa-titulo">Endereço</legend>
        <CamposEndereco valores={loja} alterar={setLoja} erros={erros} />
      </fieldset>

      <fieldset className="grupo-campos">
        <legend className="etapa-titulo">Redes sociais</legend>
        <CamposRedes valores={loja} alterar={setLoja} erros={erros} />
      </fieldset>

      <fieldset className="grupo-campos">
        <legend className="etapa-titulo">Acesso</legend>
        <CampoSenha rotulo="Senha provisória" dica="Pelo menos 6 caracteres. Passe para a loja junto com o CNPJ." value={senha.senha} onChange={(e) => setSenha({ ...senha, senha: e.target.value })} erro={erros.senha} autoComplete="new-password" required />
        <CampoSenha rotulo="Repita a senha" value={senha.confirmarSenha} onChange={(e) => setSenha({ ...senha, confirmarSenha: e.target.value })} erro={erros.confirmarsenha} autoComplete="new-password" required />
      </fieldset>

      <div className="formulario-acoes">
        <button className="botao grande" disabled={enviando || buscando}>{buscando ? 'Buscando CNPJ…' : enviando ? 'Criando…' : 'Criar loja'}</button>
      </div>
    </form>
  )
}
