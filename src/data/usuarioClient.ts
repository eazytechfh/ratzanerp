import { supabase } from '../lib/supabaseClient'
import type { UserRole } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

interface CriarUsuarioParams {
  email: string
  senha: string
  nome: string
  role: UserRole
  operadorId?: string
}

async function chamarFunction<T>(nome: string, body: unknown): Promise<T & { error?: string }> {
  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token ?? supabaseAnonKey

  try {
    const resp = await fetch(`${supabaseUrl}/functions/v1/${nome}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })
    const data = await resp.json()
    if (!resp.ok) return { error: data?.error ?? 'Falha na operação' } as T & { error?: string }
    return data
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Não foi possível conectar ao servidor' } as T & { error?: string }
  }
}

export async function criarUsuario(params: CriarUsuarioParams): Promise<{ id?: string; error?: string }> {
  return chamarFunction('criar-usuario', params)
}

interface EditarUsuarioParams {
  id: string
  nome: string
  role: UserRole
  operadorId?: string
}

export async function editarUsuario(params: EditarUsuarioParams): Promise<{ ok?: boolean; error?: string }> {
  return chamarFunction('editar-usuario', params)
}

export async function excluirUsuario(id: string): Promise<{ ok?: boolean; error?: string }> {
  return chamarFunction('excluir-usuario', { id })
}
