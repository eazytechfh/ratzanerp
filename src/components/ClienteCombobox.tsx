import React, { useMemo, useState } from 'react'
import { Search, Building2, User, ChevronDown } from 'lucide-react'
import type { Cliente } from '../types'

interface Props {
  clientes: Cliente[]
  value: string
  onChange: (clienteId: string) => void
  error?: string
}

export default function ClienteCombobox({ clientes, value, onChange, error }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selecionado = clientes.find((c) => c.id === value)

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return clientes
    return clientes.filter(
      (c) =>
        c.nome.toLowerCase().includes(q) ||
        c.telefone.toLowerCase().includes(q) ||
        (c.cnpj ?? '').toLowerCase().includes(q) ||
        (c.cpf ?? '').toLowerCase().includes(q),
    )
  }, [clientes, query])

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left ${
          error ? 'border-rose-300' : 'border-slate-300'
        } focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none bg-white`}
      >
        {selecionado ? (
          <>
            <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${selecionado.tipo === 'PJ' ? 'bg-ink-800/10 text-ink-800' : 'bg-brand-50 text-brand-600'}`}>
              {selecionado.tipo === 'PJ' ? <Building2 size={13} /> : <User size={13} />}
            </div>
            <span className="flex-1 truncate">{selecionado.nome}</span>
          </>
        ) : (
          <span className="flex-1 text-slate-400">Selecione um cliente...</span>
        )}
        <ChevronDown size={16} className="text-slate-400 shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-full bg-white rounded-lg border border-slate-200 shadow-soft max-h-72 overflow-hidden flex flex-col">
            <div className="relative p-2 border-b border-slate-100">
              <Search size={15} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nome, empresa ou telefone..."
                className="w-full pl-8 pr-2 py-1.5 rounded-md border border-slate-200 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <div className="overflow-y-auto">
              {filtrados.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onChange(c.id)
                    setOpen(false)
                    setQuery('')
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 text-sm"
                >
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${c.tipo === 'PJ' ? 'bg-ink-800/10 text-ink-800' : 'bg-brand-50 text-brand-600'}`}>
                    {c.tipo === 'PJ' ? <Building2 size={13} /> : <User size={13} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-ink-900 truncate">{c.nome}</p>
                    <p className="text-xs text-slate-400">{c.telefone}</p>
                  </div>
                </button>
              ))}
              {filtrados.length === 0 && (
                <p className="text-sm text-slate-400 text-center py-4">Nenhum cliente encontrado.</p>
              )}
            </div>
          </div>
        </>
      )}
      {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
    </div>
  )
}
