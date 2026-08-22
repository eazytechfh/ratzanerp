import { useEffect, useSyncExternalStore } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { MetaMensal } from '../types'

let cache: MetaMensal[] = []
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
    const { data, error } = await supabase.from('metas').select('*')
    if (error) {
      console.error('[supabase] erro ao carregar metas:', error.message)
      return
    }
    cache = (data as { ano: number; mes: number; valor: number }[]).map((r) => ({ ano: r.ano, mes: r.mes, valor: Number(r.valor) }))
    loaded = true
    emit()
  })()
  return loading
}

export function useMetas(): MetaMensal[] {
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

export function getMeta(ano: number, mes: number): number {
  return cache.find((m) => m.ano === ano && m.mes === mes)?.valor ?? 0
}

export async function setMeta(ano: number, mes: number, valor: number) {
  const { error } = await supabase.from('metas').upsert({ ano, mes, valor })
  if (error) {
    console.error(error)
    return
  }
  const existente = cache.find((m) => m.ano === ano && m.mes === mes)
  cache = existente
    ? cache.map((m) => (m.ano === ano && m.mes === mes ? { ...m, valor } : m))
    : [...cache, { ano, mes, valor }]
  emit()
}
