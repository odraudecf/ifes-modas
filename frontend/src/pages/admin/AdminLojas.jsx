import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { Carregando, Erro, Vazio } from '../../components/Estados.jsx'
import { useApi } from '../../lib/useApi.js'
import { formatarTelefone } from '../../lib/format.js'

const normalizar = (s = '') => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Todas as lojas, com busca. Clicar abre a loja para alterar dados e catálogo. */
export default function AdminLojas() {
  const { dados: lojas, erro, carregando, recarregar } = useApi('/api/admin/lojas', { auth: true })
  const [texto, setTexto] = useState('')

  const termo = normalizar(texto.trim())
  const soDigitos = texto.replace(/\D/g, '')
  const visiveis = (lojas ?? []).filter((l) => !termo
    || normalizar(`${l.nome} ${l.cidade} ${l.uf}`).includes(termo)
    || (soDigitos.length >= 4 && l.cnpj.replace(/\D/g, '').includes(soDigitos)))

  return (
    <>
      <div className="painel-cabeca com-acao">
        <div>
          <h1>Lojas</h1>
          <p>{lojas ? `${lojas.length} ${lojas.length === 1 ? 'loja cadastrada' : 'lojas cadastradas'}. ` : ''}Abra uma loja para alterar os dados ou o catálogo dela.</p>
        </div>
        <Link to="/admin/usuarios/novo" state={{ tipo: 'loja' }} className="botao grande"><Plus size={20} />Nova loja</Link>
      </div>

      <div className="busca busca-painel">
        <Search size={20} />
        <label htmlFor="busca-admin" className="sr-only">Buscar por nome, cidade ou CNPJ</label>
        <input id="busca-admin" type="search" placeholder="Buscar por nome, cidade ou CNPJ" value={texto} onChange={(e) => setTexto(e.target.value)} />
      </div>

      {carregando && <Carregando texto="Buscando lojas…" />}
      {erro && <Erro mensagem={erro.message} tentarDeNovo={recarregar} />}
      {lojas && visiveis.length === 0 && (
        <Vazio titulo="Nenhuma loja encontrada"><p>Confira o nome, a cidade ou o CNPJ.</p></Vazio>
      )}

      {visiveis.length > 0 && (
        <ul className="lista-admin tabela-lojas" aria-live="polite">
          <li className="lista-admin-cabeca" aria-hidden="true">
            <span>Loja</span><span>Cidade</span><span>Telefone</span><span>Itens</span>
          </li>
          {visiveis.map((l) => (
            <li key={l.id}>
              <Link to={`/admin/lojas/${l.id}`} className="linha-admin">
                <span className="linha-admin-nome">
                  <strong>{l.nome}</strong>
                  <small>CNPJ {l.cnpj}</small>
                </span>
                <span>{l.cidade} ({l.uf})</span>
                <span>{formatarTelefone(l.telefone)}</span>
                <span className={`linha-admin-itens${l.itens === 0 ? ' zerado' : ''}`}>
                  {l.itens === 0 ? 'Sem catálogo' : `${l.itens} ${l.itens === 1 ? 'item' : 'itens'}`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
