import { useEffect, useState } from 'react'

/** Carregando: a grade da logo do Ifes acende quadrado a quadrado. */
export function Carregando({ texto = 'Carregando…' }) {
  const [demorando, setDemorando] = useState(false)

  // A API no plano gratuito do Render "dorme" sem uso e leva até ~1 min para acordar.
  useEffect(() => {
    const t = setTimeout(() => setDemorando(true), 5000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="estado-tela" role="status">
      <div className="grade-ifes" aria-hidden="true">
        {Array.from({ length: 9 }, (_, i) => <span key={i} />)}
      </div>
      <p>{texto}</p>
      {demorando && <p className="estado-nota">O servidor estava em repouso e está ligando. Na primeira visita isso pode levar até um minuto.</p>}
    </div>
  )
}

export function Erro({ mensagem, tentarDeNovo }) {
  return (
    <div className="estado-tela" role="alert">
      <h2>Não foi possível carregar</h2>
      <p>{mensagem}</p>
      {tentarDeNovo && <button type="button" className="botao secundario" onClick={tentarDeNovo}>Tentar de novo</button>}
    </div>
  )
}

export function Vazio({ titulo, children }) {
  return (
    <div className="estado-tela">
      {titulo && <h2>{titulo}</h2>}
      {children}
    </div>
  )
}
