import React, { useState } from 'react'
import { Target } from 'lucide-react'
import { useMetas, setMeta } from '../../data/metaStore'

const MONTH_LABELS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export default function MetaTab() {
  const metas = useMetas()
  const anoAtual = new Date().getFullYear()
  const [ano, setAno] = useState(anoAtual)
  const [valores, setValores] = useState<Record<number, string>>({})

  function valorAtual(mes: number) {
    if (valores[mes] !== undefined) return valores[mes]
    return String(metas.find((m) => m.ano === ano && m.mes === mes)?.valor ?? 0)
  }

  function handleSalvar(mes: number) {
    const valor = Number(valores[mes])
    if (Number.isNaN(valor)) return
    setMeta(ano, mes, valor)
  }

  const totalAno = Array.from({ length: 12 }, (_, i) => metas.find((m) => m.ano === ano && m.mes === i + 1)?.valor ?? 0)
    .reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target size={18} className="text-brand-600" />
            <h2 className="font-semibold text-ink-900">Meta por mês — {ano}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setAno((a) => a - 1)} className="px-2.5 py-1 rounded-md border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">‹</button>
            <span className="text-sm font-medium text-ink-900 w-12 text-center">{ano}</span>
            <button onClick={() => setAno((a) => a + 1)} className="px-2.5 py-1 rounded-md border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">›</button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {MONTH_LABELS.map((label, i) => {
            const mes = i + 1
            return (
              <div key={mes} className="border border-slate-200 rounded-lg p-3">
                <p className="text-xs font-medium text-slate-500 mb-1.5">{label}</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">R$</span>
                  <input
                    type="number"
                    min="0"
                    value={valorAtual(mes)}
                    onChange={(e) => setValores((v) => ({ ...v, [mes]: e.target.value }))}
                    onBlur={() => handleSalvar(mes)}
                    className="flex-1 px-2 py-1.5 rounded-md border border-slate-300 text-sm outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 text-sm text-slate-600">
          Meta total do ano: <span className="font-bold text-ink-900">{totalAno.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
        </div>
      </div>
    </div>
  )
}
