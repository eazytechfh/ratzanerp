import { useEffect, useSyncExternalStore } from 'react'
import { supabase } from '../lib/supabaseClient'

interface StoreConfig<T, Row> {
  table: string
  fromRow: (row: Row) => T
  toRow: (item: T) => Row
  orderBy?: { column: string; ascending?: boolean }
}

export function createSupabaseStore<T extends { id: string }, Row extends { id?: string }>(
  config: StoreConfig<T, Row>,
) {
  let cache: T[] = []
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
      let query = supabase.from(config.table).select('*')
      if (config.orderBy) query = query.order(config.orderBy.column, { ascending: config.orderBy.ascending ?? true })
      const { data, error } = await query
      if (error) {
        console.error(`[supabase] erro ao carregar ${config.table}:`, error.message)
        return
      }
      cache = (data as Row[]).map(config.fromRow)
      loaded = true
      emit()
    })()
    return loading
  }

  function useAll(): T[] {
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

  function getAll(): T[] {
    return cache
  }

  function getById(id: string): T | undefined {
    return cache.find((i) => i.id === id)
  }

  async function add(item: T): Promise<{ error?: string; created?: T }> {
    const row = config.toRow(item) as Record<string, unknown>
    delete row.id // deixa o banco gerar o uuid
    const { data, error } = await supabase.from(config.table).insert(row).select().single()
    if (error) return { error: error.message }
    const created = config.fromRow(data as Row)
    cache = [created, ...cache]
    emit()
    return { created }
  }

  async function update(id: string, changes: Partial<T>): Promise<{ error?: string }> {
    const current = cache.find((i) => i.id === id)
    if (!current) return { error: 'Registro não encontrado localmente' }
    const merged = { ...current, ...changes } as T
    const row = config.toRow(merged)
    const { error } = await supabase.from(config.table).update(row).eq('id', id)
    if (error) return { error: error.message }
    cache = cache.map((i) => (i.id === id ? merged : i))
    emit()
    return {}
  }

  async function remove(id: string): Promise<{ error?: string }> {
    const { error } = await supabase.from(config.table).delete().eq('id', id)
    if (error) return { error: error.message }
    cache = cache.filter((i) => i.id !== id)
    emit()
    return {}
  }

  async function reload() {
    loaded = false
    loading = null
    await load()
  }

  return { useAll, getAll, getById, add, update, remove, load, reload }
}
