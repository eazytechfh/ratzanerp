import { createSupabaseStore } from './createSupabaseStore'
import type { Operador } from '../types'

interface OperadorRow {
  id: string
  nome: string
  telefone: string | null
  endereco: string | null
  cargo: string | null
}

const store = createSupabaseStore<Operador, OperadorRow>({
  table: 'operadores',
  fromRow: (r) => ({ id: r.id, nome: r.nome, telefone: r.telefone ?? undefined, endereco: r.endereco ?? undefined, cargo: r.cargo ?? undefined }),
  toRow: (o) => ({ id: o.id, nome: o.nome, telefone: o.telefone ?? null, endereco: o.endereco ?? null, cargo: o.cargo ?? null }),
})

export function useOperadores(): Operador[] {
  return store.useAll()
}

export async function addOperador(operador: Operador) {
  const { error, created } = await store.add(operador)
  if (error) console.error(error)
  return created
}

export async function updateOperador(id: string, changes: Partial<Operador>) {
  const { error } = await store.update(id, changes)
  if (error) console.error(error)
}

export async function removeOperador(id: string) {
  const { error } = await store.remove(id)
  if (error) console.error(error)
}
