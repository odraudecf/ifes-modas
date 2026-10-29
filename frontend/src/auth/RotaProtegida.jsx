import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext.js'

/** Só deixa ver a página se a loja estiver logada; senão manda para o login e volta depois. */
export function RotaProtegida({ children }) {
  const { logada } = useAuth()
  const location = useLocation()
  if (!logada) return <Navigate to="/login" replace state={{ voltarPara: location.pathname }} />
  return children
}
