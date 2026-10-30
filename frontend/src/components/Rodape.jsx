import { Link } from 'react-router-dom'

export function Rodape() {
  return (
    <footer className="rodape">
      <div className="container rodape-grade">
        <div className="rodape-marca">
          <Link to="/" className="marca">
            <img src="/img/logo.webp" alt="" width="34" height="34" />
            Ifes Modas
          </Link>
          <p>As lojas que vendem os uniformes do Ifes Campus de Alegre, com tamanhos, preços e contato.</p>
        </div>

        <nav aria-label="Site">
          <h2>Site</h2>
          <ul>
            <li><Link to="/lojas">Lojas</Link></li>
            <li><Link to="/doacoes">Doações</Link></li>
            <li><Link to="/sobre">Sobre o projeto</Link></li>
          </ul>
        </nav>

        <nav aria-label="Para lojas">
          <h2>Para lojas</h2>
          <ul>
            <li><Link to="/cadastro">Cadastrar minha loja</Link></li>
            <li><Link to="/login">Entrar na área da loja</Link></li>
          </ul>
        </nav>

        <div>
          <h2>Contato</h2>
          <ul>
            <li><a href="mailto:ifesmodas@gmail.com">ifesmodas@gmail.com</a></li>
          </ul>
        </div>
      </div>
      <div className="container rodape-fim">
        <small>Projeto de alunos do Ifes Campus de Alegre. Versão 2.0, 2026.</small>
      </div>
    </footer>
  )
}
