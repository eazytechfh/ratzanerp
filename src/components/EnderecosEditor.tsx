import React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { Endereco } from '../types'

interface Props {
  enderecos: Endereco[]
  onChange: (enderecos: Endereco[]) => void
}

let localCounter = 0
function newId() {
  localCounter += 1
  return `end-novo-${Date.now()}-${localCounter}`
}

export default function EnderecosEditor({ enderecos, onChange }: Props) {
  function update(id: string, field: keyof Endereco, value: string) {
    onChange(enderecos.map((e) => (e.id === id ? { ...e, [field]: value } : e)))
  }

  function add() {
    onChange([
      ...enderecos,
      { id: newId(), rotulo: 'Novo endereço', endereco: '', cidade: 'Rio de Janeiro', uf: 'RJ', cep: '' },
    ])
  }

  function remove(id: string) {
    onChange(enderecos.filter((e) => e.id !== id))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700">Endereços</label>
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
        >
          <Plus size={14} /> Adicionar endereço
        </button>
      </div>

      {enderecos.map((end, idx) => (
        <div key={end.id} className="rounded-lg border border-slate-200 p-3 space-y-2 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <input
              value={end.rotulo}
              onChange={(e) => update(end.id, 'rotulo', e.target.value)}
              placeholder="Rótulo (ex: Principal, Filial)"
              className="flex-1 px-2.5 py-1.5 rounded-md border border-slate-300 text-xs font-medium focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
            />
            {enderecos.length > 1 && (
              <button
                type="button"
                onClick={() => remove(end.id)}
                className="text-slate-400 hover:text-rose-600 shrink-0"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <input
            value={end.endereco}
            onChange={(e) => update(end.id, 'endereco', e.target.value)}
            placeholder="Rua, número, bairro"
            className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              value={end.cidade}
              onChange={(e) => update(end.id, 'cidade', e.target.value)}
              placeholder="Cidade"
              className="px-2.5 py-1.5 rounded-md border border-slate-300 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
            />
            <input
              value={end.uf}
              onChange={(e) => update(end.id, 'uf', e.target.value)}
              placeholder="UF"
              maxLength={2}
              className="px-2.5 py-1.5 rounded-md border border-slate-300 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
            />
            <input
              value={end.cep}
              onChange={(e) => update(end.id, 'cep', e.target.value)}
              placeholder="CEP"
              className="px-2.5 py-1.5 rounded-md border border-slate-300 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
            />
          </div>
        </div>
      ))}
      {enderecos.length === 0 && (
        <p className="text-xs text-slate-400">Nenhum endereço adicionado.</p>
      )}
    </div>
  )
}
