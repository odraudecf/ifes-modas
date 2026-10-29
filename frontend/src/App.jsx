import { useEffect } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import { RotaProtegida } from './auth/RotaProtegida.jsx'
import { Topo } from './components/Topo.jsx'
import { Rodape } from './components/Rodape.jsx'
import { Vazio } from './components/Estados.jsx'
import Inicio from './pages/Inicio.jsx'
import Lojas from './pages/Lojas.jsx'
import Loja from './pages/Loja.jsx'
import Doacoes from './pages/Doacoes.jsx'
import Sobre from './pages/Sobre.jsx'
import Login from './pages/Login.jsx'
import Cadastro from './pages/Cadastro.jsx'
import Gerenciamento from './pages/Gerenciamento.jsx'
import MinhasRoupas from './pages/MinhasRoupas.jsx'
import EditarLoja from './pages/EditarLoja.jsx'

const TITULOS = {
  '/': 'Ifes Modas',
  '/lojas': 'Lojas · Ifes Modas',
  '/doacoes': 'Doações · Ifes Modas',
  '/sobre': 'Sobre · Ifes Modas',
  '/login': 'Login · Ifes Modas',
  '/cadastro': 'Cadastro · Ifes Modas',
  '/gerenciamento': 'Gerenciamento · Ifes Modas',
}

export default function App() {
  const { pathname } = useLocation()

  // Ao trocar de página: volta ao topo e atualiza o título da aba.
  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = TITULOS[pathname] ?? 'Ifes Modas'
  }, [pathname])

  return (
    <>
      <a href="#conteudo" className="sr-only">Pular para o conteúdo</a>
      <Topo />
      <main id="conteudo">
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/lojas" element={<Lojas />} />
          <Route path="/lojas/:id" element={<Loja />} />
          <Route path="/doacoes" element={<Doacoes />} />
          <Route path="/sobre" element={<Sobre />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/gerenciamento" element={<RotaProtegida><Gerenciamento /></RotaProtegida>} />
          <Route path="/gerenciamento/roupas" element={<RotaProtegida><MinhasRoupas /></RotaProtegida>} />
          <Route path="/gerenciamento/loja" element={<RotaProtegida><EditarLoja /></RotaProtegida>} />
          <Route
            path="*"
            element={(
              <Vazio>
                <p>Página não encontrada.</p>
                <Link to="/" className="botao">Ir para o início</Link>
              </Vazio>
            )}
          />
        </Routes>
      </main>
      <Rodape />
    </>
  )
}
