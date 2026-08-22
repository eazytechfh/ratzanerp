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

export async function criarUsuario(params: CriarUsuarioParams): Promise<{ id?: string; error?: string }> {
  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token ?? supabaseAnonKey

  try {
    const resp = await fetch(`${supabaseUrl}/functions/v1/criar-usuario`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    })
    const data = await resp.json()
    if (!resp.ok) return { error: data?.error ?? 'Falha ao criar usuário' }
    return data
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Não foi possível conectar ao servidor' }
  }
}
