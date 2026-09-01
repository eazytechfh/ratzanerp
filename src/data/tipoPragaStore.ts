import { createSupabaseStore } from './createSupabaseStore'
import type { TipoPragaItem } from '../types'

interface TipoPragaRow {
  id: string
  nome: string
}

const store = createSupabaseStore<TipoPragaItem, TipoPragaRow>({
  table: 'tipos_praga',
  fromRow: (r) => ({ id: r.id, nome: r.nome }),
  toRow: (t) => ({ id: t.id, nome: t.nome }),
})

export function useTiposPraga(): TipoPragaItem[] {
  return store.useAll()
}

export async function addTipoPraga(tipo: TipoPragaItem) {
  const { error, created } = await store.add(tipo)
  if (error) console.error(error)
  return created
}

export async function updateTipoPraga(id: string, changes: Partial<TipoPragaItem>) {
  const { error } = await store.update(id, changes)
  if (error) console.error(error)
}

export async function removeTipoPraga(id: string) {
  const { error } = await store.remove(id)
  if (error) console.error(error)
}
