import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ExternalLink, LayoutDashboard, LogOut, Settings, Shirt } from 'lucide-react'
import { useAuth } from '../auth/AuthContext.js'
import { formatarCnpj } from '../lib/format.js'

/** Moldura da área da loja: menu lateral (no celular, abas no topo) e a página ao lado. */
export function PainelLayout() {
  const { loja, sair } = useAuth()
  const navigate = useNavigate()

  function sairDaConta() {
    sair()
    navigate('/')
  }

  return (
    <div className="container painel">
      <aside className="painel-menu">
        <div className="painel-loja">
          <strong>{loja.nome}</strong>
          <span>CNPJ {formatarCnpj(loja.cnpj)}</span>
        </div>
        <nav aria-label="Área da loja">
          <NavLink to="/gerenciamento" end><LayoutDashboard size={18} />Visão geral</NavLink>
          <NavLink to="/gerenciamento/roupas"><Shirt size={18} />Roupas</NavLink>
          <NavLink to="/gerenciamento/loja"><Settings size={18} />Dados da loja</NavLink>
          <Link to={`/lojas/${loja.id}`}><ExternalLink size={18} />Ver minha página</Link>
          <button type="button" onClick={sairDaConta}><LogOut size={18} />Sair</button>
        </nav>
      </aside>
      <div className="painel-conteudo">
        <Outlet />
      </div>
    </div>
  )
}
