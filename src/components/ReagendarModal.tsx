import React, { useState } from 'react'
import { X, CalendarClock } from 'lucide-react'
import type { Servico } from '../types'
import { updateServico } from '../data/servicoStore'
import { dispararWebhookReagendamento } from '../data/webhooks'
import { registrarLog } from '../data/logStore'
import { useAuth } from '../context/AuthContext'

interface Props {
  servico: Servico
  onClose: () => void
}

const OPCOES = [
  { key: 'amanha', label: 'Amanhã' },
  { key: 'semana', label: 'Esta semana' },
]

function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function addDays(base: Date, days: number) {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}

export default function ReagendarModal({ servico, onClose }: Props) {
  const { userEmail } = useAuth()
  const [opcao, setOpcao] = useState('amanha')

  function handleConfirmar() {
    const hoje = new Date()
    const novaData = opcao === 'amanha' ? addDays(hoje, 1) : addDays(hoje, 7 - hoje.getDay())
    const atualizado: Servico = {
      ...servico,
      status: 'agendado',
      dataAgendada: fmtDate(novaData),
    }
    updateServico(servico.id, { status: 'agendado', dataAgendada: fmtDate(novaData) })
    const opcaoLabel = OPCOES.find((o) => o.key === opcao)?.label ?? opcao
    dispararWebhookReagendamento(atualizado, opcaoLabel)
    registrarLog(userEmail ?? 'sistema', 'Serviço reagendado', `${servico.clienteNome} — ${opcaoLabel}`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-soft w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-ink-900 flex items-center gap-2">
            <CalendarClock size={18} className="text-brand-600" />
            Reagendar
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-500">{servico.clienteNome} — escolha o novo prazo:</p>
          <div className="flex gap-2">
            {OPCOES.map((o) => (
              <button
                key={o.key}
                onClick={() => setOpcao(o.key)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition ${
                  opcao === o.key
                    ? 'bg-brand-600 border-brand-600 text-white'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmar}
              className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-card"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
