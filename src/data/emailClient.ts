import { supabase } from '../lib/supabaseClient'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

interface Anexo {
  nome: string
  base64: string
}

interface EnviarEmailParams {
  clienteEmail: string
  clienteNome: string
  assunto: string
  mensagemHtml: string
  anexos: Anexo[]
}

export async function enviarEmailCliente(params: EnviarEmailParams): Promise<{ error?: string }> {
  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token ?? supabaseAnonKey

  try {
    const resp = await fetch(`${supabaseUrl}/functions/v1/enviar-email-cliente`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    })
    const data = await resp.json()
    if (!resp.ok) return { error: data?.error ?? 'Falha ao enviar e-mail' }
    return {}
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Não foi possível conectar ao servidor' }
  }
}
