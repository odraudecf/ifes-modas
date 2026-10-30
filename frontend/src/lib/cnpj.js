// Mesma regra do back-end (Cnpj.cs), incluindo o CNPJ alfanumérico: o valor de cada caractere é
// o código ASCII menos 48, então para CNPJ só com números o cálculo é o tradicional.
// Aqui serve só para não consultar a Receita com um número digitado errado; quem valida de verdade é a API.

const PESOS_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
const PESOS_2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

export const normalizarCnpj = (valor = '') => valor.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 14)

function digito(base, pesos) {
  const resto = pesos.reduce((soma, peso, i) => soma + (base.charCodeAt(i) - 48) * peso, 0) % 11
  return resto < 2 ? 0 : 11 - resto
}

export function cnpjValido(valor) {
  const c = normalizarCnpj(valor)
  if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(c) || new Set(c).size === 1) return false
  const dv1 = digito(c.slice(0, 12), PESOS_1)
  const dv2 = digito(c.slice(0, 12) + dv1, PESOS_2)
  return c.endsWith(`${dv1}${dv2}`)
}
