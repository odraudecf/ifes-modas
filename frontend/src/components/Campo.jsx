import { useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

/** Campo de formulário com rótulo visível, dica opcional e mensagem de erro ligada ao input (acessível). */
export function Campo({ rotulo, erro, dica, prefixo, sufixo, ...props }) {
  const id = useId()
  const idDica = `${id}-dica`
  const controle = <input id={id} aria-invalid={!!erro} aria-describedby={erro || dica ? idDica : undefined} {...props} />

  return (
    <div className={`campo${erro ? ' com-erro' : ''}`}>
      <label htmlFor={id}>{rotulo}</label>
      {prefixo || sufixo ? (
        <div className="campo-caixa">
          {prefixo && <span className="campo-prefixo">{prefixo}</span>}
          {controle}
          {sufixo}
        </div>
      ) : controle}
      {(erro || dica) && <span id={idDica} className={erro ? 'campo-erro' : 'campo-dica'}>{erro ?? dica}</span>}
    </div>
  )
}

/** Senha com botão para mostrar o que foi digitado (evita erro de digitação no celular). */
export function CampoSenha(props) {
  const [visivel, setVisivel] = useState(false)
  return (
    <Campo
      {...props}
      type={visivel ? 'text' : 'password'}
      sufixo={(
        <button type="button" className="campo-botao" onClick={() => setVisivel((v) => !v)} aria-pressed={visivel}>
          {visivel ? <EyeOff size={18} /> : <Eye size={18} />}
          <span className="sr-only">Mostrar senha</span>
        </button>
      )}
    />
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
