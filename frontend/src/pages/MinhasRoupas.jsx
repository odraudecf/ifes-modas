import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Pencil, Plus, Trash, X } from 'lucide-react'
import { api } from '../api/client.js'
import { Campo } from '../components/Campo.jsx'
import { Opcoes } from '../components/Opcoes.jsx'
import { Carregando, Erro, Vazio } from '../components/Estados.jsx'
import { useApi } from '../lib/useApi.js'
import { formatarPreco } from '../lib/format.js'
import { GENEROS, PECAS, TAMANHOS_CALCA, compararTamanhos, descreverItem, generoNaPeca, pecaDoItem, pecaPorId, tamanhosDaPeca } from '../lib/uniformes.js'

const OPCOES_PECA = PECAS.map((p) => ({ valor: p.id, rotulo: p.nome, imagem: p.imagem }))

/** RF05–RF07: catálogo da loja. Adicionar abre um painel onde se marcam vários tamanhos de uma vez. */
export default function MinhasRoupas() {
  const { dados, erro, carregando, recarregar } = useApi('/api/uniformes/minhas', { auth: true })

  if (carregando) return <Carregando texto="Carregando suas roupas…" />
  if (erro) return <Erro mensagem={erro.message} tentarDeNovo={recarregar} />
  return <Catalogo inicial={dados} />
}

function Catalogo({ inicial }) {
  const location = useLocation()
  const [itens, setItens] = useState(inicial)
  const [filtro, setFiltro] = useState('todas')
  const [painel, setPainel] = useState(null) // null | { item } (item null = adicionar)
  const [confirmarExclusao, setConfirmarExclusao] = useState(null)
  // Ao abrir "Adicionar" de novo, peça, gênero e preço continuam marcados
  // (o lojista costuma cadastrar a mesma peça no outro gênero logo em seguida).
  const [ultimoNovo, setUltimoNovo] = useState({ pecaId: 'camisa-padrao', genero: 'Masculino', preco: '' })
  const [mensagem, setMensagem] = useState(
    location.state?.boasVindas
      ? {
          tipo: 'sucesso',
          texto: location.state.cnpjGerado
            ? `Loja cadastrada. Anote seu login: CNPJ ${location.state.cnpjGerado} (gerado para teste). Agora adicione os uniformes que você vende.`
            : 'Loja cadastrada. Agora adicione os uniformes que você vende.',
        }
      : null,
  )

  // O botão "Excluir" pede confirmação no próprio botão; a confirmação expira em 4 s.
  useEffect(() => {
    if (confirmarExclusao === null) return
    const t = setTimeout(() => setConfirmarExclusao(null), 4000)
    return () => clearTimeout(t)
  }, [confirmarExclusao])

  async function excluir(item) {
    if (confirmarExclusao !== item.id) {
      setConfirmarExclusao(item.id)
      return
    }
    setConfirmarExclusao(null)
    try {
      await api(`/api/uniformes/${item.id}`, { method: 'DELETE', auth: true })
      setItens((lista) => lista.filter((i) => i.id !== item.id))
      setMensagem({ tipo: 'sucesso', texto: `${descreverItem(item)} excluída.` })
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.message })
    }
  }

  function aoSalvar({ criados = [], alterado, texto, form }) {
    if (form) setUltimoNovo({ pecaId: form.pecaId, genero: form.genero, preco: form.preco })
    setItens((lista) => [...lista.map((i) => (i.id === alterado?.id ? alterado : i)), ...criados])
    setMensagem({ tipo: 'sucesso', texto })
    setPainel(null)
  }

  const contagem = (peca) => itens.filter((i) => pecaDoItem(i) === peca).length
  const pecasVisiveis = PECAS.filter((p) => (filtro === 'todas' || filtro === p.id) && contagem(p) > 0)

  return (
    <>
      <div className="painel-cabeca com-acao">
        <div>
          <h1>Roupas</h1>
          <p>{itens.length === 1 ? '1 item cadastrado' : `${itens.length} itens cadastrados`}. Cada item é uma peça, um gênero e um tamanho.</p>
        </div>
        <button type="button" className="botao grande" onClick={() => setPainel({ item: null })}>
          <Plus size={20} />
          Adicionar roupas
        </button>
      </div>

      {mensagem && (
        <div className={`alerta${mensagem.tipo === 'sucesso' ? ' sucesso' : ''}`} role="status">
          <p>{mensagem.texto}</p>
          <button type="button" className="alerta-fechar" onClick={() => setMensagem(null)}>
            <X size={18} />
            <span className="sr-only">Fechar aviso</span>
          </button>
        </div>
      )}

      {itens.length === 0 ? (
        <Vazio titulo="Nenhuma roupa cadastrada">
          <p>Adicione as peças que você vende. Dá para marcar vários tamanhos de uma vez.</p>
          <button type="button" className="botao" onClick={() => setPainel({ item: null })}>Adicionar roupas</button>
        </Vazio>
      ) : (
        <>
          <div className="filtro-roupas">
            <Opcoes
              rotulo="Mostrar"
              opcoes={[{ valor: 'todas', rotulo: `Todas (${itens.length})` }, ...PECAS.filter((p) => contagem(p) > 0).map((p) => ({ valor: p.id, rotulo: `${p.nome} (${contagem(p)})` }))]}
              valor={filtro}
              alterar={setFiltro}
              compacto
            />
          </div>

          {pecasVisiveis.map((peca) => {
            const daPeca = itens
              .filter((i) => pecaDoItem(i) === peca)
              .sort((a, b) => GENEROS.indexOf(a.genero) - GENEROS.indexOf(b.genero) || compararTamanhos(a.tamanho, b.tamanho))
            return (
              <section key={peca.id} className="grupo-roupas" aria-labelledby={`grupo-${peca.id}`}>
                <div className="grupo-roupas-cabeca">
                  <img src={peca.imagem} alt="" width="48" height="48" />
                  <h2 id={`grupo-${peca.id}`}>{peca.plural}</h2>
                </div>
                <ul className="linhas-roupa">
                  {daPeca.map((item) => (
                    <li key={item.id} className="linha-roupa">
                      <span className="linha-roupa-genero">{item.genero}</span>
                      <span className="linha-roupa-tamanho">{item.tamanho}</span>
                      <span className="linha-roupa-preco">{formatarPreco(item.preco)}</span>
                      <span className="linha-roupa-acoes">
                        <button type="button" className="botao fantasma pequeno" onClick={() => setPainel({ item })} aria-label={`Editar ${descreverItem(item)}`}>
                          <Pencil size={16} />
                          <span aria-hidden="true">Editar</span>
                        </button>
                        <button
                          type="button"
                          className={`botao pequeno ${confirmarExclusao === item.id ? 'perigo-cheio' : 'fantasma perigo'}`}
                          onClick={() => excluir(item)}
                          aria-label={confirmarExclusao === item.id ? `Confirmar exclusão de ${descreverItem(item)}` : `Excluir ${descreverItem(item)}`}
                        >
                          <Trash size={16} />
                          <span aria-hidden="true">{confirmarExclusao === item.id ? 'Confirmar' : 'Excluir'}</span>
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </>
      )}

      {painel && <PainelRoupa item={painel.item} itens={itens} ultimoNovo={ultimoNovo} fechar={() => setPainel(null)} aoSalvar={aoSalvar} />}
    </>
  )
}

/** Painel lateral (dialog nativo: foco preso, Esc fecha) para adicionar ou alterar roupas. */
function PainelRoupa({ item, itens, ultimoNovo, fechar, aoSalvar }) {
  const dialogRef = useRef(null)
  const editando = item !== null
  const [form, setForm] = useState(() => (editando
    ? { pecaId: pecaDoItem(item).id, genero: item.genero, tamanhos: [item.tamanho], preco: String(item.preco) }
    : { ...ultimoNovo, tamanhos: [] }))
  const [erros, setErros] = useState({})
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)

  // Sem close() na limpeza: o evento "close" chegaria depois e fecharia o painel recém-aberto
  // (o StrictMode monta duas vezes). Ao desmontar, o dialog sai da página junto com o componente.
  useEffect(() => {
    if (!dialogRef.current.open) dialogRef.current.showModal()
  }, [])

  const peca = pecaPorId(form.pecaId)
  let opcoesTamanho = tamanhosDaPeca(peca)
  // Calça com numeração ímpar (cadastrada antes) continua aparecendo na edição.
  if (peca.tipo === 'Calca' && editando && !TAMANHOS_CALCA.includes(item.tamanho)) {
    opcoesTamanho = [...opcoesTamanho, item.tamanho].sort(compararTamanhos)
  }

  // Tamanhos que já existem para esta peça e gênero não podem ser cadastrados de novo.
  const jaCadastrados = itens
    .filter((i) => pecaDoItem(i) === peca && i.genero === form.genero && i.id !== item?.id)
    .map((i) => i.tamanho)

  function mudarPeca(pecaId) {
    const nova = pecaPorId(pecaId)
    const mesmaGrade = (nova.tipo === 'Calca') === (peca.tipo === 'Calca')
    setForm({ ...form, pecaId, tamanhos: mesmaGrade ? form.tamanhos : [] })
  }

  async function salvar(e) {
    e.preventDefault()
    setErro(null)
    const preco = Number(String(form.preco).replace(',', '.'))
    const locais = {}
    const tamanhos = form.tamanhos.filter((t) => !jaCadastrados.includes(t))
    if (tamanhos.length === 0) locais.tamanho = editando ? 'Escolha o tamanho.' : 'Marque pelo menos um tamanho.'
    if (!(preco > 0)) locais.preco = 'Informe o preço.'
    setErros(locais)
    if (Object.keys(locais).length) return

    const base = { tipo: peca.tipo, modelo: peca.modelo, genero: form.genero, preco }
    setEnviando(true)

    if (editando) {
      try {
        const alterado = await api(`/api/uniformes/${item.id}`, { method: 'PUT', body: { ...base, tamanho: tamanhos[0] }, auth: true })
        aoSalvar({ alterado, texto: `${descreverItem(alterado)} alterada.` })
      } catch (err) {
        setErro(err.message)
        setErros(err.campos ?? {})
        setEnviando(false)
      }
      return
    }

    // A API cadastra um item por vez; os tamanhos marcados vão em sequência.
    const criados = []
    try {
      for (const tamanho of [...tamanhos].sort(compararTamanhos)) {
        criados.push(await api('/api/uniformes', { method: 'POST', body: { ...base, tamanho }, auth: true }))
      }
      const qtd = criados.length === 1 ? `Tamanho ${criados[0].tamanho}` : `${criados.length} tamanhos`
      aoSalvar({ criados, form, texto: `${qtd} de ${peca.nome.toLowerCase()} ${generoNaPeca(form.genero)} adicionado${criados.length > 1 ? 's' : ''}.` })
    } catch (err) {
      // Os que entraram antes do erro ficam salvos; o painel continua aberto com o restante.
      if (criados.length) aoSalvar({ criados, form, texto: `${criados.length} adicionado(s) antes de um erro: ${err.message}` })
      else {
        setErro(err.message)
        setErros(err.campos ?? {})
        setEnviando(false)
      }
    }
  }

  const qtd = form.tamanhos.filter((t) => !jaCadastrados.includes(t)).length

  return (
    <dialog
      ref={dialogRef}
      className="gaveta"
      aria-labelledby="gaveta-titulo"
      onClose={fechar}
      onClick={(e) => { if (e.target === dialogRef.current) fechar() }}
    >
      <form className="gaveta-conteudo" onSubmit={salvar} noValidate>
        <div className="gaveta-cabeca">
          <h2 id="gaveta-titulo">{editando ? 'Alterar roupa' : 'Adicionar roupas'}</h2>
          <button type="button" className="botao fantasma quadrado" onClick={fechar}>
            <X size={20} />
            <span className="sr-only">Fechar</span>
          </button>
        </div>

        <div className="gaveta-corpo">
          {erro && <div className="alerta" role="alert">{erro}</div>}

          <Opcoes rotulo="Peça" opcoes={OPCOES_PECA} valor={form.pecaId} alterar={mudarPeca} erro={erros.modelo ?? erros.tipo} />
          <Opcoes rotulo="Gênero" opcoes={GENEROS} valor={form.genero} alterar={(genero) => setForm({ ...form, genero })} />
          <Opcoes
            rotulo={editando ? 'Tamanho' : 'Tamanhos'}
            opcoes={opcoesTamanho}
            multiplo={!editando}
            valor={editando ? form.tamanhos[0] : form.tamanhos}
            alterar={(v) => setForm({ ...form, tamanhos: editando ? [v] : v })}
            desabilitadas={jaCadastrados}
            dica={jaCadastrados.length ? 'Tamanhos riscados já estão cadastrados. Para mudar o preço deles, use Editar na lista.' : editando ? undefined : 'Marque todos os tamanhos que têm o mesmo preço.'}
            erro={erros.tamanho}
            compacto
          />
          <Campo
            rotulo={editando || qtd <= 1 ? 'Preço' : 'Preço de cada tamanho'}
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
        </div>

        <div className="gaveta-rodape">
          <button type="button" className="botao secundario grande" onClick={fechar}>Cancelar</button>
          <button className="botao grande" disabled={enviando}>
            {enviando ? 'Salvando…' : editando ? 'Salvar alteração' : qtd > 1 ? `Adicionar ${qtd} tamanhos` : 'Adicionar'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
