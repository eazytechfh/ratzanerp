import { createSupabaseStore } from './createSupabaseStore'
import type { CategoriaCliente } from '../types'

interface CategoriaRow {
  id: string
  nome: string
  cor: string
}

const store = createSupabaseStore<CategoriaCliente, CategoriaRow>({
  table: 'categorias',
  fromRow: (r) => ({ id: r.id, nome: r.nome, cor: r.cor }),
  toRow: (c) => ({ id: c.id, nome: c.nome, cor: c.cor }),
})

export function useCategorias(): CategoriaCliente[] {
  return store.useAll()
}

export function getCategoriaById(id?: string): CategoriaCliente | undefined {
  if (!id) return undefined
  return store.getById(id)
}

export async function addCategoria(categoria: CategoriaCliente) {
  const { error, created } = await store.add(categoria)
  if (error) console.error(error)
  return created
}

export async function updateCategoria(id: string, changes: Partial<CategoriaCliente>) {
  const { error } = await store.update(id, changes)
  if (error) console.error(error)
}

export async function removeCategoria(id: string) {
  const { error } = await store.remove(id)
  if (error) console.error(error)
}
