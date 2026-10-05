import type { EventoServico, Servico } from '../types'

// Quanto tempo depois do horário agendado o serviço passa a contar como atrasado.
export const TOLERANCIA_ATRASO_MIN = 15

function agendadoEm(s: Servico): Date {
  return new Date(`${s.dataAgendada}T${s.horaAgendada}:00`)
}

/** Momento em que o serviço foi iniciado de fato (ou null se ainda não foi).
 *  Usa o registro do histórico (tem a data certa); em serviços antigos, sem esse registro,
 *  cai para a hora de início guardada no próprio serviço. */
export function inicioRealDoServico(s: Servico, eventos: EventoServico[]): Date | null {
  // Reagendado volta para "agendado": o início anterior não vale mais.
  if (s.status === 'agendado' || s.status === 'cancelado') return null
  const doHistorico = eventos
    .filter((e) => e.servicoId === s.id && e.tipo === 'inicio')
    .sort((a, b) => (a.criadoEm < b.criadoEm ? 1 : -1))[0]
  if (doHistorico) return new Date(doHistorico.criadoEm)
  if (s.horaInicioReal) return new Date(`${s.dataAgendada}T${s.horaInicioReal}:00`)
  return null
}

export interface SituacaoAtraso {
  /** Passou da tolerância e o serviço ainda não foi iniciado. */
  atrasadoSemIniciar: boolean
  /** Minutos de atraso (sem iniciar: até agora; iniciado: com quanto atraso começou). Pode ser ≤ 0. */
  minutos: number
  /** Foi iniciado depois da tolerância. */
  iniciouComAtraso: boolean
}

export function situacaoDeAtraso(s: Servico, eventos: EventoServico[], agora: Date): SituacaoAtraso {
  const agendado = agendadoEm(s).getTime()
  const inicio = inicioRealDoServico(s, eventos)

  if (inicio) {
    const minutos = Math.floor((inicio.getTime() - agendado) / 60000)
    return { atrasadoSemIniciar: false, minutos, iniciouComAtraso: minutos > TOLERANCIA_ATRASO_MIN }
  }

  const minutos = Math.floor((agora.getTime() - agendado) / 60000)
  return {
    atrasadoSemIniciar: s.status === 'agendado' && minutos > TOLERANCIA_ATRASO_MIN,
    minutos,
    iniciouComAtraso: false,
  }
}

export function fmtHora(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function fmtDuracao(minutos: number): string {
  if (minutos < 60) return `${minutos}min`
  const h = Math.floor(minutos / 60)
  const m = minutos % 60
  return m ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
}
