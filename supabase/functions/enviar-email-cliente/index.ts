// Edge Function: envia e-mail para o cliente (com anexos, ex: OS e Certificado em PDF)
// usando a API transacional da Brevo. A chave da Brevo fica só aqui, nunca no navegador.
//
// Deploy:
//   supabase functions deploy enviar-email-cliente --no-verify-jwt
//   supabase secrets set BREVO_API_KEY=sua_chave_aqui
//   supabase secrets set BREVO_SENDER_EMAIL=contato@ratzan.com.br
//   supabase secrets set BREVO_SENDER_NOME="Ratzan Controle de Pragas"
//
// Chamada esperada do frontend (POST):
// {
//   "clienteEmail": "cliente@exemplo.com",
//   "clienteNome": "Fulano",
//   "assunto": "Ordem de Serviço e Certificado de Garantia — Ratzan",
//   "mensagemHtml": "<p>...</p>",
//   "anexos": [{ "nome": "OS.pdf", "base64": "..." }, { "nome": "Certificado.pdf", "base64": "..." }]
// }

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
    const { clienteEmail, clienteNome, assunto, mensagemHtml, anexos } = await req.json()

    if (!clienteEmail || !assunto || !mensagemHtml) {
      return json({ error: 'Preencha destinatário, assunto e mensagem.' }, 400)
    }

    const apiKey = Deno.env.get('BREVO_API_KEY')
    const senderEmail = Deno.env.get('BREVO_SENDER_EMAIL')
    const senderNome = Deno.env.get('BREVO_SENDER_NOME') ?? 'Ratzan Controle de Pragas'
    if (!apiKey || !senderEmail) {
      return json({ error: 'Integração de e-mail não configurada no servidor.' }, 500)
    }

    const body = {
      sender: { name: senderNome, email: senderEmail },
      to: [{ email: clienteEmail, name: clienteNome || clienteEmail }],
      bcc: [{ email: 'walbert.vilella@ratzan.com.br' }],
      subject: assunto,
      htmlContent: mensagemHtml,
      ...(Array.isArray(anexos) && anexos.length > 0
        ? { attachment: anexos.map((a: { nome: string; base64: string }) => ({ name: a.nome, content: a.base64 })) }
        : {}),
    }

    const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(body),
    })

    const data = await resp.json().catch(() => ({}))
    if (!resp.ok) {
      console.error('Erro Brevo:', data)
      return json({ error: data?.message ?? 'Falha ao enviar e-mail pela Brevo.' }, 502)
    }

    return json({ ok: true, messageId: data?.messageId })
  } catch (err) {
    console.error(err)
    return json({ error: err instanceof Error ? err.message : 'Erro inesperado' }, 500)
  }
})
