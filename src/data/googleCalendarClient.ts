import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Servico } from '../types'

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const SCOPE = 'https://www.googleapis.com/auth/calendar.events'

function redirectUri() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
  return `${supabaseUrl}/functions/v1/google-calendar-callback`
}

export function conectarGoogleCalendar(perfilId: string) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
  if (!clientId) {
    alert('Integração com Google Calendar ainda não configurada (VITE_GOOGLE_CLIENT_ID ausente).')
    return
  }
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    state: perfilId,
  })
  window.location.href = `${GOOGLE_AUTH_URL}?${params.toString()}`
}

export function useGoogleCalendarConectado(perfilId?: string) {
  const [conectado, setConectado] = useState<boolean | null>(null)

  useEffect(() => {
    if (!perfilId) {
      setConectado(false)
      return
    }
    let cancelado = false
    supabase
      .from('google_calendar_tokens')
      .select('conectado_em')
      .eq('perfil_id', perfilId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelado) setConectado(!!data)
      })
    return () => {
      cancelado = true
    }
  }, [perfilId])

  return conectado
}

interface ResultadoSync {
  criados?: number
  atualizados?: number
  cancelados?: number
  erros?: string[]
  error?: string
}

export async function sincronizarGoogleCalendar(servicos: Servico[]): Promise<ResultadoSync> {
  const payload = servicos.map((s) => ({
    id: s.id,
    tipoServico: s.tipoServico,
    clienteNome: s.clienteNome,
    endereco: s.endereco,
    dataAgendada: s.dataAgendada,
    horaAgendada: s.horaAgendada,
    status: s.status,
  }))

  const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
    body: { servicos: payload },
  })
  if (error) return { error: error.message }
  return data as ResultadoSync
}
