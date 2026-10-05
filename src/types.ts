export type TipoPessoa = 'PF' | 'PJ'

export type StatusCliente = 'ativo' | 'inativo' | 'vencendo' | 'vencido'

export interface Endereco {
  id: string
  rotulo: string
  endereco: string
  cidade: string
  uf: string
  cep: string
  // Coordenadas confirmadas no mapa ao cadastrar (ver EnderecosEditor). Ausentes em
  // endereços cadastrados antes dessa funcionalidade, ou nunca confirmados no mapa.
  lat?: number
  lng?: number
}

export interface CategoriaCliente {
  id: string
  nome: string
  cor: string
}

export const ORIGENS_SERVICO = ['Indicação', 'Site', 'Redes Sociais', 'Tráfego Pago', 'Telefone', 'Já é Cliente', 'Outro'] as const
export type OrigemServico = (typeof ORIGENS_SERVICO)[number]

export const SEGMENTOS_CLIENTE = ['Mensal', 'Trimestral', 'Semestral', 'Anual'] as const
export type SegmentoCliente = (typeof SEGMENTOS_CLIENTE)[number]

export interface Cliente {
  id: string
  tipo: TipoPessoa
  nome: string
  cpf?: string
  cnpj?: string
  email?: string
  telefone: string
  bairro: string
  categoriaId?: string
  enderecos: Endereco[]
  status: StatusCliente
  dataCadastro: string
  contratoInicio: string
  contratoFim?: string
  recorrente: boolean
  possuiPet: boolean
  precisaEpi: boolean
  origem: OrigemServico
  observacoes?: string
  contatoResponsavel?: string
  segmento?: SegmentoCliente
}

export type StatusServico = 'agendado' | 'em_andamento' | 'concluido' | 'cancelado'

export type TipoAtendimento = 'novo' | 'reforco' | 'visita'

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

// Taxas reais informadas pela operadora (tela "Planos e taxas", set/2026): débito à vista
// 0,97%, crédito à vista 1,67%, parcelado 2x-6x 1,97%, parcelado 7x-12x 2,17%.
// Mesma tabela aplicada às três maquininhas até termos taxas específicas por máquina.
function taxaCreditoPadrao(parcelas: number): number {
  const n = Math.max(parcelas, 1)
  if (n === 1) return 0.0167
  if (n <= 6) return 0.0197
  return 0.0217
}

export const TAXAS_MAQUININHA: Record<Maquininha, { debito: number; credito: (parcelas: number) => number }> = {
  infinity: {
    debito: 0.0097,
    credito: taxaCreditoPadrao,
  },
  itau: {
    debito: 0.0097,
    credito: taxaCreditoPadrao,
  },
  santander: {
    debito: 0.0097,
    credito: taxaCreditoPadrao,
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
  // Coordenadas copiadas do endereço do cliente no momento do agendamento (se o
  // endereço tinha pino confirmado no mapa), usadas para abrir a rota exata na Agenda.
  enderecoLat?: number
  enderecoLng?: number
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
  /** Serviço de origem (quando origem = 'servico'), usado para editar o lançamento. */
  servicoId?: string
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
