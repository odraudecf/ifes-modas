import { Link } from 'react-router-dom'

/**
 * Topo das páginas internas: trilha opcional, título, descrição e conteúdo extra (filtros, botões).
 * `trilha` = [{ rotulo, para }] com as páginas acima desta.
 */
export function CabecalhoPagina({ titulo, descricao, trilha, children }) {
  return (
    <div className="cabecalho-pagina">
      <div className="container">
        {trilha && (
          <nav className="trilha" aria-label="Você está em">
            <ol>
              {trilha.map((t) => <li key={t.para}><Link to={t.para}>{t.rotulo}</Link></li>)}
              <li aria-current="page">{titulo}</li>
            </ol>
          </nav>
        )}
        <h1>{titulo}</h1>
        {descricao && <p className="cabecalho-descricao">{descricao}</p>}
        {children}
      </div>
    </div>
  )
}
