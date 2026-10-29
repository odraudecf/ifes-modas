const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export const formatarPreco = (valor) => moeda.format(valor)

/** "28999990001" → "(28) 99999-0001" */
export function formatarTelefone(valor = '') {
  const d = valor.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d.length ? `(${d}` : ''
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

/** Máscara de CNPJ, aceitando letras (CNPJ alfanumérico): "12ABC34501DE35" → "12.ABC.345/01DE-35" */
export function formatarCnpj(valor = '') {
  const c = valor.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 14)
  const partes = [c.slice(0, 2), c.slice(2, 5), c.slice(5, 8), c.slice(8, 12), c.slice(12, 14)]
  let saida = partes[0]
  if (partes[1]) saida += `.${partes[1]}`
  if (partes[2]) saida += `.${partes[2]}`
  if (partes[3]) saida += `/${partes[3]}`
  if (partes[4]) saida += `-${partes[4]}`
  return saida
}

/** Link para o WhatsApp a partir do telefone (só dígitos, com DDI do Brasil). */
export const linkWhatsApp = (telefone) => `https://wa.me/55${telefone.replace(/\D/g, '')}`

/** Só aceita http/https: um "javascript:..." salvo no banco nunca vira link clicável. */
export const linkSeguro = (url) => (/^https?:\/\//i.test(url ?? '') ? url : null)
