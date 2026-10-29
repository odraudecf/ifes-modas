import { Campo, CampoSelect } from './Campo.jsx'
import { formatarTelefone } from '../lib/format.js'
import { UFS } from '../lib/loja.js'

/** Dados da loja, endereço e redes sociais: usados no cadastro e na alteração de dados. */
export function CamposLoja({ valores, alterar, erros }) {
  const campo = (nome) => (e) => alterar({ ...valores, [nome]: e.target.value })
  const end = (nome) => (e) => alterar({ ...valores, endereco: { ...valores.endereco, [nome]: e.target.value } })

  return (
    <>
      <fieldset className="grupo-campos">
        <legend>Dados da loja</legend>
        <Campo rotulo="Nome da loja" value={valores.nome} onChange={campo('nome')} erro={erros.nome} required maxLength={120} autoComplete="organization" />
        <Campo
          rotulo="Telefone (com DDD)"
          prefixo="+55"
          type="tel"
          inputMode="numeric"
          placeholder="(28) 99999-9999"
          value={formatarTelefone(valores.telefone)}
          onChange={(e) => alterar({ ...valores, telefone: e.target.value.replace(/\D/g, '').slice(0, 11) })}
          erro={erros.telefone}
          required
          autoComplete="tel-national"
        />
      </fieldset>

      <fieldset className="grupo-campos">
        <legend>Endereço</legend>
        <div className="linha rua">
          <Campo rotulo="Rua" value={valores.endereco.rua} onChange={end('rua')} erro={erros['endereco.rua']} required maxLength={150} />
          <Campo rotulo="Nº" value={valores.endereco.numero} onChange={end('numero')} erro={erros['endereco.numero']} required maxLength={10} placeholder="S/N" />
        </div>
        <Campo rotulo="Bairro" value={valores.endereco.bairro} onChange={end('bairro')} erro={erros['endereco.bairro']} required maxLength={100} />
        <div className="linha cidade">
          <Campo rotulo="Cidade" value={valores.endereco.cidade} onChange={end('cidade')} erro={erros['endereco.cidade']} required maxLength={100} />
          <CampoSelect rotulo="UF" value={valores.endereco.uf} onChange={end('uf')} erro={erros['endereco.uf']} opcoes={UFS} />
        </div>
      </fieldset>

      <fieldset className="grupo-campos">
        <legend>Redes sociais (opcional)</legend>
        <Campo rotulo="Link do Instagram" type="url" placeholder="https://instagram.com/sualoja" value={valores.instagram ?? ''} onChange={campo('instagram')} erro={erros.instagram} maxLength={255} />
        <Campo rotulo="Link do Facebook" type="url" placeholder="https://facebook.com/sualoja" value={valores.facebook ?? ''} onChange={campo('facebook')} erro={erros.facebook} maxLength={255} />
      </fieldset>
    </>
  )
}
