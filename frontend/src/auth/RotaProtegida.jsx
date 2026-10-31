import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext.js'

/** Só deixa ver a página se a loja estiver logada; senão manda para o login e volta depois. */
export function RotaProtegida({ children }) {
  const { logada } = useAuth()
  const location = useLocation()
  if (!logada) return <Navigate to="/login" replace state={{ voltarPara: location.pathname }} />
  return children
}

/**
 * Área do administrador. Com a troca de acesso pendente (primeiro acesso), só a página da conta abre:
 * a API também bloqueia o resto, isto aqui só evita telas com erro.
 */
export function RotaAdmin({ children }) {
  const { admin } = useAuth()
  const location = useLocation()
  if (!admin) return <Navigate to="/login" replace state={{ voltarPara: location.pathname }} />
  if (admin.trocarAcesso && location.pathname !== '/admin/conta') return <Navigate to="/admin/conta" replace />
  return children
}
