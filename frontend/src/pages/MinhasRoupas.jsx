import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { api } from '../api/client.js'
import { Campo, CampoSelect } from '../components/Campo.jsx'
import { Carregando, Erro, Vazio } from '../components/Estados.jsx'
import { useApi } from '../lib/useApi.js'
import { formatarPreco } from '../lib/format.js'
import { CALCA_MAX, CALCA_MIN, GENEROS, MODELOS, TAMANHOS_LETRA, TIPOS, imagemPeca, nomePeca } from '../lib/uniformes.js'

const novoItem = { tipo: 'Camisa', modelo: 'Padrao', genero: 'Masculino', tamanho: 'M', preco: '' }

/** RF05–RF07: formulário à esquerda e lista à direita, como na tela de "Roupas" do TCC. */
export default function MinhasRoupas() {
  const { dados, erro, carregando, recarregar } = useApi('/api/uniformes/minhas', { auth: true })

  if (carregando) return <Carregando texto="Carregando seus uniformes…" />
  if (erro) return <Erro mensagem={erro.message} tentarDeNovo={recarregar} />
  return <Painel inicial={dados} />
}

function Painel({ inicial }) {
  const location = useLocation()
  const [itens, setItens] = useState(inicial)
  const [form, setForm] = useState(novoItem)
  const [editandoId, setEditandoId] = useState(null)
  const [erros, setErros] = useState({})
  const [mensagem, setMensagem] = useState(
    location.state?.boasVindas ? { tipo: 'sucesso', texto: 'Loja cadastrada! Agora adicione os uniformes que você vende.' } : null,
  )
  const [enviando, setEnviando] = useState(false)
  const [confirmarExclusao, setConfirmarExclusao] = useState(null)
  const [filtro, setFiltro] = useState('Todos')

  // O botão "Excluir" pede confirmação no próprio botão; a confirmação expira em 4 s.
  useEffect(() => {
    if (confirmarExclusao === null) return
    const t = setTimeout(() => setConfirmarExclusao(null), 4000)
    return () => clearTimeout(t)
  }, [confirmarExclusao])

  // Mesma regra do script.js antigo: calça tem tamanho numérico e não tem modelo.
  function mudarTipo(tipo) {
    setForm((f) => ({
      ...f,
      tipo,
      modelo: tipo === 'Camisa' ? f.modelo ?? 'Padrao' : null,
      tamanho: tipo === 'Calca' ? '' : TAMANHOS_LETRA.includes(f.tamanho) ? f.tamanho : 'M',
    }))
  }

  function editar(item) {
    setEditandoId(item.id)
    setForm({ ...item, modelo: item.modelo ?? null, preco: String(item.preco) })
    setErros({})
    setMensagem(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelar() {
    setEditandoId(null)
    setForm(novoItem)
    setErros({})
  }

  async function salvar(e) {
    e.preventDefault()
    setErros({})
    setMensagem(null)
    setEnviando(true)
    const corpo = { ...form, modelo: form.tipo === 'Camisa' ? form.modelo : null, preco: Number(String(form.preco).replace(',', '.')) }
    try {
      if (editandoId) {
        const salvo = await api(`/api/uniformes/${editandoId}`, { method: 'PUT', body: corpo, auth: true })
        setItens((lista) => lista.map((i) => (i.id === salvo.id ? salvo : i)))
        setMensagem({ tipo: 'sucesso', texto: `${nomePeca(salvo)} ${salvo.tamanho} alterada.` })
        cancelar()
      } else {
        const criado = await api('/api/uniformes', { method: 'POST', body: corpo, auth: true })
        setItens((lista) => [...lista, criado])
        setMensagem({ tipo: 'sucesso', texto: `${nomePeca(criado)} ${criado.tamanho} adicionada.` })
        setForm((f) => ({ ...f, tamanho: f.tipo === 'Calca' ? '' : f.tamanho })) // mantém tipo/preço para cadastrar o próximo tamanho
      }
    } catch (err) {
      setErros(err.campos ?? {})
      setMensagem({ tipo: 'erro', texto: err.message })
    } finally {
      setEnviando(false)
    }
  }

  async function excluir(item) {
    if (confirmarExclusao !== item.id) {
      setConfirmarExclusao(item.id)
      return
    }
    setConfirmarExclusao(null)
    try {
      await api(`/api/uniformes/${item.id}`, { method: 'DELETE', auth: true })
      setItens((lista) => lista.filter((i) => i.id !== item.id))
      if (editandoId === item.id) cancelar()
      setMensagem({ tipo: 'sucesso', texto: `${nomePeca(item)} ${item.tamanho} excluída.` })
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.message })
    }
  }

  const visiveis = filtro === 'Todos' ? itens : itens.filter((i) => i.tipo === filtro)

  return (
    <section className="secao container">
      <div className="roupas-layout">
        <form className="cartao-form" onSubmit={salvar} noValidate>
          <h1>{editandoId ? 'Alterar roupa' : 'Nova roupa'}</h1>
          {mensagem && <div className={`alerta${mensagem.tipo === 'sucesso' ? ' sucesso' : ''}`} role="status">{mensagem.texto}</div>}

          <fieldset className="grupo-campos">
            <CampoSelect rotulo="Tipo" value={form.tipo} onChange={(e) => mudarTipo(e.target.value)} opcoes={TIPOS} />
            {form.tipo === 'Camisa' && (
              <CampoSelect rotulo="Modelo" value={form.modelo ?? 'Padrao'} onChange={(e) => setForm({ ...form, modelo: e.target.value })} opcoes={MODELOS} erro={erros.modelo} />
            )}
            <div className="linha">
              <CampoSelect rotulo="Gênero" value={form.genero} onChange={(e) => setForm({ ...form, genero: e.target.value })} opcoes={GENEROS} />
              {form.tipo === 'Calca' ? (
                <Campo
                  rotulo="Tamanho (nº)"
                  type="number"
                  inputMode="numeric"
                  min={CALCA_MIN}
                  max={CALCA_MAX}
                  placeholder="42"
                  value={form.tamanho}
                  onChange={(e) => setForm({ ...form, tamanho: e.target.value })}
                  erro={erros.tamanho}
                />
              ) : (
                <CampoSelect rotulo="Tamanho" value={form.tamanho} onChange={(e) => setForm({ ...form, tamanho: e.target.value })} opcoes={TAMANHOS_LETRA} erro={erros.tamanho} />
              )}
            </div>
            <Campo
              rotulo="Preço"
              prefixo="R$"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              placeholder="0,00"
              value={form.preco}
              onChange={(e) => setForm({ ...form, preco: e.target.value })}
              erro={erros.preco}
            />
          </fieldset>

          <div className="form-acoes">
            {editandoId && <button type="button" className="botao secundario" onClick={cancelar}>Cancelar</button>}
            <button className="botao" disabled={enviando}>
              {enviando ? 'Salvando…' : editandoId ? 'Salvar alterações' : 'Adicionar roupa'}
            </button>
          </div>
        </form>

        <div>
          <div className="filtro-roupas" role="group" aria-label="Filtrar por tipo">
            {['Todos', ...TIPOS.map((t) => t.valor)].map((t) => (
              <button key={t} type="button" className="chip" aria-pressed={filtro === t} onClick={() => setFiltro(t)}>
                {TIPOS.find((x) => x.valor === t)?.rotulo ?? t} ({t === 'Todos' ? itens.length : itens.filter((i) => i.tipo === t).length})
              </button>
            ))}
          </div>

          {visiveis.length === 0 ? (
            <Vazio><p>Nenhuma roupa cadastrada{filtro !== 'Todos' ? ' deste tipo' : ''}. Use o formulário para adicionar.</p></Vazio>
          ) : (
            <ul className="lista-roupas">
              {visiveis.map((item) => (
                <li key={item.id} className={`item-roupa${editandoId === item.id ? ' editando' : ''}`}>
                  <img src={imagemPeca(item)} alt="" width="88" height="88" loading="lazy" />
                  <div>
                    <h3>{nomePeca(item)}</h3>
                    <p>{item.genero} · Tamanho {item.tamanho}</p>
                    <p className="preco">{formatarPreco(item.preco)}</p>
                  </div>
                  <div className="item-acoes">
                    <button type="button" className="icone-botao" onClick={() => editar(item)}>Editar</button>
                    <button
                      type="button"
                      className={`icone-botao perigo${confirmarExclusao === item.id ? ' confirmar' : ''}`}
                      onClick={() => excluir(item)}
                    >
                      {confirmarExclusao === item.id ? 'Confirmar' : 'Excluir'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
