import { Link } from 'react-router-dom'
import { CircleAlert } from 'lucide-react'
import { useAuth } from '../auth/AuthContext.js'
import { Carregando, Erro } from '../components/Estados.jsx'
import { useApi } from '../lib/useApi.js'
import { formatarFaixa } from '../lib/format.js'
import { PECAS, agruparCatalogo, compararTamanhos } from '../lib/uniformes.js'

/** Visão geral da área da loja: o que falta preencher e um resumo do catálogo. */
export default function Gerenciamento() {
  const { loja } = useAuth()
  const roupas = useApi('/api/uniformes/minhas', { auth: true })
  const dados = useApi('/api/lojas/me', { auth: true })

  if (roupas.carregando || dados.carregando) return <Carregando />
  const erro = roupas.erro ?? dados.erro
  if (erro) return <Erro mensagem={erro.message} tentarDeNovo={() => { roupas.recarregar(); dados.recarregar() }} />

  const secoes = agruparCatalogo(roupas.dados)
  const pendencias = []
  if (roupas.dados.length === 0) {
    pendencias.push({ texto: 'Adicione os uniformes que você vende. Sem eles, sua página aparece sem tamanhos e preços.', para: '/gerenciamento/roupas', acao: 'Adicionar roupas' })
  }
  if (!dados.dados.instagram && !dados.dados.facebook) {
    pendencias.push({ texto: 'Informe o Instagram ou o Facebook da loja. Os alunos costumam olhar antes de ir.', para: '/gerenciamento/loja', acao: 'Editar dados' })
  }

  return (
    <>
      <div className="painel-cabeca">
        <h1>Olá, {loja.nome}</h1>
        <p>Este é o resumo do que os alunos veem na sua página.</p>
      </div>

      {pendencias.length > 0 && (
        <section className="pendencias" aria-labelledby="pendencias">
          <h2 id="pendencias">Para completar sua loja</h2>
          <ul>
            {pendencias.map((p) => (
              <li key={p.para}>
                <CircleAlert size={20} />
                <p>{p.texto}</p>
                <Link to={p.para} className="botao pequeno">{p.acao}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="painel-bloco" aria-labelledby="resumo">
        <div className="painel-bloco-cabeca">
          <h2 id="resumo">Seu catálogo</h2>
          <Link to="/gerenciamento/roupas" className="botao secundario pequeno">Editar roupas</Link>
        </div>
        <table className="tabela">
          <thead>
            <tr><th scope="col">Peça</th><th scope="col">Tamanhos</th><th scope="col">Preço</th></tr>
          </thead>
          <tbody>
            {PECAS.map((peca) => {
              const secao = secoes.find((s) => s.peca === peca)
              const tamanhos = secao ? [...new Set(secao.itens.map((u) => u.tamanho))].sort(compararTamanhos) : []
              return (
                <tr key={peca.id} className={secao ? undefined : 'apagada'}>
                  <th scope="row">{peca.nome}</th>
                  <td>{secao ? tamanhos.join(', ') : 'Não cadastrada'}</td>
                  <td>{secao ? formatarFaixa(secao.menor, secao.maior) : ''}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>
    </>
  )
}
