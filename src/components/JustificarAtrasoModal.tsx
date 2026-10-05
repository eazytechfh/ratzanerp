import React, { useState } from 'react'
import { X, AlertTriangle, Loader2 } from 'lucide-react'
import type { Servico } from '../types'
import { registrarEventoServico } from '../data/servicoEventoStore'
import { registrarLog } from '../data/logStore'
import { useAuth } from '../context/AuthContext'
import { fmtDuracao } from '../lib/atraso'

interface Props {
  servico: Servico
  /** Minutos de atraso, só para mostrar no topo. */
  minutos: number
  onClose: () => void
}

// Gerente/administrador registra o motivo do atraso; fica no histórico do serviço.
export default function JustificarAtrasoModal({ servico, minutos, onClose }: Props) {
  const { userEmail, perfil } = useAuth()
  const [motivo, setMotivo] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (motivo.trim().length < 3) {
      setErro('Descreva o motivo do atraso.')
      return
    }
    setSalvando(true)
    const evento = await registrarEventoServico(servico.id, 'atraso_justificado', motivo.trim(), perfil?.nome ?? userEmail ?? 'sistema')
    if (!evento) {
      setSalvando(false)
      setErro('Não foi possível salvar a justificativa. Tente novamente.')
      return
    }
    registrarLog(userEmail ?? 'sistema', 'Atraso justificado', `${servico.tipoServico} — ${servico.clienteNome}: ${motivo.trim()}`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={salvando ? undefined : onClose} />
      <div className="relative bg-white rounded-2xl shadow-soft w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-ink-900 flex items-center gap-2">
            <AlertTriangle size={18} className="text-rose-600" />
            Justificar atraso
          </h2>
          <button onClick={onClose} disabled={salvando} className="text-slate-400 hover:text-slate-600 disabled:opacity-40">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="rounded-lg border border-rose-200 bg-rose-50/60 px-4 py-3">
            <p className="font-medium text-ink-900">{servico.clienteNome}</p>
            <p className="text-xs text-slate-500">
              {servico.tipoServico} · {servico.operador} · agendado para {servico.horaAgendada}
            </p>
            {minutos > 0 && <p className="text-xs font-semibold text-rose-700 mt-1">Atraso de {fmtDuracao(minutos)}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Motivo do atraso</label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={4}
              autoFocus
              placeholder="Ex: trânsito na Av. Brasil, cliente pediu para aguardar, problema no veículo..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm resize-none"
            />
            {erro && <p className="text-xs text-rose-600 mt-1">{erro}</p>}
            <p className="text-xs text-slate-400 mt-1">Fica registrado no histórico do serviço.</p>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} disabled={salvando} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={salvando} className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-card disabled:opacity-60">
              {salvando && <Loader2 size={15} className="animate-spin" />}
              Salvar justificativa
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
