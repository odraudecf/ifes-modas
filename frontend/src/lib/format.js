const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export const formatarPreco = (valor) => moeda.format(valor)

/** "R$ 40,00" quando o preço é único; "R$ 37,50 a R$ 45,00" quando varia. */
export const formatarFaixa = (menor, maior) => (menor === maior ? formatarPreco(menor) : `${formatarPreco(menor)} a ${formatarPreco(maior)}`)

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

/** Link para o WhatsApp a partir do telefone (só dígitos, com DDI do Brasil), com mensagem pronta opcional. */
export function linkWhatsApp(telefone, mensagem) {
  const base = `https://wa.me/55${telefone.replace(/\D/g, '')}`
  return mensagem ? `${base}?text=${encodeURIComponent(mensagem)}` : base
}

/** Link de ligação: "tel:+5528999990001". */
export const linkTelefone = (telefone) => `tel:+55${telefone.replace(/\D/g, '')}`

/** Rota até a loja no Google Maps, a partir do endereço cadastrado. */
export function linkMapa({ rua, numero, bairro, cidade, uf }) {
  const destino = `${rua}, ${numero}, ${bairro}, ${cidade} - ${uf}`
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destino)}`
}

/** Só aceita http/https: um "javascript:..." salvo no banco nunca vira link clicável. */
export const linkSeguro = (url) => (/^https?:\/\//i.test(url ?? '') ? url : null)

/** Iniciais para o selo da loja: "Malharia Caparaó" → "MC". */
export function iniciais(nome = '') {
  const palavras = nome.split(/\s+/).filter((p) => p.length > 2 || /^[A-ZÀ-Ú]/.test(p))
  return (palavras.slice(0, 2).map((p) => p[0]).join('') || nome.slice(0, 2)).toUpperCase()
}
