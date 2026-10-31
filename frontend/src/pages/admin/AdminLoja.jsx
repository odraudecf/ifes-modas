import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, MapPin } from 'lucide-react'
import { Carregando, Erro, Vazio } from '../../components/Estados.jsx'
import { useApi } from '../../lib/useApi.js'
import { Catalogo } from '../MinhasRoupas.jsx'
import { FormularioLoja } from '../EditarLoja.jsx'

const ABAS = [
  { id: 'roupas', rotulo: 'Roupas' },
  { id: 'dados', rotulo: 'Dados da loja' },
]

/** Uma loja vista pelo admin: o mesmo catálogo e o mesmo formulário que a loja usa, gravando nas rotas de admin. */
export default function AdminLoja() {
  const { id } = useParams()
  const { dados: loja, erro, carregando, recarregar } = useApi(`/api/admin/lojas/${id}`, { auth: true })
  const [aba, setAba] = useState('roupas')
  const [nome, setNome] = useState(null) // nome atualizado depois de salvar os dados

  if (carregando) return <Carregando texto="Abrindo a loja…" />
  if (erro?.status === 404) {
    return (
      <Vazio titulo="Loja não encontrada">
        <Link to="/admin/lojas" className="botao">Voltar para as lojas</Link>
      </Vazio>
    )
  }
  if (erro) return <Erro mensagem={erro.message} tentarDeNovo={recarregar} />

  const rotas = {
    criar: `/api/admin/lojas/${loja.id}/uniformes`,
    item: (uniformeId) => `/api/admin/lojas/${loja.id}/uniformes/${uniformeId}`,
  }

  return (
    <>
      <Link to="/admin/lojas" className="voltar"><ArrowLeft size={16} />Lojas</Link>
      <div className="painel-cabeca com-acao">
        <div>
          <h1>{nome ?? loja.nome}</h1>
          <p className="admin-loja-meta">
            <span>CNPJ {loja.cnpj}</span>
            <span><MapPin size={14} />{loja.endereco.cidade} ({loja.endereco.uf})</span>
          </p>
        </div>
        <Link to={`/lojas/${loja.id}`} className="botao secundario"><ExternalLink size={18} />Ver página pública</Link>
      </div>

      <div className="abas" role="tablist" aria-label="Seções da loja">
        {ABAS.map((a) => (
          <button
            key={a.id}
            type="button"
            role="tab"
            id={`aba-${a.id}`}
            aria-selected={aba === a.id}
            aria-controls={`painel-${a.id}`}
            className="aba"
            onClick={() => setAba(a.id)}
          >
            {a.rotulo}
          </button>
        ))}
      </div>

      {/* Os dois ficam montados: trocar de aba não perde o que foi digitado. */}
      <div id="painel-roupas" role="tabpanel" aria-labelledby="aba-roupas" hidden={aba !== 'roupas'}>
        <Catalogo inicial={loja.uniformes} rotas={rotas} embutido />
      </div>
      <div id="painel-dados" role="tabpanel" aria-labelledby="aba-dados" hidden={aba !== 'dados'}>
        <FormularioLoja
          inicial={loja}
          salvarEm={`/api/admin/lojas/${loja.id}`}
          aoSalvar={(atualizada) => setNome(atualizada.nome)}
          embutido
        />
      </div>
    </>
  )
}
