import type { Cliente } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

interface EmitirParams {
  itemId: string
  cliente: Cliente
  valor: number
  vencimento: string
  descricao: string
}

interface EmitirResultado {
  url?: string
  asaasId?: string
  status?: string
  error?: string
}

async function chamarProxy(action: 'emitir_boleto' | 'emitir_nf', params: EmitirParams): Promise<EmitirResultado> {
  try {
    const resp = await fetch(`${supabaseUrl}/functions/v1/asaas-proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        action,
        itemId: params.itemId,
        cliente: {
          id: params.cliente.id,
          nome: params.cliente.nome,
          documento: params.cliente.cnpj || params.cliente.cpf || '',
          email: params.cliente.email,
          telefone: params.cliente.telefone,
        },
        valor: params.valor,
        vencimento: params.vencimento,
        descricao: params.descricao,
      }),
    })
    const data = await resp.json()
    if (!resp.ok) return { error: data?.error ?? 'Falha na integração com o Asaas' }
    return data
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Não foi possível conectar à integração Asaas' }
  }
}

export function emitirBoleto(params: EmitirParams) {
  return chamarProxy('emitir_boleto', params)
}

export function emitirNotaFiscal(params: EmitirParams) {
  return chamarProxy('emitir_nf', params)
}
