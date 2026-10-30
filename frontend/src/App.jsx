import { useEffect } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import { RotaProtegida } from './auth/RotaProtegida.jsx'
import { Topo } from './components/Topo.jsx'
import { Rodape } from './components/Rodape.jsx'
import { PainelLayout } from './components/PainelLayout.jsx'
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
  '/lojas': 'Lojas | Ifes Modas',
  '/doacoes': 'Doações | Ifes Modas',
  '/sobre': 'Sobre | Ifes Modas',
  '/login': 'Entrar | Ifes Modas',
  '/cadastro': 'Cadastrar loja | Ifes Modas',
  '/gerenciamento': 'Visão geral | Ifes Modas',
  '/gerenciamento/roupas': 'Roupas | Ifes Modas',
  '/gerenciamento/loja': 'Dados da loja | Ifes Modas',
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
          <Route path="/gerenciamento" element={<RotaProtegida><PainelLayout /></RotaProtegida>}>
            <Route index element={<Gerenciamento />} />
            <Route path="roupas" element={<MinhasRoupas />} />
            <Route path="loja" element={<EditarLoja />} />
          </Route>
          <Route
            path="*"
            element={(
              <Vazio titulo="Página não encontrada">
                <p>O endereço pode ter mudado ou estar digitado errado.</p>
                <Link to="/lojas" className="botao">Ver as lojas</Link>
              </Vazio>
            )}
          />
        </Routes>
      </main>
      <Rodape />
    </>
  )
}
