import { createSupabaseStore } from './createSupabaseStore'
import type { Perfil } from '../types'

interface PerfilRow {
  id: string
  nome: string
  email: string
  role: Perfil['role']
  operador_id: string | null
}

const store = createSupabaseStore<Perfil, PerfilRow>({
  table: 'perfis',
  fromRow: (r) => ({ id: r.id, nome: r.nome, email: r.email, role: r.role, operadorId: r.operador_id ?? undefined }),
  toRow: (p) => ({ id: p.id, nome: p.nome, email: p.email, role: p.role, operador_id: p.operadorId ?? null }),
  orderBy: { column: 'criado_em', ascending: true },
})

export function useUsuarios(): Perfil[] {
  return store.useAll()
}

export function recarregarUsuarios() {
  // A criação em si é feita pela Edge Function (com service role); aqui só
  // recarregamos a lista pra puxar o registro novo do banco.
  return store.reload()
}
