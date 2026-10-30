import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Check, CircleAlert, LoaderCircle } from 'lucide-react'
import { api } from '../api/client.js'
import { useAuth } from '../auth/AuthContext.js'
import { Campo, CampoSenha } from '../components/Campo.jsx'
import { CamposContato, CamposEndereco, CamposRedes } from '../components/CamposLoja.jsx'
import { MolduraAcesso } from '../components/MolduraAcesso.jsx'
import { cnpjValido, normalizarCnpj } from '../lib/cnpj.js'
import { formatarCnpj } from '../lib/format.js'
import { lojaVazia } from '../lib/loja.js'
import { useApi } from '../lib/useApi.js'

const ETAPAS = ['Loja', 'Endereço', 'Acesso']
const TITULOS = ['Sobre a loja', 'Onde fica a loja', 'Crie sua senha']

// Em qual etapa fica cada campo, para voltar até ela quando a API apontar um erro.
const etapaDoCampo = (campo) => {
  if (['cnpj', 'nome', 'telefone', 'instagram', 'facebook'].includes(campo)) return 0
  if (campo.startsWith('endereco')) return 1
  return 2
}

function semErroDeCnpj(erros) {
  const resto = { ...erros }
  delete resto.cnpj
  return resto
}

/** Conferência rápida antes de avançar. A validação de verdade continua na API. */
function validarEtapa(etapa, { cnpj, semCnpj, loja, senha }) {
  const erros = {}
  if (etapa === 0) {
    if (!semCnpj && !cnpj) erros.cnpj = 'Informe o CNPJ.'
    else if (!semCnpj && !cnpjValido(cnpj)) erros.cnpj = 'CNPJ inválido. Confira os números.'
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
    if (senha.senha.length < 6) erros.senha = 'Use pelo menos 6 caracteres.'
    else if (senha.senha !== senha.confirmarSenha) erros.confirmarsenha = 'As senhas não conferem.'
  }
  return erros
}

/**
 * RF01: cadastro da loja em três etapas. O CNPJ vem primeiro: com ele, a API busca nome,
 * telefone e endereço na Receita e o formulário já chega preenchido.
 * Produção exige CNPJ; o ambiente de teste permite seguir sem ele (a API gera um para o login).
 */
export default function Cadastro() {
  const { cadastrar, logada } = useAuth()
  const navigate = useNavigate()
  const regras = useApi('/api/auth/regras')
  const podeSemCnpj = regras.dados?.exigirCnpj === false // na dúvida (carregando ou erro), exige

  const [etapa, setEtapa] = useState(0)
  const [cnpj, setCnpj] = useState('')
  const [semCnpj, setSemCnpj] = useState(false)
  const [consulta, setConsulta] = useState({ estado: 'parada' }) // parada | buscando | achou | falhou
  const [loja, setLoja] = useState(lojaVazia)
  const [senha, setSenha] = useState({ senha: '', confirmarSenha: '' })
  const [erro, setErro] = useState(null)
  const [erros, setErros] = useState({})
  const [enviando, setEnviando] = useState(false)
  const ultimaConsulta = useRef('')
  const tituloRef = useRef(null)
  const etapaAnterior = useRef(etapa)

  // Ao trocar de etapa, o foco vai para o título dela (leitor de tela anuncia a nova etapa).
  useEffect(() => {
    if (etapaAnterior.current !== etapa) tituloRef.current?.focus()
    etapaAnterior.current = etapa
  }, [etapa])

  if (logada && !enviando) return <Navigate to="/gerenciamento" replace />

  async function consultarCnpj(c) {
    ultimaConsulta.current = c
    setConsulta({ estado: 'buscando' })
    try {
      const dados = await api(`/api/cnpj/${c}`)
      if (ultimaConsulta.current !== c) return // o CNPJ mudou enquanto a resposta vinha
      setLoja((l) => ({
        ...l,
        nome: dados.nome,
        telefone: dados.telefone ?? l.telefone,
        endereco: {
          rua: dados.endereco.rua || l.endereco.rua,
          numero: dados.endereco.numero || l.endereco.numero,
          bairro: dados.endereco.bairro || l.endereco.bairro,
          cidade: dados.endereco.cidade || l.endereco.cidade,
          uf: dados.endereco.uf || l.endereco.uf,
        },
      }))
      setErros({})
      setConsulta({ estado: 'achou', dados })
    } catch (err) {
      if (ultimaConsulta.current !== c) return
      setConsulta({ estado: 'falhou', mensagem: err.message })
    }
  }

  function mudarCnpj(e) {
    const c = normalizarCnpj(e.target.value)
    setCnpj(c)
    if (erros.cnpj) setErros(semErroDeCnpj)
    if (c.length < 14) {
      ultimaConsulta.current = ''
      setConsulta({ estado: 'parada' })
    } else if (cnpjValido(c) && c !== ultimaConsulta.current) {
      consultarCnpj(c)
    }
  }

  function alternarSemCnpj(e) {
    setSemCnpj(e.target.checked)
    setCnpj('')
    ultimaConsulta.current = ''
    setConsulta({ estado: 'parada' })
    setErros(semErroDeCnpj)
  }

  async function enviar(e) {
    e.preventDefault()
    const form = e.currentTarget
    setErro(null)
    const locais = validarEtapa(etapa, { cnpj, semCnpj, loja, senha })
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
      const criada = await cadastrar({ ...loja, ...senha, cnpj: semCnpj ? null : cnpj })
      navigate('/gerenciamento/roupas', { replace: true, state: { boasVindas: true, cnpjGerado: semCnpj ? criada.cnpj : null } })
    } catch (err) {
      const campos = err.status === 409 ? { cnpj: err.message } : err.campos ?? {}
      setErro(err.message)
      setErros(campos)
      const comErro = Object.keys(campos).map(etapaDoCampo)
      if (comErro.length) setEtapa(Math.min(...comErro))
      setEnviando(false)
    }
  }

  const ultima = etapa === ETAPAS.length - 1
  const buscando = consulta.estado === 'buscando'

  return (
    <MolduraAcesso>
      <form className="formulario" onSubmit={enviar} noValidate>
        <h1>Cadastrar minha loja</h1>
        <p className="formulario-sub">Comece pelo CNPJ: buscamos nome, telefone e endereço na Receita Federal.</p>

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
          <h2 ref={tituloRef} tabIndex={-1} className="etapa-titulo">{TITULOS[etapa]}</h2>

          {etapa === 0 && (
            <>
              <div className="cnpj-bloco">
                <Campo
                  rotulo="CNPJ"
                  placeholder={semCnpj ? 'Será gerado no cadastro' : '00.000.000/0000-00'}
                  value={formatarCnpj(cnpj)}
                  onChange={mudarCnpj}
                  erro={erros.cnpj}
                  disabled={semCnpj}
                  autoComplete="username"
                  required={!semCnpj}
                  // O sufixo existe sempre (mesmo vazio): se a estrutura mudasse ao buscar, o campo perderia o foco.
                  sufixo={<span className="campo-status">{buscando && <LoaderCircle size={18} className="girando" />}</span>}
                />
                <ResultadoConsulta consulta={consulta} />

                {podeSemCnpj && (
                  <label className="opcao-teste">
                    <input type="checkbox" checked={semCnpj} onChange={alternarSemCnpj} />
                    <span>
                      <strong>Cadastrar sem CNPJ</strong>
                      Só no ambiente de teste. A API gera um CNPJ fictício, que vira o seu login.
                    </span>
                  </label>
                )}
              </div>
              <CamposContato valores={loja} alterar={setLoja} erros={erros} />
              <CamposRedes valores={loja} alterar={setLoja} erros={erros} />
            </>
          )}

          {etapa === 1 && <CamposEndereco valores={loja} alterar={setLoja} erros={erros} />}

          {etapa === 2 && (
            <>
              <div className="login-resumo">
                <div>
                  <span>Seu login</span>
                  <strong>{semCnpj ? 'CNPJ gerado no cadastro' : formatarCnpj(cnpj)}</strong>
                  <p>
                    {semCnpj
                      ? 'Ele aparece logo depois do cadastro. Anote para entrar das próximas vezes.'
                      : 'Para entrar na área da loja, use este CNPJ e a senha que você criar agora.'}
                  </p>
                </div>
                <button type="button" className="botao fantasma pequeno" onClick={() => setEtapa(0)}>Alterar</button>
              </div>
              <CampoSenha rotulo="Senha" dica="Pelo menos 6 caracteres." value={senha.senha} onChange={(e) => setSenha({ ...senha, senha: e.target.value })} erro={erros.senha} autoComplete="new-password" minLength={6} required />
              <CampoSenha rotulo="Repita a senha" value={senha.confirmarSenha} onChange={(e) => setSenha({ ...senha, confirmarSenha: e.target.value })} erro={erros.confirmarsenha} autoComplete="new-password" required />
            </>
          )}
        </fieldset>

        <div className="formulario-acoes">
          {etapa > 0 && (
            <button type="button" className="botao secundario grande" onClick={() => { setErros({}); setEtapa(etapa - 1) }}>Voltar</button>
          )}
          <button className="botao grande" disabled={enviando || buscando}>
            {buscando ? 'Buscando CNPJ…' : ultima ? (enviando ? 'Cadastrando…' : 'Cadastrar loja') : 'Continuar'}
          </button>
        </div>
        <p className="formulario-rodape">Já tem cadastro? <Link to="/login">Entrar</Link></p>
      </form>
    </MolduraAcesso>
  )
}

/** O que a busca do CNPJ encontrou (ou por que não encontrou). */
function ResultadoConsulta({ consulta }) {
  if (consulta.estado === 'buscando') {
    return <p className="consulta-cnpj" role="status">Buscando os dados na Receita Federal…</p>
  }
  if (consulta.estado === 'falhou') {
    return (
      <p className="consulta-cnpj aviso-leve" role="status">
        <CircleAlert size={18} />
        <span>{consulta.mensagem}</span>
      </p>
    )
  }
  if (consulta.estado !== 'achou') return null

  const { dados } = consulta
  return (
    <div className={`consulta-cnpj achou${dados.ativa ? '' : ' inativa'}`} role="status">
      {dados.ativa ? <Check size={18} /> : <CircleAlert size={18} />}
      <div>
        <strong>{dados.razaoSocial}</strong>
        <span>
          {dados.ativa
            ? 'Preenchemos nome, telefone e endereço com os dados da Receita. Confira antes de continuar.'
            : `Situação na Receita: ${dados.situacao}. Confira se o CNPJ está certo.`}
        </span>
      </div>
    </div>
  )
}
