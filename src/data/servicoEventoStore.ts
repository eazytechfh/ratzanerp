import { createSupabaseStore } from './createSupabaseStore'
import type { EventoServico, TipoEventoServico } from '../types'

interface EventoRow {
  id: string
  servico_id: string
  tipo: string
  detalhe: string | null
  usuario: string | null
  criado_em: string
}

function fromRow(r: EventoRow): EventoServico {
  return {
    id: r.id,
    servicoId: r.servico_id,
    tipo: r.tipo as TipoEventoServico,
    detalhe: r.detalhe ?? '',
    usuario: r.usuario ?? '',
    criadoEm: r.criado_em,
  }
}

function toRow(e: EventoServico): EventoRow {
  return {
    id: e.id,
    servico_id: e.servicoId,
    tipo: e.tipo,
    detalhe: e.detalhe,
    usuario: e.usuario,
    criado_em: e.criadoEm,
  }
}

const store = createSupabaseStore<EventoServico, EventoRow>({
  table: 'servico_eventos',
  fromRow,
  toRow,
  orderBy: { column: 'criado_em', ascending: true },
})

export function useEventosServico(): EventoServico[] {
  return store.useAll()
}

/** Registra um evento no histórico do serviço. Nunca lança — se falhar (ex.: tabela ainda não
 *  criada), o chamador segue o fluxo normal; devolve null nesse caso. */
export async function registrarEventoServico(
  servicoId: string,
  tipo: TipoEventoServico,
  detalhe: string,
  usuario: string,
): Promise<EventoServico | null> {
  const { error, created } = await store.add({
    id: '',
    servicoId,
    tipo,
    detalhe,
    usuario,
    criadoEm: new Date().toISOString(),
  })
  if (error) {
    console.error('[servico_eventos] não foi possível registrar o evento:', error)
    return null
  }
  return created ?? null
}
