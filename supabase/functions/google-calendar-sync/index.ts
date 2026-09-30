// Edge Function: sincroniza serviços agendados com o Google Calendar do usuário conectado.
// Recebe a lista de serviços do frontend (já autenticado como o próprio usuário),
// cria/atualiza/cancela eventos no Google Calendar e guarda o mapeamento servico -> evento.
//
// Deploy:
//   supabase functions deploy google-calendar-sync
//   (usa os mesmos secrets GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET já configurados no callback)
//
// Chamada esperada do frontend (POST, com o JWT do usuário logado):
// {
//   "servicos": [
//     { "id": "serv-123", "tipoServico": "Dedetização", "clienteNome": "...", "endereco": "...",
//       "dataAgendada": "2026-09-10", "horaAgendada": "09:00", "status": "agendado" | "cancelado" | ... }
//   ]
// }

import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

interface ServicoSync {
  id: string
  tipoServico: string
  clienteNome: string
  endereco?: string
  dataAgendada: string
  horaAgendada: string
  status: string
}

class ConexaoGoogleExpirada extends Error {}

async function obterAccessToken(
  supabase: ReturnType<typeof createClient>,
  perfilId: string,
): Promise<string | null> {
  const { data: token } = await supabase
    .from('google_calendar_tokens')
    .select('access_token, refresh_token, access_token_expira_em')
    .eq('perfil_id', perfilId)
    .maybeSingle()

  if (!token) return null

  const expiraEm = token.access_token_expira_em ? new Date(token.access_token_expira_em).getTime() : 0
  if (token.access_token && expiraEm > Date.now() + 60_000) {
    return token.access_token as string
  }

  const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')
  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET não configurados nos secrets da function.')
  }

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: token.refresh_token as string,
      grant_type: 'refresh_token',
    }),
  })
  const data = await resp.json().catch(() => ({}))
  if (!resp.ok) {
    console.error('Erro renovando access_token:', data)
    if (data?.error === 'invalid_grant') {
      // Refresh token revogado/expirado (ex.: app do Google em modo "Testing" expira em 7 dias).
      // Remove a conexão inválida para o app voltar a oferecer "Conectar Google Calendar".
      await supabase.from('google_calendar_tokens').delete().eq('perfil_id', perfilId)
      throw new ConexaoGoogleExpirada()
    }
    throw new Error(`Falha ao renovar acesso no Google: ${data?.error_description ?? data?.error ?? resp.status}`)
  }

  const novoExpiraEm = new Date(Date.now() + (data.expires_in ?? 3600) * 1000).toISOString()
  await supabase
    .from('google_calendar_tokens')
    .update({ access_token: data.access_token, access_token_expira_em: novoExpiraEm })
    .eq('perfil_id', perfilId)

  return data.access_token as string
}

function eventoBody(s: ServicoSync) {
  const inicio = `${s.dataAgendada}T${s.horaAgendada}:00`
  const inicioMs = new Date(inicio).getTime()
  if (!s.dataAgendada || !s.horaAgendada || Number.isNaN(inicioMs)) {
    throw new Error(`data/hora inválida (${s.dataAgendada} ${s.horaAgendada})`)
  }
  const fim = new Date(inicioMs + 60 * 60 * 1000).toISOString().slice(0, 19)
  return {
    summary: `${s.tipoServico} — ${s.clienteNome}`,
    location: s.endereco || undefined,
    description: `Serviço Ratzan ERP — status: ${s.status}`,
    start: { dateTime: inicio, timeZone: 'America/Sao_Paulo' },
    end: { dateTime: fim, timeZone: 'America/Sao_Paulo' },
  }
}

// Monta uma descrição curta do erro devolvido pelo Google (ex.: "403: Calendar API has not been used…").
async function erroDoGoogle(resp: Response): Promise<string> {
  const corpo = await resp.json().catch(() => null)
  const motivo = corpo?.error?.message
  return motivo ? `${resp.status}: ${motivo}` : String(resp.status)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) return json({ error: 'Não autenticado.' }, 401)

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: userData, error: userError } = await supabaseAuth.auth.getUser()
    if (userError || !userData.user) {
      return json({ error: 'Sessão inválida.' }, 401)
    }
    const perfilId = userData.user.id

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    let accessToken: string | null
    try {
      accessToken = await obterAccessToken(supabase, perfilId)
    } catch (e) {
      if (e instanceof ConexaoGoogleExpirada) {
        return json({ error: 'A conexão com o Google expirou ou foi revogada. Clique em "Conectar Google Calendar" para conectar de novo.' }, 400)
      }
      throw e
    }
    if (!accessToken) {
      return json({ error: 'Google Calendar não conectado.' }, 400)
    }

    const { data: tokenRow } = await supabase
      .from('google_calendar_tokens')
      .select('calendar_id')
      .eq('perfil_id', perfilId)
      .maybeSingle()
    const calendarId = tokenRow?.calendar_id ?? 'primary'

    const { servicos } = (await req.json()) as { servicos: ServicoSync[] }
    if (!Array.isArray(servicos)) {
      return json({ error: 'Lista de serviços inválida.' }, 400)
    }

    const gcalHeaders = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
    const base = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`

    let criados = 0
    let atualizados = 0
    let cancelados = 0
    const erros: string[] = []

    for (const s of servicos) {
      // Um serviço com problema não pode derrubar a sincronização dos demais.
      try {
        const { data: mapeado } = await supabase
          .from('google_calendar_eventos')
          .select('google_event_id')
          .eq('servico_id', s.id)
          .maybeSingle()

        if (s.status === 'cancelado') {
          if (mapeado?.google_event_id) {
            const resp = await fetch(`${base}/${mapeado.google_event_id}`, { method: 'DELETE', headers: gcalHeaders })
            if (resp.ok || resp.status === 404 || resp.status === 410) {
              await supabase.from('google_calendar_eventos').delete().eq('servico_id', s.id)
              cancelados++
            } else {
              erros.push(`${s.id}: falha ao cancelar evento (${await erroDoGoogle(resp)})`)
            }
          }
          continue
        }

        if (mapeado?.google_event_id) {
          const resp = await fetch(`${base}/${mapeado.google_event_id}`, {
            method: 'PATCH',
            headers: gcalHeaders,
            body: JSON.stringify(eventoBody(s)),
          })
          if (resp.ok) {
            atualizados++
          } else {
            erros.push(`${s.id}: falha ao atualizar evento (${await erroDoGoogle(resp)})`)
          }
        } else {
          const resp = await fetch(base, { method: 'POST', headers: gcalHeaders, body: JSON.stringify(eventoBody(s)) })
          if (resp.ok) {
            const data = await resp.json()
            if (data.id) {
              await supabase.from('google_calendar_eventos').upsert({
                servico_id: s.id,
                perfil_id: perfilId,
                google_event_id: data.id,
                atualizado_em: new Date().toISOString(),
              })
              criados++
            } else {
              erros.push(`${s.id}: o Google não retornou o id do evento`)
            }
          } else {
            erros.push(`${s.id}: falha ao criar evento (${await erroDoGoogle(resp)})`)
          }
        }
      } catch (e) {
        erros.push(`${s.id}: ${e instanceof Error ? e.message : 'erro inesperado'}`)
      }
    }

    return json({ criados, atualizados, cancelados, erros })
  } catch (e) {
    console.error(e)
    return json({ error: e instanceof Error ? `Erro na sincronização: ${e.message}` : 'Erro inesperado na sincronização.' }, 500)
  }
})
