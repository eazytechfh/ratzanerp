import React, { useState } from 'react'
import { X, Bell } from 'lucide-react'
import type { Alerta, Cliente, FrequenciaRecorrencia } from '../types'
import { addAlerta } from '../data/alertaStore'
import { registrarLog } from '../data/logStore'
import { useAuth } from '../context/AuthContext'

interface Props {
  cliente: Cliente
  onClose: () => void
}

const PRIORIDADES: { value: Alerta['prioridade']; label: string; classe: string }[] = [
  { value: 'baixa', label: 'Baixa', classe: 'bg-slate-100 text-slate-600 border-slate-200' },
  { value: 'media', label: 'Média', classe: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'alta', label: 'Alta', classe: 'bg-rose-50 text-rose-700 border-rose-200' },
]

const FREQUENCIAS: { value: FrequenciaRecorrencia; label: string }[] = [
  { value: 'diaria', label: 'Diária' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'mensal', label: 'Mensal' },
  { value: 'semestral', label: 'Semestral' },
]

function hoje() {
  return new Date().toISOString().slice(0, 10)
}

export default function IncluirAlertaModal({ cliente, onClose }: Props) {
  const { userEmail } = useAuth()
  const [texto, setTexto] = useState('')
  const [prioridade, setPrioridade] = useState<Alerta['prioridade']>('media')
  const [dataVencimento, setDataVencimento] = useState(hoje())
  const [recorrente, setRecorrente] = useState(false)
  const [frequencia, setFrequencia] = useState<FrequenciaRecorrencia>('mensal')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim()) {
      setError('Descreva a tarefa/alerta')
      return
    }

    const novo: Alerta = {
      id: `alerta-${Date.now()}`,
      clienteId: cliente.id,
      clienteNome: cliente.nome,
      texto: texto.trim(),
      prioridade,
      concluido: false,
      criadoPor: userEmail ?? 'sistema',
      criadoEm: new Date().toISOString(),
      dataVencimento,
      recorrente,
      frequencia: recorrente ? frequencia : undefined,
    }

    addAlerta(novo)
    registrarLog(userEmail ?? 'sistema', 'Alerta criado', `${cliente.nome}: ${texto.trim()}`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-soft w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-ink-900 flex items-center gap-2">
            <Bell size={18} className="text-brand-600" />
            Incluir alerta — {cliente.nome}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Tarefa / Alerta</label>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={3}
              placeholder="Ex: Ligar para confirmar reagendamento, cobrar assinatura do contrato..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500 resize-none"
            />
            {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Vencimento</label>
            <input
              type="date"
              value={dataVencimento}
              onChange={(e) => setDataVencimento(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Prioridade</label>
            <div className="flex gap-2">
              {PRIORIDADES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPrioridade(p.value)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition ${
                    prioridade === p.value ? p.classe + ' ring-2 ring-offset-1 ring-brand-200' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 p-3 space-y-3">
            <label className="flex items-center gap-2 text-sm text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={recorrente}
                onChange={(e) => setRecorrente(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-200"
              />
              Alerta recorrente
            </label>
            {recorrente && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Repetir</label>
                <div className="flex gap-2">
                  {FREQUENCIAS.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setFrequencia(f.value)}
                      className={`flex-1 py-1.5 rounded-md text-xs font-semibold border transition ${
                        frequencia === f.value
                          ? 'bg-brand-600 border-brand-600 text-white'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Ao concluir, um novo alerta será criado automaticamente com o próximo vencimento.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">Cancelar</button>
            <button type="submit" className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-card">Salvar alerta</button>
          </div>
        </form>
      </div>
    </div>
  )
}
