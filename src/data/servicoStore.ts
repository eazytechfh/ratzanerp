import { createSupabaseStore } from './createSupabaseStore'
import type { Servico } from '../types'

interface ServicoRow {
  id: string
  cliente_id: string
  cliente_nome: string
  tipo_servico: string
  operador: string
  data_agendada: string
  hora_agendada: string
  status: string
  endereco: string | null
  observacoes: string | null
  valor: number
  tipo_atendimento: string
  pragas: string[]
  forma_pagamento: string
  parcelas: number | null
  contabilizar_receita: boolean
  garantia_ate: string | null
  hora_inicio_real: string | null
  baixa: Servico['baixa'] | null
}

function fromRow(r: ServicoRow): Servico {
  return {
    id: r.id,
    clienteId: r.cliente_id,
    clienteNome: r.cliente_nome,
    tipoServico: r.tipo_servico,
    operador: r.operador,
    dataAgendada: r.data_agendada,
    horaAgendada: r.hora_agendada,
    status: r.status as Servico['status'],
    endereco: r.endereco ?? '',
    observacoes: r.observacoes ?? undefined,
    valor: Number(r.valor),
    tipoAtendimento: r.tipo_atendimento as Servico['tipoAtendimento'],
    pragas: r.pragas ?? [],
    formaPagamento: r.forma_pagamento as Servico['formaPagamento'],
    parcelas: r.parcelas ?? undefined,
    contabilizarReceita: r.contabilizar_receita,
    garantiaAte: r.garantia_ate ?? undefined,
    horaInicioReal: r.hora_inicio_real ?? undefined,
    baixa: r.baixa ?? undefined,
  }
}

function toRow(s: Servico): ServicoRow {
  return {
    id: s.id,
    cliente_id: s.clienteId,
    cliente_nome: s.clienteNome,
    tipo_servico: s.tipoServico,
    operador: s.operador,
    data_agendada: s.dataAgendada,
    hora_agendada: s.horaAgendada,
    status: s.status,
    endereco: s.endereco ?? null,
    observacoes: s.observacoes ?? null,
    valor: s.valor,
    tipo_atendimento: s.tipoAtendimento,
    pragas: s.pragas,
    forma_pagamento: s.formaPagamento,
    parcelas: s.parcelas ?? null,
    contabilizar_receita: s.contabilizarReceita,
    garantia_ate: s.garantiaAte ?? null,
    hora_inicio_real: s.horaInicioReal ?? null,
    baixa: s.baixa ?? null,
  }
}

const store = createSupabaseStore<Servico, ServicoRow>({
  table: 'servicos',
  fromRow,
  toRow,
  orderBy: { column: 'created_at', ascending: false },
})

export function useServicos(): Servico[] {
  return store.useAll()
}

export function getServicoById(id: string): Servico | undefined {
  return store.getById(id)
}

export async function addServico(servico: Servico) {
  const { error, created } = await store.add(servico)
  if (error) console.error(error)
  return created
}

export async function updateServico(id: string, changes: Partial<Servico>) {
  const { error } = await store.update(id, changes)
  if (error) console.error(error)
}

export async function removeServico(id: string) {
  const { error } = await store.remove(id)
  if (error) console.error(error)
}
