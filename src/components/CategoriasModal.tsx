import React, { useState } from 'react'
import { X, Plus, Trash2, Tag } from 'lucide-react'
import { useCategorias, addCategoria, updateCategoria, removeCategoria } from '../data/categoriaStore'

interface Props {
  onClose: () => void
}

const CORES = ['#ab171a', '#cc3366', '#e8578a', '#062233', '#0ea5e9', '#16a34a', '#d97706', '#7c3aed']

export default function CategoriasModal({ onClose }: Props) {
  const categorias = useCategorias()
  const [novoNome, setNovoNome] = useState('')
  const [novaCor, setNovaCor] = useState(CORES[0])

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!novoNome.trim()) return
    addCategoria({ id: `cat-${Date.now()}`, nome: novoNome.trim(), cor: novaCor })
    setNovoNome('')
    setNovaCor(CORES[randIdx()])
  }

  function randIdx() {
    return Math.floor(Math.random() * CORES.length)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-soft w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-ink-900 flex items-center gap-2">
            <Tag size={18} className="text-brand-600" />
            Categorias de cliente
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
              placeholder="Nova categoria..."
              className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
            />
            <input
              type="color"
              value={novaCor}
              onChange={(e) => setNovaCor(e.target.value)}
              className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer shrink-0"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shrink-0"
            >
              <Plus size={16} />
            </button>
          </form>

          <div className="space-y-2">
            {categorias.map((cat) => (
              <div key={cat.id} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.cor }} />
                <input
                  value={cat.nome}
                  onChange={(e) => updateCategoria(cat.id, { nome: e.target.value })}
                  className="flex-1 text-sm text-ink-900 outline-none bg-transparent"
                />
                <button
                  onClick={() => removeCategoria(cat.id)}
                  className="text-slate-400 hover:text-rose-600 shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {categorias.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">Nenhuma categoria cadastrada.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
