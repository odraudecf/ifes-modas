const EQUIPE = [
  { nome: 'Davi Rodrigues Cunha', foto: 'davi' },
  { nome: 'Eduardo Borges Cordeiro', foto: 'eduardo-b' },
  { nome: 'Eduardo Castro Fernandes', foto: 'eduardo-c' },
  { nome: 'Pedro Falleiro Mendes', foto: 'pedro-f' },
  { nome: 'Pedro Silva e Souza', foto: 'pedro-s' },
  { nome: 'Rafael José Abdalla', foto: 'rafael' },
]

export default function Sobre() {
  return (
    <>
      <div className="hero-sobre">
        <img src="/img/hero-sobre.webp" alt="Turma de informática do Ifes Campus de Alegre" />
      </div>

      <section className="secao container">
        <div className="sobre-texto">
          <h1>Sobre nós</h1>
          <p>
            Somos alunos da turma de informática 2022–2024 do Ifes Campus de Alegre. O Ifes Modas nasceu
            no nosso TCC: mais de 70% dos alunos que entrevistamos tiveram dificuldade para encontrar o uniforme,
            principalmente quem mora longe do campus.
          </p>
          <p>
            Esta é a segunda versão do site, refeita com .NET 10, PostgreSQL e React.
          </p>
        </div>

        <ul className="equipe">
          {EQUIPE.map((p) => (
            <li key={p.foto}>
              <img src={`/img/equipe/${p.foto}.webp`} alt="" width="112" height="112" loading="lazy" />
              <span>{p.nome}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
