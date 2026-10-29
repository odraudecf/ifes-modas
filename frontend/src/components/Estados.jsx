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
      {demorando && <p>O servidor estava em repouso e está ligando. Isso pode levar até um minuto na primeira visita.</p>}
    </div>
  )
}

export function Erro({ mensagem, tentarDeNovo }) {
  return (
    <div className="estado-tela" role="alert">
      <p>{mensagem}</p>
      {tentarDeNovo && <button type="button" className="botao secundario" onClick={tentarDeNovo}>Tentar de novo</button>}
    </div>
  )
}

export function Vazio({ children }) {
  return <div className="estado-tela">{children}</div>
}
