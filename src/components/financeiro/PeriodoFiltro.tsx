import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  mes: Date | null
  onChange: (mes: Date | null) => void
}

const MONTH_LABELS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export default function PeriodoFiltro({ mes, onChange }: Props) {
  function navegar(delta: number) {
    const base = mes ?? new Date()
    onChange(new Date(base.getFullYear(), base.getMonth() + delta, 1))
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => onChange(null)}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
          mes === null ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        Todos os períodos
      </button>
      {mes !== null && (
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <button onClick={() => navegar(-1)} className="w-6 h-6 flex items-center justify-center rounded-md text-slate-500 hover:bg-white">
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs font-medium text-ink-900 px-1.5 min-w-[110px] text-center">
            {MONTH_LABELS[mes.getMonth()]} de {mes.getFullYear()}
          </span>
          <button onClick={() => navegar(1)} className="w-6 h-6 flex items-center justify-center rounded-md text-slate-500 hover:bg-white">
            <ChevronRight size={14} />
          </button>
        </div>
      )}
      {mes === null && (
        <button
          onClick={() => onChange(new Date())}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200"
        >
          Filtrar por mês
        </button>
      )}
    </div>
  )
}
