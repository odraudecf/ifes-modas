import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { useAuth } from '../auth/AuthContext.js'
import { Campo, CampoSenha } from '../components/Campo.jsx'
import { CamposContato, CamposEndereco, CamposRedes } from '../components/CamposLoja.jsx'
import { MolduraAcesso } from '../components/MolduraAcesso.jsx'
import { formatarCnpj } from '../lib/format.js'
import { lojaVazia } from '../lib/loja.js'

const ETAPAS = ['Loja', 'Endereço', 'Acesso']

// Em qual etapa fica cada campo, para voltar até ela quando a API apontar um erro.
const etapaDoCampo = (campo) => {
  if (['nome', 'telefone', 'instagram', 'facebook'].includes(campo)) return 0
  if (campo.startsWith('endereco')) return 1
  return 2
}

/** Conferência rápida antes de avançar. A validação de verdade continua na API. */
function validarEtapa(etapa, loja, acesso) {
  const erros = {}
  if (etapa === 0) {
    if (loja.nome.trim().length < 2) erros.nome = 'Informe o nome da loja.'
    if (loja.telefone.length < 10) erros.telefone = 'Informe o telefone com DDD.'
  }
  if (etapa === 1) {
    if (!loja.endereco.rua.trim()) erros['endereco.rua'] = 'Informe a rua.'
    if (!loja.endereco.numero.trim()) erros['endereco.numero'] = 'Informe o número ou S/N.'
    if (!loja.endereco.bairro.trim()) erros['endereco.bairro'] = 'Informe o bairro.'
    if (!loja.endereco.cidade.trim()) erros['endereco.cidade'] = 'Informe a cidade.'
  }
  if (etapa === 2) {
    if (acesso.cnpj.replace(/[^0-9A-Z]/gi, '').length !== 14) erros.cnpj = 'O CNPJ tem 14 caracteres.'
    if (acesso.senha.length < 6) erros.senha = 'Use pelo menos 6 caracteres.'
    else if (acesso.senha !== acesso.confirmarSenha) erros.confirmarsenha = 'As senhas não conferem.'
  }
  return erros
}

/** RF01: cadastro da loja em três etapas. A API devolve o token e a loja já entra logada. */
export default function Cadastro() {
  const { cadastrar, logada } = useAuth()
  const navigate = useNavigate()
  const [etapa, setEtapa] = useState(0)
  const [loja, setLoja] = useState(lojaVazia)
  const [acesso, setAcesso] = useState({ cnpj: '', senha: '', confirmarSenha: '' })
  const [erro, setErro] = useState(null)
  const [erros, setErros] = useState({})
  const [enviando, setEnviando] = useState(false)
  const tituloRef = useRef(null)
  const etapaAnterior = useRef(etapa)

  // Ao trocar de etapa, o foco vai para o título dela (leitor de tela anuncia a nova etapa).
  useEffect(() => {
    if (etapaAnterior.current !== etapa) tituloRef.current?.focus()
    etapaAnterior.current = etapa
  }, [etapa])

  if (logada && !enviando) return <Navigate to="/gerenciamento" replace />

  async function enviar(e) {
    e.preventDefault()
    const form = e.currentTarget
    setErro(null)
    const locais = validarEtapa(etapa, loja, acesso)
    setErros(locais)
    if (Object.keys(locais).length > 0) {
      // Leva o foco ao primeiro campo com erro, depois que o React marcar os campos.
      requestAnimationFrame(() => form.querySelector('[aria-invalid="true"]')?.focus())
      return
    }

    if (etapa < ETAPAS.length - 1) {
      setEtapa(etapa + 1)
      return
    }

    setEnviando(true)
    try {
      await cadastrar({ ...loja, ...acesso })
      navigate('/gerenciamento/roupas', { replace: true, state: { boasVindas: true } })
    } catch (err) {
      const campos = err.campos ?? {}
      setErro(err.message)
      setErros(campos)
      const comErro = Object.keys(campos).map(etapaDoCampo)
      if (comErro.length) setEtapa(Math.min(...comErro))
      setEnviando(false)
    }
  }

  const acessoCampo = (nome) => (e) => setAcesso({ ...acesso, [nome]: e.target.value })
  const ultima = etapa === ETAPAS.length - 1

  return (
    <MolduraAcesso>
      <form className="formulario" onSubmit={enviar} noValidate>
        <h1>Cadastrar minha loja</h1>
        <p className="formulario-sub">Leva uns 2 minutos. Depois você já adiciona os uniformes.</p>

        <ol className="etapas" aria-label="Etapas do cadastro">
          {ETAPAS.map((nome, i) => (
            <li key={nome} className={i < etapa ? 'feita' : undefined} aria-current={i === etapa ? 'step' : undefined}>
              <span className="etapa-marca">{i < etapa ? <Check size={14} /> : i + 1}</span>
              {nome}
            </li>
          ))}
        </ol>

        {erro && <div className="alerta" role="alert">{erro}</div>}

        <fieldset className="grupo-campos">
          <legend className="sr-only">{ETAPAS[etapa]}</legend>
          <h2 ref={tituloRef} tabIndex={-1} className="etapa-titulo">
            {['Sobre a loja', 'Onde fica a loja', 'Dados de acesso'][etapa]}
          </h2>

          {etapa === 0 && (
            <>
              <CamposContato valores={loja} alterar={setLoja} erros={erros} />
              <CamposRedes valores={loja} alterar={setLoja} erros={erros} />
            </>
          )}
          {etapa === 1 && <CamposEndereco valores={loja} alterar={setLoja} erros={erros} />}
          {etapa === 2 && (
            <>
              <Campo
                rotulo="CNPJ"
                dica="Você vai usar o CNPJ para entrar."
                placeholder="00.000.000/0000-00"
                value={formatarCnpj(acesso.cnpj)}
                onChange={acessoCampo('cnpj')}
                erro={erros.cnpj}
                autoComplete="username"
                required
              />
              <CampoSenha rotulo="Senha" dica="Pelo menos 6 caracteres." value={acesso.senha} onChange={acessoCampo('senha')} erro={erros.senha} autoComplete="new-password" minLength={6} required />
              <CampoSenha rotulo="Repita a senha" value={acesso.confirmarSenha} onChange={acessoCampo('confirmarSenha')} erro={erros.confirmarsenha} autoComplete="new-password" required />
            </>
          )}
        </fieldset>

        <div className="formulario-acoes">
          {etapa > 0 && (
            <button type="button" className="botao secundario grande" onClick={() => { setErros({}); setEtapa(etapa - 1) }}>Voltar</button>
          )}
          <button className="botao grande" disabled={enviando}>
            {ultima ? (enviando ? 'Cadastrando…' : 'Cadastrar loja') : 'Continuar'}
          </button>
        </div>
        <p className="formulario-rodape">Já tem cadastro? <Link to="/login">Entrar</Link></p>
      </form>
    </MolduraAcesso>
  )
}
