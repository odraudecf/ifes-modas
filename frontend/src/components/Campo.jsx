import { useId } from 'react'

/** Campo de formulário com rótulo visível e mensagem de erro ligada ao input (acessível). */
export function Campo({ rotulo, erro, prefixo, ...props }) {
  const id = useId()
  const idErro = `${id}-erro`
  const controle = <input id={id} aria-invalid={!!erro} aria-describedby={erro ? idErro : undefined} {...props} />

  return (
    <div className={`campo${erro ? ' com-erro' : ''}`}>
      <label htmlFor={id}>{rotulo}</label>
      {prefixo ? <div className="campo-prefixo"><span>{prefixo}</span>{controle}</div> : controle}
      {erro && <span id={idErro} className="campo-erro">{erro}</span>}
    </div>
  )
}

/** Select com o mesmo visual do Campo. */
export function CampoSelect({ rotulo, erro, opcoes, ...props }) {
  const id = useId()
  return (
    <div className={`campo${erro ? ' com-erro' : ''}`}>
      <label htmlFor={id}>{rotulo}</label>
      <select id={id} aria-invalid={!!erro} {...props}>
        {opcoes.map((o) => {
          const { valor, rotulo: texto } = typeof o === 'string' ? { valor: o, rotulo: o } : o
          return <option key={valor} value={valor}>{texto}</option>
        })}
      </select>
      {erro && <span className="campo-erro">{erro}</span>}
    </div>
  )
}
