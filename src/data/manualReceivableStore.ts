import { createSupabaseStore } from './createSupabaseStore'
import type { ContaReceberManual } from '../types'

interface ContaReceberManualRow {
  id: string
  cliente_id: string
  cliente_nome: string
  descricao: string
  valor: number
  vencimento: string
  status: string
  data_pagamento: string | null
  criado_em: string | null
}

function fromRow(r: ContaReceberManualRow): ContaReceberManual {
  return {
    id: r.id,
    clienteId: r.cliente_id,
    clienteNome: r.cliente_nome,
    descricao: r.descricao,
    valor: Number(r.valor),
    vencimento: r.vencimento,
    status: r.status as ContaReceberManual['status'],
    dataPagamento: r.data_pagamento ?? undefined,
    criadoEm: r.criado_em ?? undefined,
  }
}

function toRow(c: ContaReceberManual): ContaReceberManualRow {
  return {
    id: c.id,
    cliente_id: c.clienteId,
    cliente_nome: c.clienteNome,
    descricao: c.descricao,
    valor: c.valor,
    vencimento: c.vencimento,
    status: c.status,
    data_pagamento: c.dataPagamento ?? null,
    criado_em: c.criadoEm ?? null,
  }
}

const store = createSupabaseStore<ContaReceberManual, ContaReceberManualRow>({
  table: 'contas_receber_manuais',
  fromRow,
  toRow,
  orderBy: { column: 'vencimento', ascending: true },
})

export function useContasReceberManuais(): ContaReceberManual[] {
  return store.useAll()
}

export async function addContaReceberManual(conta: ContaReceberManual) {
  const { error, created } = await store.add({ ...conta, criadoEm: conta.criadoEm ?? new Date().toISOString() })
  if (error) console.error(error)
  return created
}

export async function editarContaReceberManual(id: string, changes: Partial<ContaReceberManual>) {
  const { error } = await store.update(id, changes)
  if (error) console.error(error)
}

export async function darBaixaContaReceberManual(id: string) {
  const { error } = await store.update(id, { status: 'pago', dataPagamento: new Date().toISOString().slice(0, 10) })
  if (error) console.error(error)
}

export async function cancelarContaReceberManual(id: string) {
  const { error } = await store.remove(id)
  if (error) console.error(error)
}
