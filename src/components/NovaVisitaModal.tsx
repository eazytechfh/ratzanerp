import React, { useState } from 'react'
import { X, MapPin } from 'lucide-react'
import type { Cliente, Servico } from '../types'
import { addServico } from '../data/servicoStore'
import { useOperadores } from '../data/operadorStore'
import { registrarLog } from '../data/logStore'
import { useAuth } from '../context/AuthContext'

interface Props {
  cliente: Cliente
  onClose: () => void
}

export default function NovaVisitaModal({ cliente, onClose }: Props) {
  const operadores = useOperadores()
  const { userEmail } = useAuth()
  const [operador, setOperador] = useState(operadores[0]?.nome ?? '')
  const [dataAgendada, setDataAgendada] = useState('')
  const [horaAgendada, setHoraAgendada] = useState('09:00')
  const [motivo, setMotivo] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const endereco = cliente.enderecos[0]?.endereco ?? ''

  function validate() {
    const errs: Record<string, string> = {}
    if (!dataAgendada) errs.dataAgendada = 'Informe a data'
    if (!operador) errs.operador = 'Selecione um operador'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const nova: Servico = {
      id: `serv-${Date.now()}`,
      clienteId: cliente.id,
      clienteNome: cliente.nome,
      tipoServico: 'Visita',
      operador,
      dataAgendada,
      horaAgendada,
      status: 'agendado',
      endereco,
      observacoes: motivo || undefined,
      valor: 0,
      tipoAtendimento: 'visita',
      pragas: [],
      formaPagamento: 'incluso_no_contrato',
      contabilizarReceita: false,
    }

    const created = await addServico(nova)
    if (!created) {
      setErrors({ dataAgendada: 'Não foi possível agendar a visita. Tente novamente.' })
      return
    }
    registrarLog(userEmail ?? 'sistema', 'Visita agendada', `${cliente.nome} — ${dataAgendada} ${horaAgendada}`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-soft w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-ink-900">Cadastrar visita — {cliente.nome}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Endereço</label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-600">
              <MapPin size={15} className="text-slate-400 shrink-0" />
              {endereco || 'Cliente sem endereço cadastrado'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Operador responsável</label>
            <select
              value={operador}
              onChange={(e) => setOperador(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm bg-white"
            >
              {operadores.map((o) => (
                <option key={o.id} value={o.nome}>{o.nome}</option>
              ))}
            </select>
            {errors.operador && <p className="text-xs text-rose-600 mt-1">{errors.operador}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Data</label>
              <input
                type="date"
                value={dataAgendada}
                onChange={(e) => setDataAgendada(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
              />
              {errors.dataAgendada && <p className="text-xs text-rose-600 mt-1">{errors.dataAgendada}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Hora</label>
              <input
                type="time"
                value={horaAgendada}
                onChange={(e) => setHoraAgendada(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Motivo da visita</label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              placeholder="Ex: Vistoria, orçamento, retorno..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm resize-none"
            />
          </div>

          <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            A visita aparece na Agenda com as mesmas ações de um serviço (iniciar, dar baixa, reagendar) e fica
            registrada no histórico do cliente.
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-card"
            >
              Agendar visita
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
