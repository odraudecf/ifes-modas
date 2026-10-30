import { useId } from 'react'

/**
 * Grupo de opções em forma de etiqueta de roupa (o elemento visual do site).
 * Escolha única por padrão; com `multiplo`, `valor` é uma lista.
 * `desabilitadas` recebe valores que não podem ser escolhidos e `dica` explica o motivo.
 */
export function Opcoes({ rotulo, opcoes, valor, alterar, multiplo = false, desabilitadas = [], dica, erro, compacto = false }) {
  const id = useId()

  function escolher(v) {
    if (!multiplo) return alterar(v)
    alterar(valor.includes(v) ? valor.filter((x) => x !== v) : [...valor, v])
  }

  return (
    <div className={`campo${erro ? ' com-erro' : ''}`}>
      <span className="campo-rotulo" id={`${id}-rotulo`}>{rotulo}</span>
      <div className={`etiquetas${compacto ? ' compactas' : ''}`} role="group" aria-labelledby={`${id}-rotulo`} aria-describedby={dica || erro ? `${id}-dica` : undefined}>
        {opcoes.map((o) => {
          const { valor: v, rotulo: texto, imagem } = typeof o === 'string' ? { valor: o, rotulo: o } : o
          const marcada = multiplo ? valor.includes(v) : valor === v
          return (
            <button
              key={v}
              type="button"
              className={`etiqueta${imagem ? ' com-imagem' : ''}`}
              aria-pressed={marcada}
              disabled={desabilitadas.includes(v)}
              onClick={() => escolher(v)}
            >
              {imagem && <img src={imagem} alt="" width="44" height="44" />}
              {texto}
            </button>
          )
        })}
      </div>
      {(erro || dica) && <span id={`${id}-dica`} className={erro ? 'campo-erro' : 'campo-dica'}>{erro ?? dica}</span>}
    </div>
  )
}
