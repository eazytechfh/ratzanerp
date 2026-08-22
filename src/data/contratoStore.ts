import { createSupabaseStore } from './createSupabaseStore'
import type { Contrato } from '../types'

interface ContratoRow {
  id: string
  cliente_id: string
  contratante_nome: string | null
  contratante_documento: string | null
  contratante_endereco: string | null
  contratante_email: string | null
  servicos_abrangidos: string | null
  reajuste_percentual: number | null
  periodicidade: string | null
  reforco_programado: string | null
  valor_total: number | null
  forma_pagamento: string | null
  parcelado: boolean | null
  qtd_parcelas: number | null
  valor_parcela: number | null
  vencimentos: string | null
  data_inicio: string | null
  data_fim: string | null
  data_assinatura: string | null
  responsavel_contratante: string | null
  representante_ratzan: string | null
  criado_em: string
}

function fromRow(r: ContratoRow): Contrato {
  return {
    id: r.id,
    clienteId: r.cliente_id,
    contratanteNome: r.contratante_nome ?? '',
    contratanteDocumento: r.contratante_documento ?? '',
    contratanteEndereco: r.contratante_endereco ?? '',
    contratanteEmail: r.contratante_email ?? '',
    servicosAbrangidos: r.servicos_abrangidos ?? '',
    reajustePercentual: Number(r.reajuste_percentual ?? 0),
    periodicidade: (r.periodicidade ?? 'Avulso') as Contrato['periodicidade'],
    reforcoProgramado: r.reforco_programado ?? '',
    valorTotal: Number(r.valor_total ?? 0),
    formaPagamento: r.forma_pagamento ?? '',
    parcelado: r.parcelado ?? false,
    qtdParcelas: r.qtd_parcelas ?? undefined,
    valorParcela: r.valor_parcela ?? undefined,
    vencimentos: r.vencimentos ?? '',
    dataInicio: r.data_inicio ?? '',
    dataFim: r.data_fim ?? '',
    dataAssinatura: r.data_assinatura ?? '',
    responsavelContratante: r.responsavel_contratante ?? '',
    representanteRatzan: r.representante_ratzan ?? '',
    criadoEm: r.criado_em,
  }
}

function toRow(c: Contrato): ContratoRow {
  return {
    id: c.id,
    cliente_id: c.clienteId,
    contratante_nome: c.contratanteNome,
    contratante_documento: c.contratanteDocumento,
    contratante_endereco: c.contratanteEndereco,
    contratante_email: c.contratanteEmail,
    servicos_abrangidos: c.servicosAbrangidos,
    reajuste_percentual: c.reajustePercentual,
    periodicidade: c.periodicidade,
    reforco_programado: c.reforcoProgramado,
    valor_total: c.valorTotal,
    forma_pagamento: c.formaPagamento,
    parcelado: c.parcelado,
    qtd_parcelas: c.qtdParcelas ?? null,
    valor_parcela: c.valorParcela ?? null,
    vencimentos: c.vencimentos,
    data_inicio: c.dataInicio,
    data_fim: c.dataFim,
    data_assinatura: c.dataAssinatura,
    responsavel_contratante: c.responsavelContratante,
    representante_ratzan: c.representanteRatzan,
    criado_em: c.criadoEm,
  }
}

const store = createSupabaseStore<Contrato, ContratoRow>({
  table: 'contratos',
  fromRow,
  toRow,
  orderBy: { column: 'criado_em', ascending: false },
})

export function useContratos(): Contrato[] {
  return store.useAll()
}

export function getContratoById(id: string): Contrato | undefined {
  return store.getById(id)
}

export async function addContrato(contrato: Contrato) {
  const { error, created } = await store.add(contrato)
  if (error) console.error(error)
  return created
}
