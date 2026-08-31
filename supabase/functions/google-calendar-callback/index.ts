// Edge Function: callback do OAuth do Google Calendar.
// O Google redireciona para cá depois do usuário autorizar. Troca o "code" por
// tokens e salva no banco (service role). O client secret do Google fica só aqui.
//
// Deploy:
//   supabase functions deploy google-calendar-callback --no-verify-jwt
//   supabase secrets set GOOGLE_CLIENT_ID=...
//   supabase secrets set GOOGLE_CLIENT_SECRET=...
//   supabase secrets set GOOGLE_REDIRECT_URI=https://<projeto>.supabase.co/functions/v1/google-calendar-callback
//   supabase secrets set APP_URL=https://painel.ratzan.com.br
//
// Fluxo: GET /google-calendar-callback?code=...&state=<perfil_id>

import { createClient } from 'jsr:@supabase/supabase-js@2'

function appUrl() {
  return Deno.env.get('APP_URL') ?? 'https://painel.ratzan.com.br'
}

function redireccionarComErro(mensagem: string) {
  const url = `${appUrl()}/agenda?google=erro&msg=${encodeURIComponent(mensagem)}`
  return Response.redirect(url, 302)
}

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state') // perfil_id de quem iniciou a conexão
  const erroGoogle = url.searchParams.get('error')

  if (erroGoogle) return redireccionarComErro(`Autorização recusada: ${erroGoogle}`)
  if (!code || !state) return redireccionarComErro('Parâmetros ausentes no retorno do Google.')

  const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')
  const redirectUri = Deno.env.get('GOOGLE_REDIRECT_URI')
  if (!clientId || !clientSecret || !redirectUri) {
    return redireccionarComErro('Integração do Google Calendar não configurada no servidor.')
  }

  try {
    const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })
    const tokenData = await tokenResp.json()
    if (!tokenResp.ok) {
      console.error('Erro trocando code por token:', tokenData)
      return redireccionarComErro('Não foi possível concluir a conexão com o Google.')
    }

    const { access_token, refresh_token, expires_in } = tokenData
    if (!refresh_token) {
      // Acontece se o usuário já autorizou antes sem revogar — o Google só manda
      // refresh_token na primeira autorização (ou com prompt=consent forçado).
      return redireccionarComErro('O Google não retornou permissão permanente. Revogue o acesso em myaccount.google.com/permissions e tente conectar de novo.')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const expiraEm = new Date(Date.now() + (expires_in ?? 3600) * 1000).toISOString()

    const { error } = await supabase.from('google_calendar_tokens').upsert({
      perfil_id: state,
      refresh_token,
      access_token,
      access_token_expira_em: expiraEm,
      calendar_id: 'primary',
      conectado_em: new Date().toISOString(),
    })

    if (error) {
      console.error('Erro salvando token do Google:', error)
      return redireccionarComErro('Não foi possível salvar a conexão.')
    }

    return Response.redirect(`${appUrl()}/agenda?google=conectado`, 302)
  } catch (e) {
    console.error(e)
    return redireccionarComErro('Erro inesperado ao conectar com o Google.')
  }
})
