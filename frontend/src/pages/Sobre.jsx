import { useRef, useState } from 'react'

const TURMA_2024 = [
  { nome: 'Davi Rodrigues Cunha', foto: 'davi' },
  { nome: 'Eduardo Borges Cordeiro', foto: 'eduardo-b' },
  { nome: 'Eduardo Castro Fernandes', foto: 'eduardo-c' },
  { nome: 'Pedro Falleiro Mendes', foto: 'pedro-f' },
  { nome: 'Pedro Silva e Souza', foto: 'pedro-s' },
  { nome: 'Rafael José Abdalla', foto: 'rafael' },
]

// Cada versão tem a sua equipe: escolher o ano mostra quem fez aquela versão.
const VERSOES = [
  {
    ano: '2024',
    titulo: 'Versão 1.0',
    texto: 'Primeira versão do Ifes Modas, feita em PHP como TCC do curso técnico em informática.',
    sobreEquipe: 'Turma de informática 2022–2024 do Ifes Campus de Alegre.',
    equipe: TURMA_2024,
  },
  {
    ano: '2026',
    titulo: 'Versão 2.0',
    texto: 'Refeita com .NET 10, PostgreSQL e React, com testes automáticos e publicação contínua.',
    sobreEquipe: 'Recriação do sistema, a partir do TCC de 2024.',
    equipe: TURMA_2024.filter((p) => p.foto === 'eduardo-c'),
  },
]

const contarPessoas = (n) => (n === 1 ? '1 pessoa' : `${n} pessoas`)

export default function Sobre() {
  return (
    <>
      <figure className="sobre-foto">
        <img src="/img/hero-sobre.webp" alt="Turma de informática do Ifes Campus de Alegre" width="1920" height="1080" fetchPriority="high" />
      </figure>

      <div className="container secao sobre">
        <div className="sobre-texto">
          <h1>Sobre o projeto</h1>
          <p>
            Somos alunos da turma de informática 2022–2024 do Ifes Campus de Alegre. O Ifes Modas nasceu
            no nosso TCC para resolver um problema comum no campus: achar o uniforme certo, no tamanho certo.
          </p>
          <p>
            Reunimos num só lugar as lojas que vendem o uniforme, com tamanhos, preços e contato, e mostramos
            como doar ou receber peças usadas.
          </p>
        </div>

        <div className="sobre-dado">
          <strong>Mais de 70%</strong>
          <p>dos alunos que entrevistamos tiveram dificuldade para encontrar o uniforme, principalmente quem mora longe do campus.</p>
        </div>

        <Versoes />
      </div>
    </>
  )
}

/** Abas de versão: o ano escolhido fica destacado e a equipe logo abaixo é a daquela versão. */
function Versoes() {
  const [ativa, setAtiva] = useState(VERSOES.length - 1) // começa na versão atual
  const abas = useRef([])
  const versao = VERSOES[ativa]

  // Setas do teclado trocam de aba (padrão de abas acessíveis).
  function teclar(e) {
    const passo = { ArrowRight: 1, ArrowLeft: -1 }[e.key]
    if (!passo) return
    e.preventDefault()
    const proxima = (ativa + passo + VERSOES.length) % VERSOES.length
    setAtiva(proxima)
    abas.current[proxima]?.focus()
  }

  return (
    <section className="sobre-versoes" aria-labelledby="versoes">
      <h2 id="versoes" className="secao-titulo">Versões e equipes</h2>
      <p className="versoes-dica">Escolha um ano para ver quem fez cada versão.</p>

      <div className="versoes" role="tablist" aria-label="Versões do Ifes Modas" onKeyDown={teclar}>
        {VERSOES.map((v, i) => (
          <button
            key={v.ano}
            ref={(el) => { abas.current[i] = el }}
            type="button"
            role="tab"
            id={`aba-${v.ano}`}
            aria-selected={i === ativa}
            aria-controls="equipe-da-versao"
            tabIndex={i === ativa ? 0 : -1}
            className="versao"
            onClick={() => setAtiva(i)}
          >
            <span className="versao-ano">{v.ano}</span>
            <span className="versao-titulo">{v.titulo}</span>
            <span className="versao-texto">{v.texto}</span>
            <span className="versao-equipe">
              {i === ativa ? 'Equipe abaixo' : 'Ver equipe'}: {contarPessoas(v.equipe.length)}
            </span>
          </button>
        ))}
      </div>

      {/* key: ao trocar de ano o painel é recriado e a entrada animada roda de novo. */}
      <div key={versao.ano} id="equipe-da-versao" role="tabpanel" aria-labelledby={`aba-${versao.ano}`} className="equipe-painel">
        <h3>Equipe de {versao.ano}</h3>
        <p>{versao.sobreEquipe}</p>
        <ul className="equipe">
          {versao.equipe.map((p) => (
            <li key={p.foto}>
              <img src={`/img/equipe/${p.foto}.webp`} alt="" width="320" height="320" loading="lazy" />
              <span>{p.nome}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
