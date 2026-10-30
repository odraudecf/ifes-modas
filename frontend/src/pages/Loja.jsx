import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { MapPin, MessageCircle, Navigation, Phone, Store } from 'lucide-react'
import { CabecalhoPagina } from '../components/CabecalhoPagina.jsx'
import { Carregando, Erro, Vazio } from '../components/Estados.jsx'
import { IconeFacebook, IconeInstagram } from '../components/IconesMarca.jsx'
import { Opcoes } from '../components/Opcoes.jsx'
import { useAuth } from '../auth/AuthContext.js'
import { useApi } from '../lib/useApi.js'
import { formatarFaixa, formatarPreco, formatarTelefone, linkMapa, linkSeguro, linkTelefone, linkWhatsApp } from '../lib/format.js'
import { agruparCatalogo, descreverItem, generoNaPeca } from '../lib/uniformes.js'

/** RF08 + RF09: dados da loja e catálogo de uniformes. */
export default function Loja() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const { loja: lojaLogada } = useAuth()
  const { dados: loja, erro, carregando, recarregar } = useApi(`/api/lojas/${id}`)
  const [genero, setGenero] = useState('Todos')

  useEffect(() => {
    if (loja) document.title = `${loja.nome} | Ifes Modas`
  }, [loja])

  if (carregando) return <Carregando texto="Abrindo a loja…" />
  if (erro?.status === 404) {
    return (
      <Vazio titulo="Loja não encontrada">
        <p>Ela pode ter saído do site. Veja as outras lojas.</p>
        <Link to="/lojas" className="botao">Ver todas as lojas</Link>
      </Vazio>
    )
  }
  if (erro) return <Erro mensagem={erro.message} tentarDeNovo={recarregar} />

  const { endereco } = loja
  const instagram = linkSeguro(loja.instagram)
  const facebook = linkSeguro(loja.facebook)
  const ehMinhaLoja = lojaLogada?.id === loja.id

  // A peça vinda da busca (/lojas?peca=...) aparece primeiro.
  const destaque = params.get('peca')
  const secoes = agruparCatalogo(loja.uniformes).sort((a, b) => (b.peca.id === destaque) - (a.peca.id === destaque))
  const temDoisGeneros = new Set(loja.uniformes.map((u) => u.genero)).size > 1

  const perguntar = (item) => linkWhatsApp(
    loja.telefone,
    `Olá! Vi no Ifes Modas: ${descreverItem(item)}, por ${formatarPreco(item.preco)}. Ainda tem?`,
  )

  return (
    <>
      <CabecalhoPagina titulo={loja.nome} trilha={[{ rotulo: 'Lojas', para: '/lojas' }]}>
        <a className="loja-endereco" href={linkMapa(endereco)} target="_blank" rel="noopener noreferrer" title="Abrir no Google Maps">
          <MapPin size={18} />
          {endereco.rua}, {endereco.numero}, {endereco.bairro}, {endereco.cidade} ({endereco.uf})
        </a>
        <div className="loja-acoes">
          <a className="botao" href={linkWhatsApp(loja.telefone, 'Olá! Vi sua loja no Ifes Modas e queria saber sobre os uniformes.')} target="_blank" rel="noopener noreferrer">
            <MessageCircle size={18} />
            Chamar no WhatsApp
          </a>
          <a className="botao secundario" href={linkTelefone(loja.telefone)}>
            <Phone size={18} />
            {formatarTelefone(loja.telefone)}
          </a>
          <a className="botao secundario" href={linkMapa(endereco)} target="_blank" rel="noopener noreferrer">
            <Navigation size={18} />
            Como chegar
          </a>
          {instagram && (
            <a className="botao secundario quadrado" href={instagram} target="_blank" rel="noopener noreferrer" title="Instagram">
              <IconeInstagram />
              <span className="sr-only">Instagram</span>
            </a>
          )}
          {facebook && (
            <a className="botao secundario quadrado" href={facebook} target="_blank" rel="noopener noreferrer" title="Facebook">
              <IconeFacebook />
              <span className="sr-only">Facebook</span>
            </a>
          )}
        </div>
      </CabecalhoPagina>

      <div className="container secao">
        {ehMinhaLoja && (
          <div className="aviso">
            <Store size={20} />
            <p>Esta é a sua loja, do jeito que os alunos veem.</p>
            <Link to="/gerenciamento/roupas" className="botao pequeno">Editar roupas</Link>
          </div>
        )}

        {secoes.length === 0 ? (
          <Vazio titulo="Sem uniformes cadastrados">
            <p>Esta loja ainda não informou tamanhos e preços. Chame no WhatsApp para perguntar.</p>
          </Vazio>
        ) : (
          <>
            <div className="catalogo-topo">
              <div>
                <h2 className="secao-titulo">Tamanhos e preços</h2>
                <p className="catalogo-dica">Toque em um tamanho para perguntar à loja pelo WhatsApp.</p>
              </div>
              {temDoisGeneros && (
                <Opcoes rotulo="Mostrar" opcoes={['Todos', 'Masculino', 'Feminino']} valor={genero} alterar={setGenero} compacto />
              )}
            </div>

            <div className="catalogo">
              {secoes.map((secao) => {
                const generos = secao.generos.filter((g) => genero === 'Todos' || g.genero === genero)
                return (
                  <section key={secao.peca.id} className="peca" aria-labelledby={`peca-${secao.peca.id}`}>
                    <div className="peca-cabeca">
                      <img src={secao.peca.imagem} alt="" width="96" height="96" loading="lazy" />
                      <div>
                        <h3 id={`peca-${secao.peca.id}`}>{secao.peca.nome}</h3>
                        <p>{formatarFaixa(secao.menor, secao.maior)}</p>
                      </div>
                    </div>
                    <div className="peca-generos">
                      {generos.length === 0 && <p className="peca-vazia">Sem opção {generoNaPeca(genero)} nesta loja.</p>}
                      {generos.map(({ genero: g, tamanhos }) => (
                        <div key={g} className="peca-genero">
                          <h4>{g}</h4>
                          <ul className="etiquetas-preco">
                            {tamanhos.map((u) => (
                              <li key={u.id}>
                                <a
                                  className="etiqueta-preco"
                                  href={perguntar(u)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label={`${descreverItem(u)}, ${formatarPreco(u.preco)}. Perguntar no WhatsApp`}
                                >
                                  <strong>{u.tamanho}</strong>
                                  <span>{formatarPreco(u.preco)}</span>
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
            <p className="nota">Preços informados pela loja. Confirme antes de ir até lá.</p>
          </>
        )}
      </div>
    </>
  )
}
