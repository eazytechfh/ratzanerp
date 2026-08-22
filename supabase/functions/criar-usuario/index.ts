// Edge Function: cria login (Supabase Auth) + perfil de um usuário do sistema.
// Só administradores podem chamar isso — EXCETO quando ainda não existe nenhum
// usuário no sistema (modo bootstrap, pra criar o primeiro administrador).
//
// Deploy:
//   supabase functions deploy criar-usuario --no-verify-jwt
//
// Chamada esperada do frontend (POST), com o token do usuário logado (se houver)
// no header Authorization:
// {
//   "email": "operador@ratzan.com.br",
//   "senha": "senha123",
//   "nome": "Fulano",
//   "role": "operador" | "gerente_operacional" | "gerente_geral" | "administrador",
//   "operadorId": "uuid-do-operador-na-tabela-operadores" (opcional, só faz sentido pra role=operador)
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
    const { email, senha, nome, role, operadorId } = await req.json()

    if (!email || !senha || !nome || !role) {
      return json({ error: 'Preencha e-mail, senha, nome e papel.' }, 400)
    }
    if (!VALID_ROLES.includes(role)) {
      return json({ error: 'Papel inválido.' }, 400)
    }
    if (senha.length < 6) {
      return json({ error: 'A senha precisa ter pelo menos 6 caracteres.' }, 400)
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { count } = await admin.from('perfis').select('*', { count: 'exact', head: true })
    const modoBootstrap = (count ?? 0) === 0

    if (!modoBootstrap) {
      const authHeader = req.headers.get('Authorization') ?? ''
      const token = authHeader.replace('Bearer ', '')
      const { data: userData } = await admin.auth.getUser(token)
      const callerId = userData?.user?.id
      if (!callerId) return json({ error: 'Não autenticado.' }, 401)

      const { data: callerPerfil } = await admin.from('perfis').select('role').eq('id', callerId).maybeSingle()
      if (callerPerfil?.role !== 'administrador') {
        return json({ error: 'Apenas administradores podem criar usuários.' }, 403)
      }
    } else if (role !== 'administrador') {
      return json({ error: 'O primeiro usuário do sistema precisa ser administrador.' }, 400)
    }

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
    })
    if (createErr || !created?.user) {
      return json({ error: createErr?.message ?? 'Falha ao criar usuário.' }, 400)
    }

    const { error: perfilErr } = await admin.from('perfis').insert({
      id: created.user.id,
      nome,
      email,
      role,
      operador_id: operadorId || null,
    })
    if (perfilErr) {
      await admin.auth.admin.deleteUser(created.user.id)
      return json({ error: perfilErr.message }, 400)
    }

    return json({ id: created.user.id })
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Erro inesperado' }, 500)
  }
})
