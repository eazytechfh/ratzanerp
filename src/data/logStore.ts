import { createSupabaseStore } from './createSupabaseStore'
import type { LogEntry } from '../types'

interface LogRow {
  id: string
  usuario: string | null
  acao: string | null
  detalhes: string | null
  data: string
}

function fromRow(r: LogRow): LogEntry {
  return { id: r.id, usuario: r.usuario ?? '', acao: r.acao ?? '', detalhes: r.detalhes ?? '', data: r.data }
}

function toRow(l: LogEntry): LogRow {
  return { id: l.id, usuario: l.usuario, acao: l.acao, detalhes: l.detalhes, data: l.data }
}

const store = createSupabaseStore<LogEntry, LogRow>({
  table: 'logs',
  fromRow,
  toRow,
  orderBy: { column: 'data', ascending: false },
})

export function useLogs(): LogEntry[] {
  return store.useAll()
}

export function registrarLog(usuario: string, acao: string, detalhes: string) {
  const entry: LogEntry = {
    id: `log-${Date.now()}`,
    usuario,
    acao,
    detalhes,
    data: new Date().toISOString(),
  }
  store.add(entry).then(({ error }) => {
    if (error) console.error(error)
  })
}
