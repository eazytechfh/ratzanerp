// Edge Function: edita um usuário (perfil) existente.
// Administrador pode editar qualquer usuário (nome, papel, vínculo com operador).
// Gerente Geral só pode editar usuários com papel "operador" (nome e vínculo,
// sem trocar o papel).
//
// Deploy:
//   supabase functions deploy editar-usuario --no-verify-jwt
//
// Chamada esperada do frontend (POST), com o token do usuário logado:
// {
//   "id": "uuid-do-usuario-editado",
//   "nome": "Novo nome",
//   "role": "operador" | "gerente_operacional" | "gerente_geral" | "administrador",
//   "operadorId": "uuid-do-operador" (opcional)
// }

import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const VALID_ROLES = ['operador', 'gerente_operacional', 'gerente_geral', 'administrador']

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { id, nome, role, operadorId } = await req.json()
    if (!id || !nome || !role) return json({ error: 'Preencha nome e papel.' }, 400)
    if (!VALID_ROLES.includes(role)) return json({ error: 'Papel inválido.' }, 400)

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
    const callerRole = callerPerfil?.role

    const { data: alvo } = await admin.from('perfis').select('role').eq('id', id).maybeSingle()
    if (!alvo) return json({ error: 'Usuário não encontrado.' }, 404)

    if (callerRole === 'administrador') {
      // pode tudo
    } else if (callerRole === 'gerente_geral') {
      if (alvo.role !== 'operador') {
        return json({ error: 'Gerente Geral só pode editar usuários com papel Operador.' }, 403)
      }
      if (role !== 'operador') {
        return json({ error: 'Gerente Geral não pode alterar o papel do usuário.' }, 403)
      }
    } else {
      return json({ error: 'Sem permissão para editar usuários.' }, 403)
    }

    const { error } = await admin
      .from('perfis')
      .update({ nome, role, operador_id: operadorId || null })
      .eq('id', id)

    if (error) return json({ error: error.message }, 400)
    return json({ ok: true })
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Erro inesperado' }, 500)
  }
})
