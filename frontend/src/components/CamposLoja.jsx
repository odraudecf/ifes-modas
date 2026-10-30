import { Campo, CampoSelect } from './Campo.jsx'
import { formatarTelefone } from '../lib/format.js'
import { UFS } from '../lib/loja.js'

// Partes do formulário da loja, usadas no cadastro (uma por etapa) e na alteração de dados.
// Todas recebem { valores, alterar, erros }, com `valores` no formato de lojaVazia.

export function CamposContato({ valores, alterar, erros }) {
  return (
    <>
      <Campo
        rotulo="Nome da loja"
        value={valores.nome}
        onChange={(e) => alterar({ ...valores, nome: e.target.value })}
        erro={erros.nome}
        required
        maxLength={120}
        autoComplete="organization"
      />
      <Campo
        rotulo="WhatsApp ou telefone, com DDD"
        dica="Os alunos falam com a loja por este número."
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
    </>
  )
}

export function CamposEndereco({ valores, alterar, erros }) {
  const end = (nome) => (e) => alterar({ ...valores, endereco: { ...valores.endereco, [nome]: e.target.value } })
  return (
    <>
      <div className="linha rua">
        <Campo rotulo="Rua" value={valores.endereco.rua} onChange={end('rua')} erro={erros['endereco.rua']} required maxLength={150} autoComplete="address-line1" />
        <Campo rotulo="Número" value={valores.endereco.numero} onChange={end('numero')} erro={erros['endereco.numero']} required maxLength={10} placeholder="S/N" />
      </div>
      <Campo rotulo="Bairro" value={valores.endereco.bairro} onChange={end('bairro')} erro={erros['endereco.bairro']} required maxLength={100} />
      <div className="linha cidade">
        <Campo rotulo="Cidade" value={valores.endereco.cidade} onChange={end('cidade')} erro={erros['endereco.cidade']} required maxLength={100} autoComplete="address-level2" />
        <CampoSelect rotulo="Estado" value={valores.endereco.uf} onChange={end('uf')} erro={erros['endereco.uf']} opcoes={UFS} />
      </div>
    </>
  )
}

export function CamposRedes({ valores, alterar, erros }) {
  return (
    <>
      <Campo rotulo="Instagram (opcional)" type="url" placeholder="https://instagram.com/sualoja" value={valores.instagram ?? ''} onChange={(e) => alterar({ ...valores, instagram: e.target.value })} erro={erros.instagram} maxLength={255} />
      <Campo rotulo="Facebook (opcional)" type="url" placeholder="https://facebook.com/sualoja" value={valores.facebook ?? ''} onChange={(e) => alterar({ ...valores, facebook: e.target.value })} erro={erros.facebook} maxLength={255} />
    </>
  )
}
