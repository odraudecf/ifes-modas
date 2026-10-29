/**
 * Banner com a foto do campus e o cartão branco à direita, como no site original.
 * `children` permite colocar conteúdo extra no cartão (ex.: endereço na página da loja).
 */
export function Hero({ titulo, textoLongo = false, mostrarLogo = true, children }) {
  return (
    <section className="hero">
      <img className="hero-foto" src="/img/hero-campus.webp" alt="" fetchPriority="high" />
      <div className="container hero-conteudo">
        <div className={`hero-cartao${textoLongo ? ' texto-longo' : ''}`}>
          {mostrarLogo && <img src="/img/logo-ifes.webp" alt="Instituto Federal do Espírito Santo" width="96" height="129" />}
          <div>
            <h1>{titulo}</h1>
            {children}
          </div>
        </div>
      </div>
    </section>
  )
}
