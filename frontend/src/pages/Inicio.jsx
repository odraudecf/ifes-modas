import { Link } from 'react-router-dom'
import { Hero } from '../components/Hero.jsx'

const MODELOS = [
  { titulo: 'Padrão', imagem: '/img/card-padrao.webp', destino: '/lojas' },
  { titulo: 'Agropecuária', imagem: '/img/card-agro.webp', destino: '/lojas' },
  { titulo: 'Doações', imagem: '/img/card-doacoes.webp', destino: '/doacoes' },
]

export default function Inicio() {
  return (
    <>
      <Hero titulo="Todos os uniformes que você precisa, aqui, em um só lugar!" textoLongo />

      <section className="secao container">
        <div className="secao-cabecalho">
          <h2>Modelos</h2>
          <p>Veja os uniformes do campus e onde comprar cada um.</p>
        </div>

        <div className="modelos">
          {MODELOS.map((m) => (
            <Link key={m.titulo} to={m.destino} className="modelo">
              <img src={m.imagem} alt="" width="210" height="266" loading="lazy" />
              <h3>{m.titulo}</h3>
            </Link>
          ))}
        </div>

        <div className="centro">
          <Link to="/lojas" className="botao">Ver lojas</Link>
        </div>
      </section>
    </>
  )
}
