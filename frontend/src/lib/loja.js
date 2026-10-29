// UFs aceitas pela API (Ufs.cs). O cadastro antigo tinha "BH", que é cidade, não estado.
export const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']

export const lojaVazia = {
  nome: '', telefone: '', instagram: '', facebook: '',
  endereco: { rua: '', numero: '', bairro: '', cidade: '', uf: 'ES' },
}
