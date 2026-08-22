import { createSupabaseStore } from './createSupabaseStore'
import type { ContaPagar } from '../types'

interface ContaPagarRow {
  id: string
  descricao: string
  categoria: string | null
  valor: number
  vencimento: string
  status: string
  data_pagamento: string | null
}

function fromRow(r: ContaPagarRow): ContaPagar {
  return {
    id: r.id,
    descricao: r.descricao,
    categoria: r.categoria ?? '',
    valor: Number(r.valor),
    vencimento: r.vencimento,
    status: r.status as ContaPagar['status'],
    dataPagamento: r.data_pagamento ?? undefined,
  }
}

function toRow(c: ContaPagar): ContaPagarRow {
  return {
    id: c.id,
    descricao: c.descricao,
    categoria: c.categoria,
    valor: c.valor,
    vencimento: c.vencimento,
    status: c.status,
    data_pagamento: c.dataPagamento ?? null,
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
  const { error, created } = await store.add(conta)
  if (error) console.error(error)
  return created
}

export async function darBaixaContaPagar(id: string) {
  const { error } = await store.update(id, { status: 'pago', dataPagamento: new Date().toISOString().slice(0, 10) })
  if (error) console.error(error)
}

export async function cancelarContaPagar(id: string) {
  const { error } = await store.update(id, { status: 'cancelado' })
  if (error) console.error(error)
}
