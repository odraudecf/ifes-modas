import { Check, CircleAlert } from 'lucide-react'

/** O que a busca do CNPJ encontrou (ou por que não encontrou). */
export function ResultadoConsulta({ consulta }) {
  if (consulta.estado === 'buscando') {
    return <p className="consulta-cnpj" role="status">Buscando os dados na Receita Federal…</p>
  }
  if (consulta.estado === 'falhou') {
    return (
      <p className="consulta-cnpj aviso-leve" role="status">
        <CircleAlert size={18} />
        <span>{consulta.mensagem}</span>
      </p>
    )
  }
  if (consulta.estado !== 'achou') return null

  const { dados } = consulta
  return (
    <div className={`consulta-cnpj achou${dados.ativa ? '' : ' inativa'}`} role="status">
      {dados.ativa ? <Check size={18} /> : <CircleAlert size={18} />}
      <div>
        <strong>{dados.razaoSocial}</strong>
        <span>
          {dados.ativa
            ? 'Preenchemos nome, telefone e endereço com os dados da Receita. Confira antes de continuar.'
            : `Situação na Receita: ${dados.situacao}. Confira se o CNPJ está certo.`}
        </span>
      </div>
    </div>
  )
}
