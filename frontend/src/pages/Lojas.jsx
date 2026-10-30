import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronRight, MapPin, Search, X } from 'lucide-react'
import { CabecalhoPagina } from '../components/CabecalhoPagina.jsx'
import { Carregando, Erro, Vazio } from '../components/Estados.jsx'
import { Opcoes } from '../components/Opcoes.jsx'
import { useLojasComCatalogo } from '../lib/useLojasComCatalogo.js'
import { formatarPreco, iniciais } from '../lib/format.js'
import { PECAS, compararTamanhos, pecaDoItem, pecaPorId, tamanhosDaPeca } from '../lib/uniformes.js'

const OPCOES_PECA = PECAS.map((p) => ({ valor: p.id, rotulo: p.nome }))

// Busca sem diferenciar acento e maiúscula: "caparao" encontra "Caparaó".
const normalizar = (s = '') => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`

/** O que a loja tem da peça/tamanho escolhidos (ou do catálogo todo, sem filtro). */
function resumir(loja, peca, tamanho) {
  const itens = loja.uniformes.filter((u) => (!peca || pecaDoItem(u) === peca) && (!tamanho || u.tamanho === tamanho))
  const precos = itens.map((u) => u.preco)
  return {
    itens,
    menor: precos.length ? Math.min(...precos) : null,
    maior: precos.length ? Math.max(...precos) : null,
    pecas: PECAS.filter((p) => loja.uniformes.some((u) => pecaDoItem(u) === p)),
  }
}

/** RF03: lojas por cidade, agora com filtro por peça e tamanho e o preço de cada loja. */
export default function Lojas() {
  const [params, setParams] = useSearchParams()
  const peca = pecaPorId(params.get('peca'))
  const tamanho = peca ? params.get('tamanho') : null
  const cidade = params.get('cidade')
  const [texto, setTexto] = useState('')
  const { lojas, erro, carregando, recarregar } = useLojasComCatalogo()

  function mudar(chave, valor) {
    const novo = new URLSearchParams(params)
    if (valor) novo.set(chave, valor)
    else novo.delete(chave)
    if (chave === 'peca') novo.delete('tamanho')
    setParams(novo, { replace: true })
  }

  function limpar() {
    setTexto('')
    setParams({}, { replace: true })
  }

  const filtrando = !!(peca || cidade || texto)

  // Tamanhos que alguma loja tem da peça escolhida; antes de carregar, a lista completa.
  const tamanhos = peca && lojas
    ? [...new Set(lojas.flatMap((l) => l.uniformes.filter((u) => pecaDoItem(u) === peca).map((u) => u.tamanho)))].sort(compararTamanhos)
    : tamanhosDaPeca(peca)

  const cidades = lojas ? [...new Map(lojas.map((l) => [l.cidade, `${l.cidade} (${l.uf})`])).entries()] : []

  const termo = normalizar(texto.trim())
  const visiveis = (lojas ?? [])
    .filter((l) => !cidade || l.cidade === cidade)
    .filter((l) => !termo || [l.nome, l.bairro, l.cidade].some((c) => normalizar(c).includes(termo)))
    .map((l) => ({ loja: l, resumo: resumir(l, peca, tamanho) }))

  const comPeca = peca ? visiveis.filter((v) => v.resumo.itens.length > 0).sort((a, b) => a.resumo.menor - b.resumo.menor) : visiveis
  const semPeca = peca ? visiveis.filter((v) => v.resumo.itens.length === 0) : []

  return (
    <>
      <CabecalhoPagina titulo="Lojas" descricao="Escolha a peça e o tamanho para ver quem tem e por quanto. Toque na loja para ver todos os preços e o contato.">
        <div className="busca">
          <Search size={20} />
          <label htmlFor="busca-loja" className="sr-only">Buscar por nome da loja, bairro ou cidade</label>
          <input
            id="busca-loja"
            type="search"
            placeholder="Buscar por loja, bairro ou cidade"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
        </div>
      </CabecalhoPagina>

      <div className="container lojas-layout">
        <aside className="filtros" aria-label="Filtros">
          <Opcoes rotulo="Peça" opcoes={OPCOES_PECA} valor={peca?.id ?? null} alterar={(id) => mudar('peca', id === peca?.id ? null : id)} />
          {peca && (
            <Opcoes
              rotulo={peca.tipo === 'Calca' ? 'Numeração' : 'Tamanho'}
              opcoes={tamanhos}
              valor={tamanho}
              alterar={(t) => mudar('tamanho', t === tamanho ? null : t)}
              compacto
            />
          )}
          {cidades.length > 1 && (
            <Opcoes
              rotulo="Cidade"
              opcoes={cidades.map(([valor, rotulo]) => ({ valor, rotulo }))}
              valor={cidade}
              alterar={(c) => mudar('cidade', c === cidade ? null : c)}
            />
          )}
          {filtrando && (
            <button type="button" className="botao fantasma pequeno" onClick={limpar}>
              <X size={16} />
              Limpar filtros
            </button>
          )}
        </aside>

        <section className="resultados" aria-live="polite">
          {carregando && <Carregando texto="Buscando lojas e preços…" />}
          {erro && <Erro mensagem={erro.message} tentarDeNovo={recarregar} />}

          {lojas?.length === 0 && (
            <Vazio titulo="Nenhuma loja cadastrada ainda">
              <p>Conhece uma loja que vende o uniforme? Ela pode se cadastrar de graça.</p>
              <Link to="/cadastro" className="botao">Cadastrar uma loja</Link>
            </Vazio>
          )}

          {lojas?.length > 0 && (
            <>
              <p className="resultados-resumo">
                {peca
                  ? `${plural(comPeca.length, 'loja tem', 'lojas têm')} ${peca.nome.toLowerCase()}${tamanho ? ` no tamanho ${tamanho}` : ''}`
                  : plural(visiveis.length, 'loja', 'lojas')}
                {peca && comPeca.length > 1 && <span>, do menor para o maior preço</span>}
              </p>

              {comPeca.length === 0 ? (
                <Vazio titulo="Nenhuma loja encontrada">
                  <p>Tente outro tamanho, outra cidade ou limpe os filtros.</p>
                  <button type="button" className="botao secundario" onClick={limpar}>Limpar filtros</button>
                </Vazio>
              ) : peca ? (
                <ul className="lista-lojas">
                  {comPeca.map(({ loja, resumo }) => (
                    <li key={loja.id}><CartaoLoja loja={loja} resumo={resumo} peca={peca} tamanho={tamanho} /></li>
                  ))}
                </ul>
              ) : (
                <PorCidade itens={comPeca} />
              )}

              {semPeca.length > 0 && (
                <p className="resultados-sem">
                  Sem {peca.nome.toLowerCase()}{tamanho ? ` ${tamanho}` : ''} no momento: {semPeca.map(({ loja }) => (
                    <Link key={loja.id} to={`/lojas/${loja.id}`}>{loja.nome}</Link>
                  )).reduce((acc, el) => (acc.length ? [...acc, ', ', el] : [el]), [])}.
                </p>
              )}
            </>
          )}
        </section>
      </div>
    </>
  )
}

function PorCidade({ itens }) {
  const grupos = [...Map.groupBy(itens, ({ loja }) => `${loja.cidade} (${loja.uf})`)]
  return grupos.map(([nomeCidade, doGrupo]) => (
    <section key={nomeCidade} className="grupo-cidade" aria-label={nomeCidade}>
      <h2>{nomeCidade}</h2>
      <ul className="lista-lojas">
        {doGrupo.map(({ loja, resumo }) => (
          <li key={loja.id}><CartaoLoja loja={loja} resumo={resumo} /></li>
        ))}
      </ul>
    </section>
  ))
}

function listarPecas(pecas) {
  if (pecas.length === 0) return 'Ainda sem uniformes cadastrados'
  if (pecas.length === PECAS.length) return 'Todas as peças do uniforme'
  return pecas.map((p, i) => (i === 0 ? p.nome : p.nome.toLowerCase())).join(', ')
}

function opcoesDeGenero(itens) {
  const generos = new Set(itens.map((u) => u.genero))
  if (generos.size > 1) return 'Masculina e feminina'
  return generos.has('Masculino') ? 'Só masculina' : 'Só feminina'
}

function CartaoLoja({ loja, resumo, peca, tamanho }) {
  const destino = peca ? `/lojas/${loja.id}?peca=${peca.id}` : `/lojas/${loja.id}`
  const tamanhosDaLoja = peca && !tamanho ? [...new Set(resumo.itens.map((u) => u.tamanho))].sort(compararTamanhos) : []

  return (
    <Link to={destino} className="cartao-loja">
      <span className="selo" aria-hidden="true">{iniciais(loja.nome)}</span>
      <span className="cartao-loja-info">
        <strong>{loja.nome}</strong>
        <span className="cartao-loja-local"><MapPin size={15} />{loja.bairro}, {loja.cidade} ({loja.uf})</span>
        <span className="cartao-loja-pecas">
          {peca
            ? tamanho ? opcoesDeGenero(resumo.itens) : `Tamanhos: ${tamanhosDaLoja.join(', ')}`
            : listarPecas(resumo.pecas)}
        </span>
      </span>
      {resumo.menor !== null && (
        <span className="cartao-loja-preco">
          {resumo.menor !== resumo.maior && <small>a partir de</small>}
          {formatarPreco(resumo.menor)}
        </span>
      )}
      <ChevronRight size={20} className="cartao-loja-seta" />
    </Link>
  )
}
