import { Link } from 'react-router-dom'
import { CircleAlert } from 'lucide-react'
import { Carregando, Erro } from '../../components/Estados.jsx'
import {
  BarrasEmpilhadas, BarrasHorizontais, CartaoGrafico, Colunas, FaixasDePreco, Legenda, TabelaGrafico,
} from '../../components/Graficos.jsx'
import { SERIES } from '../../lib/series.js'
import { useApi } from '../../lib/useApi.js'
import { formatarPreco } from '../../lib/format.js'
import { pecaDoItem } from '../../lib/uniformes.js'

const plural = (um, varios) => (n) => (n === 1 ? um : varios)
const lojasTxt = plural('loja', 'lojas')
const itensTxt = plural('item', 'itens')
const dataCurta = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

const GENEROS = [
  { chave: 'masculino', rotulo: 'Masculino', cor: SERIES.masculino },
  { chave: 'feminino', rotulo: 'Feminino', cor: SERIES.feminino },
]

/** Painel do administrador: números dos cadastros do sistema. */
export default function Painel() {
  const { dados, erro, carregando, recarregar } = useApi('/api/admin/painel', { auth: true })

  if (carregando) return <Carregando texto="Somando os cadastros…" />
  if (erro) return <Erro mensagem={erro.message} tentarDeNovo={recarregar} />

  const { totais } = dados
  const cidades = dados.lojasPorCidade.map((c) => ({ rotulo: `${c.cidade} (${c.uf})`, valor: c.lojas }))
  const pecas = dados.itensPorPeca.map((p) => ({ rotulo: pecaDoItem(p)?.nome ?? p.tipo, masculino: p.masculino, feminino: p.feminino }))
  const tamanhos = dados.tamanhos.map((t) => ({ rotulo: t.tamanho, valor: t.itens }))
  const calcas = dados.numeracaoCalca.map((t) => ({ rotulo: t.tamanho, valor: t.itens }))
  const precos = dados.precosPorPeca.map((p) => ({ rotulo: pecaDoItem(p)?.nome ?? p.tipo, ...p }))

  return (
    <>
      <div className="painel-cabeca">
        <h1>Painel</h1>
        <p>Retrato dos cadastros do Ifes Modas agora. Passe o mouse (ou o foco do teclado) nas barras para ver os números.</p>
      </div>

      <dl className="indicadores">
        <div>
          <dt>Lojas</dt>
          <dd>{totais.lojas}</dd>
          <span>em {totais.cidades} {totais.cidades === 1 ? 'cidade' : 'cidades'} de {totais.estados} {totais.estados === 1 ? 'estado' : 'estados'}</span>
        </div>
        <div>
          <dt>Itens no catálogo</dt>
          <dd>{totais.itens}</dd>
          <span>cada um é uma peça, um gênero e um tamanho</span>
        </div>
        <div className={totais.lojasSemCatalogo > 0 ? 'atencao' : undefined}>
          <dt>Lojas sem catálogo</dt>
          <dd>{totais.lojasSemCatalogo}</dd>
          <span>
            {totais.lojasSemCatalogo > 0
              ? <><CircleAlert size={14} /> aparecem sem preços para os alunos</>
              : 'todas têm uniformes cadastrados'}
          </span>
        </div>
        <div>
          <dt>Administradores</dt>
          <dd>{totais.administradores}</dd>
          <span><Link to="/admin/usuarios">ver usuários</Link></span>
        </div>
      </dl>

      <div className="graficos">
        <CartaoGrafico
          titulo="Onde ficam as lojas"
          descricao="Lojas cadastradas por cidade, da que tem mais para a que tem menos."
          tabela={<TabelaGrafico colunas={['Cidade', 'Lojas']} linhas={cidades.map((c) => [c.rotulo, c.valor])} />}
        >
          {(dica) => (cidades.length
            ? <BarrasHorizontais dados={cidades} unidade={lojasTxt} {...dica} />
            : <p className="grafico-vazio">Nenhuma loja cadastrada ainda.</p>)}
        </CartaoGrafico>

        <CartaoGrafico
          titulo="Itens por peça"
          descricao="Quantos itens cada peça tem no catálogo de todas as lojas, por gênero."
          legenda={<Legenda itens={GENEROS} />}
          tabela={<TabelaGrafico colunas={['Peça', 'Masculino', 'Feminino', 'Total']} linhas={pecas.map((p) => [p.rotulo, p.masculino, p.feminino, p.masculino + p.feminino])} />}
        >
          {(dica) => <BarrasEmpilhadas dados={pecas} series={GENEROS} unidade={itensTxt} {...dica} />}
        </CartaoGrafico>

        <CartaoGrafico
          titulo="Tamanhos de camisas e bermudas"
          descricao="Itens cadastrados em cada tamanho, do menor para o maior."
          tabela={<TabelaGrafico colunas={['Tamanho', 'Itens']} linhas={tamanhos.map((t) => [t.rotulo, t.valor])} />}
        >
          {(dica) => <Colunas dados={tamanhos} unidade={itensTxt} {...dica} />}
        </CartaoGrafico>

        <CartaoGrafico
          titulo="Numeração das calças"
          descricao="Itens de calça cadastrados em cada número."
          tabela={<TabelaGrafico colunas={['Número', 'Itens']} linhas={calcas.map((t) => [t.rotulo, t.valor])} />}
        >
          {(dica) => (calcas.length
            ? <Colunas dados={calcas} unidade={itensTxt} {...dica} />
            : <p className="grafico-vazio">Nenhuma calça cadastrada ainda.</p>)}
        </CartaoGrafico>

        <CartaoGrafico
          largo
          titulo="Preço por peça"
          descricao="O traço vai do menor ao maior preço entre as lojas; o ponto maior é a média."
          tabela={(
            <TabelaGrafico
              colunas={['Peça', 'Menor', 'Média', 'Maior', 'Lojas']}
              linhas={precos.map((p) => [p.rotulo, formatarPreco(p.minimo), formatarPreco(p.media), formatarPreco(p.maximo), p.lojas])}
            />
          )}
        >
          {(dica) => (precos.length
            ? <FaixasDePreco dados={precos} formatar={formatarPreco} {...dica} />
            : <p className="grafico-vazio">Ainda não há preços cadastrados.</p>)}
        </CartaoGrafico>
      </div>

      <div className="listas-painel">
        <section className="painel-bloco" aria-labelledby="sem-catalogo">
          <div className="painel-bloco-cabeca">
            <h2 id="sem-catalogo">Lojas sem catálogo</h2>
          </div>
          {dados.lojasSemCatalogo.length === 0 ? (
            <p className="lista-vazia">Todas as lojas têm uniformes cadastrados.</p>
          ) : (
            <ul className="lista-admin">
              {dados.lojasSemCatalogo.map((l) => (
                <li key={l.id}>
                  <Link to={`/admin/lojas/${l.id}`} className="linha-admin">
                    <strong>{l.nome}</strong>
                    <span>{l.cidade} ({l.uf})</span>
                    <span className="linha-admin-acao">Adicionar roupas</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="painel-bloco" aria-labelledby="ultimas">
          <div className="painel-bloco-cabeca">
            <h2 id="ultimas">Últimos cadastros</h2>
            <Link to="/admin/lojas" className="botao secundario pequeno">Ver todas</Link>
          </div>
          <ul className="lista-admin">
            {dados.ultimasLojas.map((l) => (
              <li key={l.id}>
                <Link to={`/admin/lojas/${l.id}`} className="linha-admin">
                  <strong>{l.nome}</strong>
                  <span>{l.cidade} ({l.uf})</span>
                  <span className="linha-admin-acao">{dataCurta.format(new Date(l.criadoEm))}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}
