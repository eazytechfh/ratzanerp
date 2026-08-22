import React, { useState } from 'react'
import { X } from 'lucide-react'
import type { Operador } from '../types'
import { addOperador, updateOperador } from '../data/operadorStore'

interface Props {
  operador?: Operador
  onClose: () => void
}

export default function OperadorModal({ operador, onClose }: Props) {
  const [nome, setNome] = useState(operador?.nome ?? '')
  const [telefone, setTelefone] = useState(operador?.telefone ?? '')
  const [endereco, setEndereco] = useState(operador?.endereco ?? '')
  const [cargo, setCargo] = useState(operador?.cargo ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const errs: Record<string, string> = {}
    if (!nome.trim()) errs.nome = 'Nome é obrigatório'
    if (!telefone.trim()) errs.telefone = 'Telefone é obrigatório'
    if (!cargo.trim()) errs.cargo = 'Cargo é obrigatório'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    if (operador) {
      updateOperador(operador.id, { nome: nome.trim(), telefone: telefone.trim(), endereco: endereco.trim(), cargo: cargo.trim() })
    } else {
      addOperador({
        id: `op-${Date.now()}`,
        nome: nome.trim(),
        telefone: telefone.trim(),
        endereco: endereco.trim(),
        cargo: cargo.trim(),
      })
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-soft w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-ink-900">{operador ? 'Editar operador' : 'Novo operador'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
            />
            {errors.nome && <p className="text-xs text-rose-600 mt-1">{errors.nome}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Telefone</label>
            <input
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(21) 90000-0000"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
            />
            {errors.telefone && <p className="text-xs text-rose-600 mt-1">{errors.telefone}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Endereço</label>
            <input
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Cargo</label>
            <input
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              placeholder="Ex: Técnico Aplicador"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
            />
            {errors.cargo && <p className="text-xs text-rose-600 mt-1">{errors.cargo}</p>}
          </div>

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
              {operador ? 'Salvar alterações' : 'Salvar operador'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
