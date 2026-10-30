import { Check } from 'lucide-react'

const VANTAGENS = [
  'Cadastro gratuito',
  'Tamanhos e preços sempre atualizados por você',
  'Alunos chegam pelo WhatsApp já sabendo o que querem',
]

/** Login e cadastro: formulário à esquerda e, ao lado, o que a loja ganha com o cadastro. */
export function MolduraAcesso({ children }) {
  return (
    <div className="container acesso">
      <div className="acesso-form">{children}</div>
      <aside className="acesso-lado">
        <h2>Para lojas que vendem o uniforme do Ifes</h2>
        <ul>
          {VANTAGENS.map((v) => <li key={v}><Check size={20} />{v}</li>)}
        </ul>
      </aside>
    </div>
  )
}
