import { Link, useParams } from 'react-router-dom'
import { Hero } from '../components/Hero.jsx'
import { Carregando, Erro, Vazio } from '../components/Estados.jsx'
import { useAuth } from '../auth/AuthContext.js'
import { useApi } from '../lib/useApi.js'
import { formatarPreco, formatarTelefone, linkSeguro, linkWhatsApp } from '../lib/format.js'
import { agruparCatalogo } from '../lib/uniformes.js'

/** RF08 + RF09: dados da loja e catálogo de uniformes. */
export default function Loja() {
  const { id } = useParams()
  const { loja: lojaLogada } = useAuth()
  const { dados: loja, erro, carregando, recarregar } = useApi(`/api/lojas/${id}`)

  if (carregando) return <Carregando texto="Abrindo a loja…" />
  if (erro?.status === 404) {
    return (
      <Vazio>
        <p>Essa loja não existe ou foi removida.</p>
        <Link to="/lojas" className="botao">Ver todas as lojas</Link>
      </Vazio>
    )
  }
  if (erro) return <Erro mensagem={erro.message} tentarDeNovo={recarregar} />

  const { endereco } = loja
  const instagram = linkSeguro(loja.instagram)
  const facebook = linkSeguro(loja.facebook)
  const secoes = agruparCatalogo(loja.uniformes)
  const ehMinhaLoja = lojaLogada?.id === loja.id

  return (
    <>
      <Hero titulo={loja.nome} mostrarLogo={false}>
        <ul className="loja-info">
          <li>{endereco.cidade}, {endereco.uf}</li>
          <li>{endereco.rua}, {endereco.numero}</li>
          <li>Bairro {endereco.bairro}</li>
          <li>{formatarTelefone(loja.telefone)}</li>
        </ul>
        <div className="loja-contatos">
          <a className="contato" href={linkWhatsApp(loja.telefone)} target="_blank" rel="noopener noreferrer">WhatsApp</a>
          {instagram && <a className="contato" href={instagram} target="_blank" rel="noopener noreferrer">Instagram</a>}
          {facebook && <a className="contato" href={facebook} target="_blank" rel="noopener noreferrer">Facebook</a>}
        </div>
      </Hero>

      <section className="secao container">
        {secoes.length === 0 ? (
          <Vazio>
            <p>Esta loja ainda não cadastrou uniformes.</p>
            {ehMinhaLoja && <Link to="/gerenciamento/roupas" className="botao">Cadastrar uniformes</Link>}
          </Vazio>
        ) : (
          <div className="catalogo">
            {secoes.map((secao) => (
              <section key={secao.chave} className="peca" aria-labelledby={secao.chave}>
                <h2 id={secao.chave}>{secao.titulo}</h2>
                <div className="peca-generos">
                  {secao.generos.map(({ genero, tamanhos }) => (
                    <article key={genero} className="grupo">
                      <img src={secao.imagem} alt="" width="120" height="120" loading="lazy" />
                      <div>
                        <h3>{genero}</h3>
                        <ul className="tamanhos" aria-label={`Tamanhos e preços, ${secao.titulo.toLowerCase()} ${genero.toLowerCase()}`}>
                          {tamanhos.map((u) => (
                            <li key={u.id} className="tamanho">
                              <strong>{u.tamanho}</strong>
                              <span>{formatarPreco(u.preco)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <div className="centro">
          <Link to="/lojas" className="botao secundario">Ver outras lojas</Link>
        </div>
      </section>
    </>
  )
}
