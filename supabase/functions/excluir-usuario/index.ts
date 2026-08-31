// Edge Function: exclui um usuário (login + perfil). Só administrador pode chamar.
// Exclui o usuário do Supabase Auth — o perfil cai junto por causa do
// "on delete cascade" da migration 005.
//
// Deploy:
//   supabase functions deploy excluir-usuario --no-verify-jwt
//
// Chamada esperada do frontend (POST), com o token do usuário logado:
// { "id": "uuid-do-usuario-a-excluir" }

import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { id } = await req.json()
    if (!id) return json({ error: 'Usuário não informado.' }, 400)

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.replace('Bearer ', '')
    const { data: userData } = await admin.auth.getUser(token)
    const callerId = userData?.user?.id
    if (!callerId) return json({ error: 'Não autenticado.' }, 401)

    const { data: callerPerfil } = await admin.from('perfis').select('role').eq('id', callerId).maybeSingle()
    if (callerPerfil?.role !== 'administrador') {
      return json({ error: 'Apenas administradores podem excluir usuários.' }, 403)
    }

    if (id === callerId) {
      return json({ error: 'Você não pode excluir o seu próprio usuário.' }, 400)
    }

    const { error } = await admin.auth.admin.deleteUser(id)
    if (error) return json({ error: error.message }, 400)

    return json({ ok: true })
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Erro inesperado' }, 500)
  }
})
