import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Plus, ShieldCheck, Store, X } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext.js'
import { Carregando, Erro } from '../../components/Estados.jsx'
import { Opcoes } from '../../components/Opcoes.jsx'
import { useApi } from '../../lib/useApi.js'

const data = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

/** Quem pode entrar no sistema: administradores (pelo usuário) e lojas (pelo CNPJ). */
export default function AdminUsuarios() {
  const { admin } = useAuth()
  const location = useLocation()
  const { dados, erro, carregando, recarregar } = useApi('/api/admin/usuarios', { auth: true })
  const [mostrar, setMostrar] = useState('todos')
  const [aviso, setAviso] = useState(location.state?.criado ?? null)

  if (carregando) return <Carregando texto="Buscando usuários…" />
  if (erro) return <Erro mensagem={erro.message} tentarDeNovo={recarregar} />

  const { administradores, lojas } = dados

  return (
    <>
      <div className="painel-cabeca com-acao">
        <div>
          <h1>Usuários</h1>
          <p>Administradores entram com o usuário; lojas, com o CNPJ.</p>
        </div>
        <Link to="/admin/usuarios/novo" className="botao grande"><Plus size={20} />Criar usuário</Link>
      </div>

      {aviso && (
        <div className="alerta sucesso" role="status">
          <p>{aviso}</p>
          <button type="button" className="alerta-fechar" onClick={() => setAviso(null)}>
            <X size={18} />
            <span className="sr-only">Fechar aviso</span>
          </button>
        </div>
      )}

      <div className="filtro-roupas">
        <Opcoes
          rotulo="Mostrar"
          opcoes={[
            { valor: 'todos', rotulo: `Todos (${administradores.length + lojas.length})` },
            { valor: 'admins', rotulo: `Administradores (${administradores.length})` },
            { valor: 'lojas', rotulo: `Lojas (${lojas.length})` },
          ]}
          valor={mostrar}
          alterar={setMostrar}
          compacto
        />
      </div>

      {mostrar !== 'lojas' && (
        <section className="grupo-roupas" aria-labelledby="titulo-admins">
          <div className="grupo-roupas-cabeca">
            <span className="icone-grupo"><ShieldCheck size={22} /></span>
            <h2 id="titulo-admins">Administradores</h2>
          </div>
          <ul className="lista-admin">
            {administradores.map((a) => (
              <li key={a.id} className="linha-admin estatica">
                <span className="linha-admin-nome">
                  <strong>{a.usuario}{a.id === admin.id && <span className="etiqueta-voce">você</span>}</strong>
                  <small>Criado em {data.format(new Date(a.criadoEm))}</small>
                </span>
                <span className={`estado-acesso${a.deveTrocarAcesso ? ' pendente' : ''}`}>
                  {a.deveTrocarAcesso ? 'Ainda não trocou a senha provisória' : 'Acesso definido'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {mostrar !== 'admins' && (
        <section className="grupo-roupas" aria-labelledby="titulo-lojas">
          <div className="grupo-roupas-cabeca">
            <span className="icone-grupo"><Store size={22} /></span>
            <h2 id="titulo-lojas">Lojas</h2>
          </div>
          <ul className="lista-admin">
            {lojas.map((l) => (
              <li key={l.id}>
                <Link to={`/admin/lojas/${l.id}`} className="linha-admin">
                  <span className="linha-admin-nome">
                    <strong>{l.nome}</strong>
                    <small>Login: CNPJ {l.cnpj}</small>
                  </span>
                  <span>{l.cidade} ({l.uf})</span>
                  <span className="linha-admin-acao">Abrir loja</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
