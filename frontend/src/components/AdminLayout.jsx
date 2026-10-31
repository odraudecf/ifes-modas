import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { BarChart3, KeyRound, LogOut, Store, Users } from 'lucide-react'
import { useAuth } from '../auth/AuthContext.js'

/** Moldura da administração: mesmo desenho da área da loja, com a faixa "Administração" no topo do menu. */
export function AdminLayout() {
  const { admin, sair } = useAuth()
  const navigate = useNavigate()

  function sairDaConta() {
    sair()
    navigate('/')
  }

  return (
    <div className="container painel">
      <aside className="painel-menu">
        <div className="painel-loja admin-cartao">
          <span className="admin-selo">Administração</span>
          <strong>{admin.nome}</strong>
        </div>
        <nav aria-label="Administração">
          {/* Com a troca de acesso pendente, só a conta abre (a API também bloqueia o resto). */}
          {!admin.trocarAcesso && (
            <>
              <NavLink to="/admin" end><BarChart3 size={18} />Painel</NavLink>
              <NavLink to="/admin/lojas"><Store size={18} />Lojas</NavLink>
              <NavLink to="/admin/usuarios"><Users size={18} />Usuários</NavLink>
            </>
          )}
          <NavLink to="/admin/conta"><KeyRound size={18} />Minha conta</NavLink>
          <button type="button" onClick={sairDaConta}><LogOut size={18} />Sair</button>
        </nav>
      </aside>
      <div className="painel-conteudo">
        <Outlet />
      </div>
    </div>
  )
}
