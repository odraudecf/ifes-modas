import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)

/** Dados da loja logada e as ações de login/logout. */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>.')
  return ctx
}
