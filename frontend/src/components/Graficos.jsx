import { useId, useState } from 'react'
import { BarChart3, Table } from 'lucide-react'
import { SERIES } from '../lib/series.js'

/*
 * Gráficos do painel do admin, em HTML puro (sem biblioteca), seguindo a skill de dataviz:
 * - barras finas (no máximo 24px), ponta arredondada de 4px e base reta;
 * - 2px de espaço entre partes que se tocam (pilhas);
 * - rótulo só no fim da barra, legenda sempre que há 2 séries ou mais;
 * - texto nunca na cor da série (a cor fica na marca);
 * - dica no hover e no foco do teclado, com o valor em destaque;
 * - todo gráfico tem a versão em tabela.
 * Cores (validadas com validate_palette.js no fundo branco): série única = verde da marca;
 * duas séries = verde + violeta. Verde + laranja reprovou para daltonismo protan.
 */

/** Moldura de cada gráfico: título, alternância gráfico/tabela e a dica flutuante. */
export function CartaoGrafico({ titulo, descricao, legenda, tabela, children, largo = false }) {
  const [verTabela, setVerTabela] = useState(false)
  const [dica, setDica] = useState(null)
  const idTitulo = useId()

  // Posiciona a dica acima da marca (mouse ou foco), dentro do cartão.
  function mostrar(elemento, conteudo) {
    const cartao = elemento.closest('.grafico').getBoundingClientRect()
    const r = elemento.getBoundingClientRect()
    setDica({ x: r.left + r.width / 2 - cartao.left, y: r.top - cartao.top, conteudo })
  }
  const esconder = () => setDica(null)

  return (
    <figure className={`grafico${largo ? ' largo' : ''}`} aria-labelledby={idTitulo}>
      <div className="grafico-topo">
        <div>
          <h2 id={idTitulo}>{titulo}</h2>
          {descricao && <p>{descricao}</p>}
        </div>
        {tabela && (
          <button type="button" className="botao fantasma pequeno" onClick={() => { setVerTabela((v) => !v); esconder() }} aria-pressed={verTabela}>
            {verTabela ? <BarChart3 size={16} /> : <Table size={16} />}
            {verTabela ? 'Ver gráfico' : 'Ver tabela'}
          </button>
        )}
      </div>

      {!verTabela && legenda}
      {verTabela ? tabela : children({ mostrar, esconder })}

      {dica && (
        <div className="dica" style={{ left: dica.x, top: dica.y }} role="status">
          {dica.conteudo}
        </div>
      )}
    </figure>
  )
}

/** Legenda: um quadradinho da cor da série + o nome (em cor de texto). */
export function Legenda({ itens }) {
  return (
    <ul className="legenda">
      {itens.map((i) => (
        <li key={i.rotulo}><span className="legenda-cor" style={{ background: i.cor }} aria-hidden="true" />{i.rotulo}</li>
      ))}
    </ul>
  )
}

/** Conteúdo da dica: valor forte primeiro, o nome depois. */
export function ConteudoDica({ titulo, linhas }) {
  return (
    <>
      {titulo && <span className="dica-titulo">{titulo}</span>}
      {linhas.map((l) => (
        <span key={l.rotulo} className="dica-linha">
          {l.cor && <span className="dica-traco" style={{ background: l.cor }} aria-hidden="true" />}
          <strong>{l.valor}</strong> {l.rotulo}
        </span>
      ))}
    </>
  )
}

/** Props de hover/foco de uma marca: o elemento da marca é o alvo, maior que a parte pintada. */
const interativo = (mostrar, esconder, conteudo, rotuloAcessivel) => ({
  tabIndex: 0,
  'aria-label': rotuloAcessivel,
  onPointerEnter: (e) => mostrar(e.currentTarget, conteudo),
  onPointerLeave: esconder,
  onFocus: (e) => mostrar(e.currentTarget, conteudo),
  onBlur: esconder,
})

/** Barras horizontais ordenadas, uma série. `dados`: [{ rotulo, valor, detalhe? }] */
export function BarrasHorizontais({ dados, unidade, mostrar, esconder }) {
  const maximo = Math.max(1, ...dados.map((d) => d.valor))
  return (
    <ul className="barras-h">
      {dados.map((d) => (
        <li key={d.rotulo}>
          <span className="barras-h-rotulo">{d.rotulo}</span>
          <span
            className="barras-h-linha"
            {...interativo(mostrar, esconder,
              <ConteudoDica titulo={d.rotulo} linhas={[{ valor: d.valor, rotulo: unidade(d.valor) }, ...(d.detalhe ? [{ valor: '', rotulo: d.detalhe }] : [])]} />,
              `${d.rotulo}: ${d.valor} ${unidade(d.valor)}`)}
          >
            <span className="barra" style={{ width: `${(d.valor / maximo) * 100}%`, background: SERIES.unica }} />
            <span className="barra-valor">{d.valor}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

/** Barras horizontais empilhadas (duas séries), com o total na ponta. */
export function BarrasEmpilhadas({ dados, series, unidade, mostrar, esconder }) {
  const maximo = Math.max(1, ...dados.map((d) => series.reduce((s, x) => s + d[x.chave], 0)))
  return (
    <ul className="barras-h">
      {dados.map((d) => {
        const total = series.reduce((s, x) => s + d[x.chave], 0)
        const conteudo = (
          <ConteudoDica
            titulo={d.rotulo}
            linhas={[...series.map((x) => ({ valor: d[x.chave], rotulo: x.rotulo, cor: x.cor })), { valor: total, rotulo: `no total` }]}
          />
        )
        return (
          <li key={d.rotulo}>
            <span className="barras-h-rotulo">{d.rotulo}</span>
            <span
              className="barras-h-linha"
              {...interativo(mostrar, esconder, conteudo,
                `${d.rotulo}: ${series.map((x) => `${d[x.chave]} ${x.rotulo.toLowerCase()}`).join(', ')}, ${total} ${unidade(total)}`)}
            >
              <span className="pilha" style={{ width: `${(total / maximo) * 100}%` }}>
                {series.filter((x) => d[x.chave] > 0).map((x) => (
                  <span key={x.chave} className="pilha-parte" style={{ flexGrow: d[x.chave], background: x.cor }} />
                ))}
              </span>
              <span className="barra-valor">{total}</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}

/** Colunas para categorias em ordem (tamanhos). Valor em cima de cada coluna. */
export function Colunas({ dados, unidade, mostrar, esconder }) {
  const maximo = Math.max(1, ...dados.map((d) => d.valor))
  return (
    <div className="colunas" style={{ '--colunas': dados.length }}>
      {dados.map((d) => (
        <div
          key={d.rotulo}
          className="coluna"
          {...interativo(mostrar, esconder,
            <ConteudoDica titulo={`Tamanho ${d.rotulo}`} linhas={[{ valor: d.valor, rotulo: unidade(d.valor) }]} />,
            `Tamanho ${d.rotulo}: ${d.valor} ${unidade(d.valor)}`)}
        >
          <span className="coluna-area">
            <span className="coluna-valor">{d.valor}</span>
            <span className="coluna-barra" style={{ height: `${(d.valor / maximo) * 100}%`, background: SERIES.unica }} />
          </span>
          <span className="coluna-rotulo">{d.rotulo}</span>
        </div>
      ))}
    </div>
  )
}

/**
 * Faixa de preço por peça: traço do menor ao maior preço, ponto na média.
 * É posição, não comprimento, então a escala não precisa começar no zero.
 */
export function FaixasDePreco({ dados, formatar, mostrar, esconder }) {
  const menor = Math.min(...dados.map((d) => d.minimo))
  const maior = Math.max(...dados.map((d) => d.maximo))
  const passo = maior - menor > 40 ? 20 : maior - menor > 15 ? 10 : 5
  const inicio = Math.floor(menor / passo) * passo
  const fim = Math.max(inicio + passo, Math.ceil(maior / passo) * passo)
  const pos = (v) => `${((v - inicio) / (fim - inicio)) * 100}%`
  const marcas = Array.from({ length: (fim - inicio) / passo + 1 }, (_, i) => inicio + i * passo)

  return (
    <div className="faixas">
      <ul>
        {dados.map((d) => (
          <li key={d.rotulo}>
            <span className="barras-h-rotulo">{d.rotulo}</span>
            <span
              className="faixa-trilho"
              {...interativo(mostrar, esconder,
                <ConteudoDica titulo={d.rotulo} linhas={[
                  { valor: formatar(d.media), rotulo: 'em média' },
                  { valor: formatar(d.minimo), rotulo: 'o menor' },
                  { valor: formatar(d.maximo), rotulo: 'o maior' },
                  { valor: d.lojas, rotulo: d.lojas === 1 ? 'loja vende' : 'lojas vendem' },
                ]} />,
                `${d.rotulo}: média ${formatar(d.media)}, de ${formatar(d.minimo)} a ${formatar(d.maximo)}`)}
            >
              <span className="faixa-linha" style={{ left: pos(d.minimo), width: `calc(${pos(d.maximo)} - ${pos(d.minimo)})` }} />
              <span className="faixa-ponto" style={{ left: pos(d.minimo) }} />
              <span className="faixa-ponto" style={{ left: pos(d.maximo) }} />
              <span className="faixa-ponto media" style={{ left: pos(d.media) }} />
            </span>
            <span className="faixa-media">{formatar(d.media)}</span>
          </li>
        ))}
      </ul>
      <div className="faixa-eixo" aria-hidden="true">
        <span className="barras-h-rotulo" />
        <span className="faixa-marcas">
          {marcas.map((m) => <span key={m} style={{ left: pos(m) }}>{formatar(m).replace(',00', '')}</span>)}
        </span>
        <span className="faixa-media" />
      </div>
    </div>
  )
}

/** Tabela equivalente de qualquer gráfico. */
export function TabelaGrafico({ colunas, linhas }) {
  return (
    <table className="tabela tabela-grafico">
      <thead>
        <tr>{colunas.map((c, i) => <th key={c} scope="col" className={i > 0 ? 'numero' : undefined}>{c}</th>)}</tr>
      </thead>
      <tbody>
        {linhas.map((l) => (
          <tr key={l[0]}>
            {l.map((v, i) => (i === 0 ? <th key={i} scope="row">{v}</th> : <td key={i} className="numero">{v}</td>))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
