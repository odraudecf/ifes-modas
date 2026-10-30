import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Opcoes } from '../components/Opcoes.jsx'
import { PECAS, TAMANHOS_CALCA_COMUNS, TAMANHOS_LETRA, pecaPorId } from '../lib/uniformes.js'

const OPCOES_PECA = PECAS.map((p) => ({ valor: p.id, rotulo: p.nome, imagem: p.imagem }))

const PASSOS = [
  { titulo: 'Escolha a peça e o tamanho', texto: 'Camisa padrão, camisa agropecuária, bermuda ou calça, do PP ao XGG.' },
  { titulo: 'Compare as lojas', texto: 'Veja quem tem a peça, o preço de cada tamanho, o bairro e a cidade.' },
  { titulo: 'Chame a loja no WhatsApp', texto: 'A mensagem já vai pronta com a peça e o tamanho que você escolheu.' },
]

export default function Inicio() {
  const navigate = useNavigate()
  const [peca, setPeca] = useState('camisa-padrao')
  const [tamanho, setTamanho] = useState(null)
  const tamanhos = pecaPorId(peca).tipo === 'Calca' ? TAMANHOS_CALCA_COMUNS : TAMANHOS_LETRA

  function trocarPeca(id) {
    setPeca(id)
    const novos = pecaPorId(id).tipo === 'Calca' ? TAMANHOS_CALCA_COMUNS : TAMANHOS_LETRA
    if (!novos.includes(tamanho)) setTamanho(null)
  }

  function buscar(e) {
    e.preventDefault()
    const busca = new URLSearchParams({ peca })
    if (tamanho) busca.set('tamanho', tamanho)
    navigate(`/lojas?${busca}`)
  }

  return (
    <>
      <section className="inicio-topo">
        <div className="container inicio-topo-grade">
          <div className="inicio-chamada">
            <h1>Ache o uniforme do Ifes Alegre no seu tamanho.</h1>
            <p className="inicio-lead">Veja quais lojas vendem cada peça, compare os preços e chame a loja no WhatsApp.</p>

            <form className="buscador" onSubmit={buscar} aria-label="Buscar uniforme">
              <Opcoes rotulo="Peça" opcoes={OPCOES_PECA} valor={peca} alterar={trocarPeca} />
              <Opcoes
                rotulo={pecaPorId(peca).tipo === 'Calca' ? 'Numeração (opcional)' : 'Tamanho (opcional)'}
                opcoes={tamanhos}
                valor={tamanho}
                alterar={(t) => setTamanho(t === tamanho ? null : t)}
                compacto
              />
              <button className="botao grande">
                <Search size={20} />
                Ver lojas
              </button>
            </form>
          </div>

          <figure className="inicio-foto">
            <img src="/img/hero-campus.webp" alt="Aluno com a camisa padrão do Ifes Campus de Alegre" width="1440" height="717" fetchPriority="high" />
            <figcaption>Ifes Campus de Alegre, ES</figcaption>
          </figure>
        </div>
      </section>

      <section className="secao container" aria-labelledby="como-funciona">
        <h2 id="como-funciona" className="secao-titulo">Como funciona</h2>
        <ol className="passos">
          {PASSOS.map((p, i) => (
            <li key={p.titulo}>
              <span className="passo-numero" aria-hidden="true">{i + 1}</span>
              <h3>{p.titulo}</h3>
              <p>{p.texto}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="secao container" aria-labelledby="modelos">
        <h2 id="modelos" className="secao-titulo">Os dois modelos de camisa</h2>
        <div className="modelos">
          <Link to="/lojas?peca=camisa-padrao" className="modelo">
            <img src="/img/card-padrao.webp" alt="" width="380" height="480" loading="lazy" />
            <span>
              <strong>Camisa padrão</strong>
              Ver quem vende
            </span>
          </Link>
          <Link to="/lojas?peca=camisa-agro" className="modelo">
            <img src="/img/card-agro.webp" alt="" width="380" height="480" loading="lazy" />
            <span>
              <strong>Camisa agropecuária</strong>
              Ver quem vende
            </span>
          </Link>
          <div className="modelos-texto">
            <p>Bermudas e calças são iguais para todos os cursos. Use a busca acima para ver tamanhos e preços de cada peça.</p>
          </div>
        </div>
      </section>

      <section className="secao container" aria-labelledby="doacao">
        <div className="faixa-doacao">
          <img src="/img/card-doacoes.webp" alt="Aluno segurando uniformes dobrados" width="380" height="480" loading="lazy" />
          <div>
            <h2 id="doacao">O uniforme não serve mais? Ele pode vestir outro aluno.</h2>
            <p>O campus recebe uniformes usados e repassa para quem precisa. Veja como doar ou pedir uma peça.</p>
            <Link to="/doacoes" className="botao secundario">Saber como doar ou receber</Link>
          </div>
        </div>
      </section>

      <section className="faixa-lojista" aria-labelledby="lojista">
        <div className="container faixa-lojista-grade">
          <div>
            <h2 id="lojista">Sua loja vende uniforme do Ifes?</h2>
            <p>Cadastre a loja de graça, informe os tamanhos e preços e receba os alunos direto no WhatsApp.</p>
          </div>
          <div className="faixa-lojista-acoes">
            <Link to="/cadastro" className="botao grande">Cadastrar minha loja</Link>
            <Link to="/login" className="botao secundario grande">Já tenho cadastro</Link>
          </div>
        </div>
      </section>
    </>
  )
}
