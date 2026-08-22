import { useEffect, useSyncExternalStore } from 'react'
import { supabase } from '../lib/supabaseClient'

export interface CobrancaAsaas {
  id: string
  itemId: string
  clienteId: string
  tipo: 'boleto' | 'nf'
  asaasId: string | null
  status: string | null
  url: string | null
  erro: string | null
  criadoEm: string
}

interface CobrancaRow {
  id: string
  item_id: string
  cliente_id: string
  tipo: string
  asaas_id: string | null
  status: string | null
  url: string | null
  erro: string | null
  criado_em: string
}

function fromRow(r: CobrancaRow): CobrancaAsaas {
  return {
    id: r.id,
    itemId: r.item_id,
    clienteId: r.cliente_id,
    tipo: r.tipo as CobrancaAsaas['tipo'],
    asaasId: r.asaas_id,
    status: r.status,
    url: r.url,
    erro: r.erro,
    criadoEm: r.criado_em,
  }
}

let cache: CobrancaAsaas[] = []
let loaded = false
let loading: Promise<void> | null = null
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

async function load() {
  if (loaded) return
  if (loading) return loading
  loading = (async () => {
    const { data, error } = await supabase.from('cobrancas_asaas').select('*').order('criado_em', { ascending: false })
    if (error) {
      console.error('[supabase] erro ao carregar cobrancas_asaas:', error.message)
      return
    }
    cache = (data as CobrancaRow[]).map(fromRow)
    loaded = true
    emit()
  })()
  return loading
}

export function useCobrancasAsaas(): CobrancaAsaas[] {
  useEffect(() => {
    load()
  }, [])
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => cache,
  )
}

export async function refetchCobrancasAsaas() {
  loaded = false
  loading = null
  await load()
}

export function ultimaCobranca(itemId: string, tipo: 'boleto' | 'nf'): CobrancaAsaas | undefined {
  return cache.filter((c) => c.itemId === itemId && c.tipo === tipo).sort((a, b) => (a.criadoEm < b.criadoEm ? 1 : -1))[0]
}
