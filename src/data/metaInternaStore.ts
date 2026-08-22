import { createSupabaseStore } from './createSupabaseStore'

export interface MetaInterna {
  id: string
  nome: string
  percentual: number
}

interface MetaInternaRow {
  id: string
  nome: string
  percentual: number
}

const store = createSupabaseStore<MetaInterna, MetaInternaRow>({
  table: 'metas_internas',
  fromRow: (r) => ({ id: r.id, nome: r.nome, percentual: Number(r.percentual) }),
  toRow: (m) => ({ id: m.id, nome: m.nome, percentual: m.percentual }),
  orderBy: { column: 'criado_em', ascending: true },
})

export function useMetasInternas(): MetaInterna[] {
  return store.useAll()
}

export async function addMetaInterna(meta: MetaInterna) {
  const { error, created } = await store.add(meta)
  if (error) console.error(error)
  return created
}

export async function removeMetaInterna(id: string) {
  const { error } = await store.remove(id)
  if (error) console.error(error)
}
