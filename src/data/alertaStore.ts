import { createSupabaseStore } from './createSupabaseStore'
import type { Alerta } from '../types'

interface AlertaRow {
  id: string
  cliente_id: string
  cliente_nome: string | null
  texto: string
  prioridade: string
  concluido: boolean
  criado_por: string | null
  criado_em: string
  data_vencimento: string
  recorrente: boolean
  frequencia: string | null
}

function fromRow(r: AlertaRow): Alerta {
  return {
    id: r.id,
    clienteId: r.cliente_id,
    clienteNome: r.cliente_nome ?? '',
    texto: r.texto,
    prioridade: r.prioridade as Alerta['prioridade'],
    concluido: r.concluido,
    criadoPor: r.criado_por ?? '',
    criadoEm: r.criado_em,
    dataVencimento: r.data_vencimento,
    recorrente: r.recorrente,
    frequencia: (r.frequencia ?? undefined) as Alerta['frequencia'],
  }
}

function toRow(a: Alerta): AlertaRow {
  return {
    id: a.id,
    cliente_id: a.clienteId,
    cliente_nome: a.clienteNome,
    texto: a.texto,
    prioridade: a.prioridade,
    concluido: a.concluido,
    criado_por: a.criadoPor,
    criado_em: a.criadoEm,
    data_vencimento: a.dataVencimento,
    recorrente: a.recorrente,
    frequencia: a.frequencia ?? null,
  }
}

const store = createSupabaseStore<Alerta, AlertaRow>({
  table: 'alertas',
  fromRow,
  toRow,
  orderBy: { column: 'data_vencimento', ascending: true },
})

export function useAlertas(): Alerta[] {
  return store.useAll()
}

export async function addAlerta(alerta: Alerta) {
  const { error, created } = await store.add(alerta)
  if (error) console.error(error)
  return created
}

function proximaData(dataVencimento: string, frequencia?: Alerta['frequencia']) {
  const d = new Date(dataVencimento + 'T00:00:00')
  if (frequencia === 'diaria') d.setDate(d.getDate() + 1)
  else if (frequencia === 'semanal') d.setDate(d.getDate() + 7)
  else if (frequencia === 'semestral') d.setMonth(d.getMonth() + 6)
  else d.setMonth(d.getMonth() + 1) // mensal (padrão)
  return d.toISOString().slice(0, 10)
}

export async function concluirAlerta(id: string) {
  const atual = store.getById(id)
  const { error } = await store.update(id, { concluido: true })
  if (error) {
    console.error(error)
    return
  }

  if (atual?.recorrente) {
    const proximo: Alerta = {
      ...atual,
      id: `alerta-${Date.now()}`,
      concluido: false,
      dataVencimento: proximaData(atual.dataVencimento, atual.frequencia),
      criadoEm: new Date().toISOString(),
    }
    const { error: addError } = await store.add(proximo)
    if (addError) console.error(addError)
  }
}
