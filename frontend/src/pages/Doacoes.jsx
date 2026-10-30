import { ExternalLink } from 'lucide-react'
import { CabecalhoPagina } from '../components/CabecalhoPagina.jsx'

// RF04: encaminha para o site do campus, onde fica o contato do sistema de doação de uniformes.
const DOACOES_URL = 'https://alegre.ifes.edu.br'

const DOAR = [
  'Separe as peças do uniforme que não servem mais, limpas e em bom estado.',
  'Fale com o campus pelo site oficial para saber onde e quando entregar.',
  'Entregue as peças. O campus repassa para os alunos que precisam.',
]

const RECEBER = [
  'Fale com o campus pelo site oficial.',
  'Diga qual peça e qual tamanho você precisa.',
  'Quando houver uma peça disponível, o campus combina a entrega com você.',
]

const PERGUNTAS = [
  {
    pergunta: 'O Ifes Modas recebe as doações?',
    resposta: 'Não. O site só mostra o caminho. Quem recebe e repassa os uniformes é o Ifes Campus de Alegre.',
  },
  {
    pergunta: 'Que peças posso doar?',
    resposta: 'Peças do uniforme do campus: camisas, bermudas e calças. Confirme com o campus antes de levar.',
  },
  {
    pergunta: 'Posso comprar em vez de pedir doação?',
    resposta: 'Sim. A página Lojas mostra quem vende cada peça, os tamanhos e os preços.',
  },
]

export default function Doacoes() {
  return (
    <>
      <CabecalhoPagina
        titulo="Doações"
        descricao="O Ifes Campus de Alegre recebe uniformes usados e repassa para alunos que precisam. Veja como participar."
      />

      <div className="container secao">
        <div className="doacao-caminhos">
          <section aria-labelledby="quero-doar">
            <h2 id="quero-doar">Quero doar</h2>
            <ol className="lista-passos">
              {DOAR.map((p) => <li key={p}>{p}</li>)}
            </ol>
          </section>
          <section aria-labelledby="quero-receber">
            <h2 id="quero-receber">Preciso de um uniforme</h2>
            <ol className="lista-passos">
              {RECEBER.map((p) => <li key={p}>{p}</li>)}
            </ol>
          </section>
        </div>

        {/* O bloco inteiro é o link para o site do campus; o "botão" é só visual. */}
        <a className="doacao-contato" href={DOACOES_URL} target="_blank" rel="noopener noreferrer">
          <span className="doacao-contato-foto">
            <img src="/img/card-doacoes.webp" alt="" width="380" height="480" loading="lazy" />
          </span>
          <span>
            <h2>Fale com o campus</h2>
            <p>O contato do programa de doação fica no site oficial do Ifes Campus de Alegre.</p>
            <span className="botao grande">
              Abrir o site do campus
              <ExternalLink size={18} className="seta" />
            </span>
          </span>
        </a>

        <section className="perguntas" aria-labelledby="duvidas">
          <h2 id="duvidas" className="secao-titulo">Dúvidas</h2>
          {PERGUNTAS.map((p) => (
            <details key={p.pergunta}>
              <summary>{p.pergunta}</summary>
              <p>{p.resposta}</p>
            </details>
          ))}
        </section>
      </div>
    </>
  )
}
