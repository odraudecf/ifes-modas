import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.js'

export function Topo() {
  const { loja, logada, sair } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const lojaRef = useRef(null)

  // Cada menu guarda em qual página foi aberto; ao trocar de página ele fecha sozinho.
  const [menuAbertoEm, setMenuAbertoEm] = useState(null)
  const [lojaAbertaEm, setLojaAbertaEm] = useState(null)
  const menuAberto = menuAbertoEm === pathname
  const lojaAberta = lojaAbertaEm === pathname
  const setMenuAberto = (f) => setMenuAbertoEm(f(menuAberto) ? pathname : null)
  const setLojaAberta = (f) => setLojaAbertaEm(f(lojaAberta) ? pathname : null)

  // Fecha o menu da loja ao clicar fora dele.
  useEffect(() => {
    if (!lojaAberta) return
    const fechar = (e) => { if (!lojaRef.current?.contains(e.target)) setLojaAbertaEm(null) }
    document.addEventListener('click', fechar)
    return () => document.removeEventListener('click', fechar)
  }, [lojaAberta])

  function sairDaConta() {
    sair()
    navigate('/')
  }

  return (
    <header className="topo">
      <div className="container topo-barra">
        <Link to="/" className="marca">
          <img src="/img/logo.webp" alt="" width="36" height="36" />
          Ifes Modas
        </Link>

        <button
          type="button"
          className="topo-menu-botao"
          aria-expanded={menuAberto}
          aria-controls="menu-principal"
          onClick={() => setMenuAberto((v) => !v)}
        >
          <span className="sr-only">Menu</span>
          <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
            <path d={menuAberto ? 'M6 6l12 12M18 6L6 18' : 'M4 7h16M4 12h16M4 17h16'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <nav id="menu-principal" className={`topo-nav${menuAberto ? ' aberto' : ''}`} aria-label="Principal">
          <NavLink to="/" end>Início</NavLink>
          <NavLink to="/lojas">Lojas</NavLink>
          <NavLink to="/doacoes">Doações</NavLink>
          <NavLink to="/sobre">Sobre</NavLink>

          {logada ? (
            <div className="topo-loja" ref={lojaRef}>
              <button
                type="button"
                className="topo-loja-botao"
                aria-expanded={lojaAberta}
                onClick={() => setLojaAberta((v) => !v)}
              >
                <span>{loja.nome}</span>
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </button>
              {lojaAberta && (
                <div className="topo-loja-menu">
                  <Link to="/gerenciamento">Gerenciamento</Link>
                  <Link to={`/lojas/${loja.id}`}>Ver minha página</Link>
                  <button type="button" onClick={sairDaConta}>Sair da conta</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/cadastro">Cadastro</NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
