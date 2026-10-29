import { Hero } from '../components/Hero.jsx'

// RF04: encaminha para o site do campus, onde fica o contato do sistema de doação de uniformes.
const DOACOES_URL = 'https://alegre.ifes.edu.br'

export default function Doacoes() {
  return (
    <>
      <Hero titulo="Doações" />

      <section className="secao container">
        <div className="doacoes">
          <img src="/img/card-doacoes.webp" alt="Aluno segurando uniformes dobrados" width="220" height="279" loading="lazy" />
          <div>
            <h2>Contato de doações</h2>
            <p>
              O Ifes Campus de Alegre recebe e repassa uniformes usados. Para doar ou pedir uma doação,
              fale com o campus pelo site oficial.
            </p>
            <a className="botao" href={DOACOES_URL} target="_blank" rel="noopener noreferrer">
              Abrir o site do campus
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
