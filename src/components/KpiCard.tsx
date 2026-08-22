import React from 'react'
import type { LucideIcon } from 'lucide-react'

interface KpiCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  tone?: 'brand' | 'green' | 'amber' | 'red'
  hint?: string
}

const TONES: Record<string, { bg: string; text: string }> = {
  brand: { bg: 'bg-brand-50', text: 'text-brand-600' },
  green: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
  red: { bg: 'bg-rose-50', text: 'text-rose-600' },
}

export default function KpiCard({ label, value, icon: Icon, tone = 'brand', hint }: KpiCardProps) {
  const t = TONES[tone]
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="text-3xl font-bold text-ink-900 mt-1.5">{value}</p>
        {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
      </div>
      <div className={`w-11 h-11 rounded-lg ${t.bg} ${t.text} flex items-center justify-center shrink-0`}>
        <Icon size={22} />
      </div>
    </div>
  )
}
