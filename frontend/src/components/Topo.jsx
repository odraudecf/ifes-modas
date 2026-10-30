import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, Store, X } from 'lucide-react'
import { useAuth } from '../auth/AuthContext.js'

const LINKS = [
  { para: '/', rotulo: 'Início', end: true },
  { para: '/lojas', rotulo: 'Lojas' },
  { para: '/doacoes', rotulo: 'Doações' },
  { para: '/sobre', rotulo: 'Sobre' },
]

export function Topo() {
  const { loja, logada } = useAuth()
  const { pathname } = useLocation()

  // O menu do celular guarda em qual página foi aberto; ao trocar de página ele fecha sozinho.
  const [abertoEm, setAbertoEm] = useState(null)
  const aberto = abertoEm === pathname

  return (
    <header className="topo">
      <div className="container topo-barra">
        <Link to="/" className="marca">
          <img src="/img/logo.webp" alt="" width="34" height="34" />
          Ifes Modas
        </Link>

        <button
          type="button"
          className="topo-menu-botao"
          aria-expanded={aberto}
          aria-controls="menu-principal"
          onClick={() => setAbertoEm(aberto ? null : pathname)}
        >
          {aberto ? <X size={24} /> : <Menu size={24} />}
          <span className="sr-only">Menu</span>
        </button>

        <nav id="menu-principal" className={`topo-nav${aberto ? ' aberto' : ''}`} aria-label="Principal">
          <ul>
            {LINKS.map((l) => (
              <li key={l.para}><NavLink to={l.para} end={l.end}>{l.rotulo}</NavLink></li>
            ))}
          </ul>
          <Link to={logada ? '/gerenciamento' : '/login'} className="botao secundario pequeno topo-loja">
            <Store size={18} />
            <span>{logada ? loja.nome : 'Área da loja'}</span>
          </Link>
        </nav>
      </div>
    </header>
  )
}
