import { createSupabaseStore } from './createSupabaseStore'
import type { TipoServicoItem } from '../types'

interface TipoServicoRow {
  id: string
  nome: string
}

const store = createSupabaseStore<TipoServicoItem, TipoServicoRow>({
  table: 'tipos_servico',
  fromRow: (r) => ({ id: r.id, nome: r.nome }),
  toRow: (t) => ({ id: t.id, nome: t.nome }),
})

export function useTiposServico(): TipoServicoItem[] {
  return store.useAll()
}

export async function addTipoServico(tipo: TipoServicoItem) {
  const { error, created } = await store.add(tipo)
  if (error) console.error(error)
  return created
}

export async function updateTipoServico(id: string, changes: Partial<TipoServicoItem>) {
  const { error } = await store.update(id, changes)
  if (error) console.error(error)
}

export async function removeTipoServico(id: string) {
  const { error } = await store.remove(id)
  if (error) console.error(error)
}
