const EQUIPE = [
  { nome: 'Davi Rodrigues Cunha', foto: 'davi' },
  { nome: 'Eduardo Borges Cordeiro', foto: 'eduardo-b' },
  { nome: 'Eduardo Castro Fernandes', foto: 'eduardo-c' },
  { nome: 'Pedro Falleiro Mendes', foto: 'pedro-f' },
  { nome: 'Pedro Silva e Souza', foto: 'pedro-s' },
  { nome: 'Rafael José Abdalla', foto: 'rafael' },
]

const HISTORIA = [
  { ano: '2024', texto: 'Primeira versão do Ifes Modas, feita em PHP como TCC do curso técnico em informática.' },
  { ano: '2026', texto: 'Versão 2.0, refeita com .NET 10, PostgreSQL e React, com testes automáticos e publicação contínua.' },
]

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

        <section className="sobre-historia" aria-labelledby="historia">
          <h2 id="historia" className="secao-titulo">Versões</h2>
          <ol>
            {HISTORIA.map((h) => (
              <li key={h.ano}>
                <strong>{h.ano}</strong>
                <p>{h.texto}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="sobre-equipe" aria-labelledby="equipe">
          <h2 id="equipe" className="secao-titulo">Equipe</h2>
          <ul className="equipe">
            {EQUIPE.map((p) => (
              <li key={p.foto}>
                <img src={`/img/equipe/${p.foto}.webp`} alt="" width="320" height="320" loading="lazy" />
                <span>{p.nome}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}
