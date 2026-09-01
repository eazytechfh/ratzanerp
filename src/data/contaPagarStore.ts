import { createSupabaseStore } from './createSupabaseStore'
import type { ContaPagar } from '../types'

interface ContaPagarRow {
  id: string
  descricao: string
  fornecedor_id: string | null
  categoria: string | null
  valor: number
  vencimento: string
  status: string
  data_pagamento: string | null
  criado_em: string | null
}

function fromRow(r: ContaPagarRow): ContaPagar {
  return {
    id: r.id,
    descricao: r.descricao,
    fornecedorId: r.fornecedor_id ?? undefined,
    categoria: r.categoria ?? '',
    valor: Number(r.valor),
    vencimento: r.vencimento,
    status: r.status as ContaPagar['status'],
    dataPagamento: r.data_pagamento ?? undefined,
    criadoEm: r.criado_em ?? undefined,
  }
}

function toRow(c: ContaPagar): ContaPagarRow {
  return {
    id: c.id,
    descricao: c.descricao,
    fornecedor_id: c.fornecedorId ?? null,
    categoria: c.categoria,
    valor: c.valor,
    vencimento: c.vencimento,
    status: c.status,
    data_pagamento: c.dataPagamento ?? null,
    criado_em: c.criadoEm ?? null,
  }
}

const store = createSupabaseStore<ContaPagar, ContaPagarRow>({
  table: 'contas_pagar',
  fromRow,
  toRow,
  orderBy: { column: 'vencimento', ascending: true },
})

export function useContasPagar(): ContaPagar[] {
  return store.useAll()
}

export async function addContaPagar(conta: ContaPagar) {
  const { error, created } = await store.add({ ...conta, criadoEm: conta.criadoEm ?? new Date().toISOString() })
  if (error) console.error(error)
  return created
}

export async function editarContaPagar(id: string, changes: Partial<ContaPagar>) {
  const { error } = await store.update(id, changes)
  if (error) console.error(error)
}

export async function darBaixaContaPagar(id: string) {
  const { error } = await store.update(id, { status: 'pago', dataPagamento: new Date().toISOString().slice(0, 10) })
  if (error) console.error(error)
}

export async function cancelarContaPagar(id: string) {
  const { error } = await store.remove(id)
  if (error) console.error(error)
}
