import React, { useState } from 'react'
import { X, Plus, Trash2, Wrench } from 'lucide-react'
import { useTiposServico, addTipoServico, updateTipoServico, removeTipoServico } from '../data/tipoServicoStore'

interface Props {
  onClose: () => void
}

export default function TiposServicoModal({ onClose }: Props) {
  const tipos = useTiposServico()
  const [novoNome, setNovoNome] = useState('')

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!novoNome.trim()) return
    addTipoServico({ id: `tps-${Date.now()}`, nome: novoNome.trim() })
    setNovoNome('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-soft w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-ink-900 flex items-center gap-2">
            <Wrench size={18} className="text-brand-600" />
            Tipos de serviço
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <form onSubmit={handleAdd} className="flex items-center gap-2">
            <input
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              placeholder="Novo tipo de serviço..."
              className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shrink-0"
            >
              <Plus size={16} />
            </button>
          </form>

          <div className="space-y-2">
            {tipos.map((tipo) => (
              <div key={tipo.id} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5">
                <input
                  value={tipo.nome}
                  onChange={(e) => updateTipoServico(tipo.id, { nome: e.target.value })}
                  className="flex-1 text-sm text-ink-900 outline-none bg-transparent"
                />
                <button
                  onClick={() => removeTipoServico(tipo.id)}
                  className="text-slate-400 hover:text-rose-600 shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {tipos.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">Nenhum tipo de serviço cadastrado.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
