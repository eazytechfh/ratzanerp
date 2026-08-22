import React from 'react'
import type { StatusCliente, StatusServico } from '../types'

const CLIENTE_STYLES: Record<StatusCliente, string> = {
  ativo: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  inativo: 'bg-slate-100 text-slate-500 border-slate-200',
  vencendo: 'bg-amber-50 text-amber-700 border-amber-200',
  vencido: 'bg-rose-50 text-rose-700 border-rose-200',
}

const CLIENTE_LABELS: Record<StatusCliente, string> = {
  ativo: 'Ativo',
  inativo: 'Inativo',
  vencendo: 'Vencendo',
  vencido: 'Vencido',
}

const SERVICO_STYLES: Record<StatusServico, string> = {
  agendado: 'bg-sky-50 text-sky-700 border-sky-200',
  em_andamento: 'bg-amber-50 text-amber-700 border-amber-200',
  concluido: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelado: 'bg-rose-50 text-rose-700 border-rose-200',
}

const SERVICO_LABELS: Record<StatusServico, string> = {
  agendado: 'Agendado',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

export function ClienteStatusBadge({ status }: { status: StatusCliente }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${CLIENTE_STYLES[status]}`}>
      {CLIENTE_LABELS[status]}
    </span>
  )
}

export function ServicoStatusBadge({ status }: { status: StatusServico }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${SERVICO_STYLES[status]}`}>
      {SERVICO_LABELS[status]}
    </span>
  )
}
