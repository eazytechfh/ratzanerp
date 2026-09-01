export type TipoPessoa = 'PF' | 'PJ'

export type StatusCliente = 'ativo' | 'inativo' | 'vencendo' | 'vencido'

export interface Endereco {
  id: string
  rotulo: string
  endereco: string
  cidade: string
  uf: string
  cep: string
}

export interface CategoriaCliente {
  id: string
  nome: string
  cor: string
}

export const ORIGENS_SERVICO = ['Indicação', 'Site', 'Redes Sociais', 'Tráfego Pago', 'Telefone', 'Já é Cliente', 'Outro'] as const
export type OrigemServico = (typeof ORIGENS_SERVICO)[number]

export interface Cliente {
  id: string
  tipo: TipoPessoa
  nome: string
  cpf?: string
  cnpj?: string
  email: string
  telefone: string
  bairro: string
  categoriaId?: string
  enderecos: Endereco[]
  status: StatusCliente
  dataCadastro: string
  contratoInicio: string
  contratoFim: string
  recorrente: boolean
  possuiPet: boolean
  precisaEpi: boolean
  origem: OrigemServico
  observacoes?: string
  contatoResponsavel?: string
}

export type StatusServico = 'agendado' | 'em_andamento' | 'concluido' | 'cancelado'

export type TipoAtendimento = 'novo' | 'reforco'

export type FormaPagamento =
  | 'pix'
  | 'transferencia'
  | 'debito'
  | 'credito'
  | 'boleto_pj'
  | 'garantia'
  | 'dinheiro'
  | 'incluso_no_contrato'

export interface TipoServicoItem {
  id: string
  nome: string
}

export interface TipoPragaItem {
  id: string
  nome: string
}

export const PRAGAS = [
  'Baratas',
  'Cupins',
  'Ratos/Roedores',
  'Escorpiões',
  'Pombos',
  'Formigas',
  'Percevejos',
  'Mosquitos',
  'Aranhas',
  'Carrapatos/Pulgas',
] as const

export type Maquininha = 'infinity' | 'itau' | 'santander'

export const MAQUININHAS: { value: Maquininha; label: string }[] = [
  { value: 'infinity', label: 'Infinity' },
  { value: 'itau', label: 'Itaú' },
  { value: 'santander', label: 'Santander' },
]

// Taxas fictícias — ajustar quando os dados reais das maquininhas forem informados.
export const TAXAS_MAQUININHA: Record<Maquininha, { debito: number; credito: (parcelas: number) => number }> = {
  infinity: {
    debito: 0.0159,
    credito: (parcelas) => 0.0299 + (Math.max(parcelas, 1) - 1) * 0.0119,
  },
  itau: {
    debito: 0.0179,
    credito: (parcelas) => 0.0349 + (Math.max(parcelas, 1) - 1) * 0.0129,
  },
  santander: {
    debito: 0.0169,
    credito: (parcelas) => 0.0319 + (Math.max(parcelas, 1) - 1) * 0.0124,
  },
}

export interface ParcelaServico {
  valor: number
  vencimento: string
}

export type TipoAplicacao = 'aplicacao' | 'reforco'

export interface BaixaServico {
  dataServico: string
  garantiaAte?: string
  horaInicio: string
  horaFim: string
  pragas: string[]
  aplicacao: TipoAplicacao
  cipergranMl?: number
  ddvpMl?: number
  cropnilMl?: number
  portaIscaQtd?: number
  raticidaQtd?: number
  observacoes?: string
  assinaturaCliente: string
  emitirCertificado: boolean
  recusouAplicacaoVeneno: boolean
  assinaturaTermoCiencia?: string
}

export interface Servico {
  id: string
  clienteId: string
  clienteNome: string
  tipoServico: string
  operador: string
  dataAgendada: string
  horaAgendada: string
  status: StatusServico
  endereco: string
  observacoes?: string
  valor: number
  tipoAtendimento: TipoAtendimento
  pragas: string[]
  formaPagamento: FormaPagamento
  parcelas?: number
  contabilizarReceita: boolean
  garantiaAte?: string
  horaInicioReal?: string
  maquininha?: Maquininha
  parcelasDetalhe?: ParcelaServico[]
  baixa?: BaixaServico
}

export interface Operador {
  id: string
  nome: string
  telefone?: string
  endereco?: string
  cargo?: string
}

export interface MetaMensal {
  ano: number
  mes: number
  valor: number
}

export interface Fornecedor {
  id: string
  nome: string
  tipoPrestacaoServico: string
  cnpj?: string
  cpf?: string
  email?: string
  telefone?: string
  endereco?: string
  observacoes?: string
}

export type StatusConta = 'pendente' | 'pago' | 'cancelado'

export interface ContaPagar {
  id: string
  descricao: string
  fornecedorId?: string
  categoria: string
  valor: number
  vencimento: string
  status: StatusConta
  dataPagamento?: string
  criadoEm?: string
}

export interface ContaReceberItem {
  id: string
  clienteId: string
  clienteNome: string
  descricao: string
  valor: number
  vencimento: string
  status: StatusConta
  origem: 'servico' | 'recorrente' | 'manual'
  formaPagamento?: FormaPagamento
  tipoAtendimento?: TipoAtendimento
  parcela?: number
  totalParcelas?: number
}

export interface ContaReceberManual {
  id: string
  clienteId: string
  clienteNome: string
  descricao: string
  valor: number
  vencimento: string
  status: StatusConta
  dataPagamento?: string
  criadoEm?: string
}

export const PERIODICIDADES = ['Mensal', 'Bimestral', 'Trimestral', 'Semestral', 'Anual', 'Avulso'] as const
export type Periodicidade = (typeof PERIODICIDADES)[number]

export interface Contrato {
  id: string
  clienteId: string
  contratanteNome: string
  contratanteDocumento: string
  contratanteEndereco: string
  contratanteEmail: string
  servicosAbrangidos: string
  reajustePercentual: number
  periodicidade: Periodicidade
  reforcoProgramado: string
  valorTotal: number
  formaPagamento: string
  parcelado: boolean
  qtdParcelas?: number
  valorParcela?: number
  vencimentos: string
  dataInicio: string
  dataFim: string
  dataAssinatura: string
  responsavelContratante: string
  representanteRatzan: string
  criadoEm: string
}

export type FrequenciaRecorrencia = 'diaria' | 'semanal' | 'mensal' | 'semestral'

export interface Alerta {
  id: string
  clienteId: string
  clienteNome: string
  texto: string
  prioridade: 'baixa' | 'media' | 'alta'
  concluido: boolean
  criadoPor: string
  criadoEm: string
  dataVencimento: string
  recorrente: boolean
  frequencia?: FrequenciaRecorrencia
}

export interface LogEntry {
  id: string
  usuario: string
  acao: string
  detalhes: string
  data: string
}

export const USER_ROLES = ['operador', 'gerente_operacional', 'gerente_geral', 'administrador'] as const
export type UserRole = (typeof USER_ROLES)[number]

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  operador: 'Operador',
  gerente_operacional: 'Gerente Operacional',
  gerente_geral: 'Gerente Geral',
  administrador: 'Administrador',
}

export interface Perfil {
  id: string
  nome: string
  email: string
  role: UserRole
  operadorId?: string
}
