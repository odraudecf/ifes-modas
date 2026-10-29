import { Link } from 'react-router-dom'
import { Hero } from '../components/Hero.jsx'
import { Carregando, Erro, Vazio } from '../components/Estados.jsx'
import { useApi } from '../lib/useApi.js'

/** RF03: lojas agrupadas por estado e cidade (o agrupamento vem pronto da API). */
export default function Lojas() {
  const { dados: estados, erro, carregando, recarregar } = useApi('/api/lojas')

  return (
    <>
      <Hero titulo="Lojas" />

      <section className="secao container">
        {carregando && <Carregando texto="Buscando lojas…" />}
        {erro && <Erro mensagem={erro.message} tentarDeNovo={recarregar} />}
        {estados?.length === 0 && (
          <Vazio>
            <p>Nenhuma loja cadastrada ainda.</p>
            <Link to="/cadastro" className="botao">Cadastrar minha loja</Link>
          </Vazio>
        )}

        {estados?.length > 0 && (
          <div className="estados">
            {estados.map((estado) => (
              <section key={estado.uf} className="estado" aria-labelledby={`uf-${estado.uf}`}>
                <h2 id={`uf-${estado.uf}`}>{estado.nomeEstado}</h2>
                <div className="cidades">
                  {estado.cidades.map((cidade) => (
                    <div key={cidade.cidade} className="cidade">
                      <h3>{cidade.cidade}</h3>
                      <ul className="lista-lojas">
                        {cidade.lojas.map((loja) => (
                          <li key={loja.id}>
                            <Link to={`/lojas/${loja.id}`}>
                              <span>{loja.nome} <small>· {loja.bairro}</small></span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    </>
  )
}
