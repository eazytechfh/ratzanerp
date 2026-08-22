// Edge Function: proxy seguro para a API do Asaas.
// O token do Asaas fica só aqui (variável de ambiente ASAAS_API_KEY), nunca no navegador.
//
// Deploy:
//   supabase functions deploy asaas-proxy --no-verify-jwt
//   supabase secrets set ASAAS_API_KEY=sua_chave_aqui
//   supabase secrets set ASAAS_AMBIENTE=sandbox   (ou "producao")
//
// Chamada esperada do frontend (POST):
// {
//   "action": "emitir_boleto" | "emitir_nf",
//   "itemId": "sv-xxxx" | "rec-xxxx",
//   "cliente": { "id": "uuid", "nome": "...", "documento": "...", "email": "...", "telefone": "..." },
//   "valor": 500,
//   "vencimento": "2026-09-05",
//   "descricao": "Dedetização Geral"
// }

import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function asaasBaseUrl() {
  const ambiente = Deno.env.get('ASAAS_AMBIENTE') ?? 'sandbox'
  return ambiente === 'producao' ? 'https://api.asaas.com/v3' : 'https://sandbox.asaas.com/api/v3'
}

function asaasHeaders() {
  const apiKey = Deno.env.get('ASAAS_API_KEY')
  if (!apiKey) throw new Error('ASAAS_API_KEY não configurada nos secrets da function.')
  return {
    'Content-Type': 'application/json',
    access_token: apiKey,
  }
}

function onlyDigits(v: string) {
  return (v ?? '').replace(/\D/g, '')
}

// A API do Asaas às vezes responde 200/202 com corpo vazio (ex: emissão de NF assíncrona).
// Faz o parse com segurança em vez de deixar `.json()` estourar em "Unexpected end of JSON input".
// deno-lint-ignore no-explicit-any
async function parseJsonSafe(resp: Response): Promise<any> {
  const texto = await resp.text()
  if (!texto) return {}
  try {
    return JSON.parse(texto)
  } catch {
    return { _raw: texto }
  }
}

async function getOrCreateAsaasCustomer(
  supabase: ReturnType<typeof createClient>,
  cliente: { id: string; nome: string; documento?: string; email?: string; telefone?: string },
) {
  const { data: existente } = await supabase
    .from('asaas_clientes')
    .select('asaas_customer_id')
    .eq('cliente_id', cliente.id)
    .maybeSingle()

  if (existente?.asaas_customer_id) return existente.asaas_customer_id as string

  const resp = await fetch(`${asaasBaseUrl()}/customers`, {
    method: 'POST',
    headers: asaasHeaders(),
    body: JSON.stringify({
      name: cliente.nome,
      cpfCnpj: onlyDigits(cliente.documento ?? ''),
      email: cliente.email || undefined,
      phone: onlyDigits(cliente.telefone ?? '') || undefined,
    }),
  })
  const data = await parseJsonSafe(resp)
  if (!resp.ok) throw new Error(data?.errors?.[0]?.description ?? 'Falha ao criar cliente no Asaas')

  await supabase.from('asaas_clientes').insert({ cliente_id: cliente.id, asaas_customer_id: data.id })
  return data.id as string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { action, itemId, cliente, valor, vencimento, descricao } = body

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    if (action === 'emitir_boleto') {
      let asaasCustomerId: string
      try {
        asaasCustomerId = await getOrCreateAsaasCustomer(supabase, cliente)
      } catch (err) {
        const erro = err instanceof Error ? err.message : 'Falha ao cadastrar cliente no Asaas'
        await supabase.from('cobrancas_asaas').insert({ item_id: itemId, cliente_id: cliente.id, tipo: 'boleto', status: 'erro', erro })
        return new Response(JSON.stringify({ error: erro }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      const resp = await fetch(`${asaasBaseUrl()}/payments`, {
        method: 'POST',
        headers: asaasHeaders(),
        body: JSON.stringify({
          customer: asaasCustomerId,
          billingType: 'BOLETO',
          value: valor,
          dueDate: vencimento,
          description: descricao,
        }),
      })
      const data = await parseJsonSafe(resp)
      if (!resp.ok) {
        const erro = data?.errors?.[0]?.description ?? 'Falha ao emitir boleto'
        await supabase.from('cobrancas_asaas').insert({ item_id: itemId, cliente_id: cliente.id, tipo: 'boleto', status: 'erro', erro })
        return new Response(JSON.stringify({ error: erro }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      await supabase.from('cobrancas_asaas').insert({
        item_id: itemId,
        cliente_id: cliente.id,
        tipo: 'boleto',
        asaas_id: data.id,
        status: data.status,
        url: data.bankSlipUrl ?? data.invoiceUrl,
        valor,
      })

      return new Response(
        JSON.stringify({ url: data.bankSlipUrl ?? data.invoiceUrl, asaasId: data.id, status: data.status }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    if (action === 'emitir_nf') {
      let asaasCustomerId: string
      try {
        asaasCustomerId = await getOrCreateAsaasCustomer(supabase, cliente)
      } catch (err) {
        const erro = err instanceof Error ? err.message : 'Falha ao cadastrar cliente no Asaas'
        await supabase.from('cobrancas_asaas').insert({ item_id: itemId, cliente_id: cliente.id, tipo: 'nf', status: 'erro', erro })
        return new Response(JSON.stringify({ error: erro }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Cria a cobrança (caso ainda não exista) e solicita a emissão da nota fiscal.
      // Emissão de NF-e no Asaas exige configuração fiscal prévia no painel deles
      // (município, serviço, série etc.) — se não estiver configurado, a API retorna erro
      // explicando o que falta, que é repassado para a tela.
      const paymentResp = await fetch(`${asaasBaseUrl()}/payments`, {
        method: 'POST',
        headers: asaasHeaders(),
        body: JSON.stringify({
          customer: asaasCustomerId,
          billingType: 'UNDEFINED',
          value: valor,
          dueDate: vencimento,
          description: descricao,
        }),
      })
      const payment = await parseJsonSafe(paymentResp)
      if (!paymentResp.ok) {
        const erro = payment?.errors?.[0]?.description ?? 'Falha ao criar cobrança para a nota fiscal'
        await supabase.from('cobrancas_asaas').insert({ item_id: itemId, cliente_id: cliente.id, tipo: 'nf', status: 'erro', erro })
        return new Response(JSON.stringify({ error: erro }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      if (!payment?.id) {
        const erro = 'A cobrança foi criada, mas o Asaas não retornou um identificador válido.'
        await supabase.from('cobrancas_asaas').insert({ item_id: itemId, cliente_id: cliente.id, tipo: 'nf', status: 'erro', erro })
        return new Response(JSON.stringify({ error: erro }), { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      const nfResp = await fetch(`${asaasBaseUrl()}/invoices`, {
        method: 'POST',
        headers: asaasHeaders(),
        body: JSON.stringify({
          payment: payment.id,
          customer: asaasCustomerId,
          serviceDescription: descricao,
          effectiveDate: vencimento,
          value: valor,
          deductions: 0,
        }),
      })
      const nf = await parseJsonSafe(nfResp)
      if (!nfResp.ok) {
        const motivo = nf?.errors?.[0]?.description
        const erro = motivo
          ? `${motivo} — configure isso em Asaas > Configurações > Notas Fiscais.`
          : 'Falha ao emitir nota fiscal — verifique se a configuração fiscal (município, serviço, série da NF) está completa em Asaas > Configurações > Notas Fiscais.'
        await supabase.from('cobrancas_asaas').insert({ item_id: itemId, cliente_id: cliente.id, tipo: 'nf', status: 'erro', erro })
        return new Response(JSON.stringify({ error: erro }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // A emissão pode ser assíncrona: o Asaas confirma o pedido (às vezes com corpo vazio)
      // e processa a nota em segundo plano, disponibilizando o PDF depois via webhook/consulta.
      const statusFinal = nf?.status ?? 'PROCESSANDO'
      const urlFinal = nf?.pdfUrl ?? null

      await supabase.from('cobrancas_asaas').insert({
        item_id: itemId,
        cliente_id: cliente.id,
        tipo: 'nf',
        asaas_id: nf?.id ?? payment.id,
        status: statusFinal,
        url: urlFinal,
        valor,
        erro: urlFinal ? null : 'Nota solicitada; o Asaas ainda está processando a emissão (consulte novamente em instantes).',
      })

      return new Response(
        JSON.stringify({ url: urlFinal, asaasId: nf?.id ?? payment.id, status: statusFinal }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(JSON.stringify({ error: 'Ação desconhecida' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Erro inesperado' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
