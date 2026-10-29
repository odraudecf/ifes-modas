import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.js'

export default function Gerenciamento() {
  const { loja } = useAuth()

  return (
    <section className="secao container">
      <h1 className="painel-titulo">Gerenciamento</h1>
      <p className="painel-sub">{loja.nome}</p>

      <div className="atalhos">
        <Link to="/gerenciamento/roupas" className="atalho">
          <h2>Roupas</h2>
          <p>Adicione, altere ou exclua os uniformes que sua loja vende.</p>
        </Link>
        <Link to="/gerenciamento/loja" className="atalho">
          <h2>Dados da loja</h2>
          <p>Atualize nome, telefone, endereço e redes sociais.</p>
        </Link>
        <Link to={`/lojas/${loja.id}`} className="atalho">
          <h2>Minha página</h2>
          <p>Veja sua loja como os alunos veem.</p>
        </Link>
      </div>
    </section>
  )
}
