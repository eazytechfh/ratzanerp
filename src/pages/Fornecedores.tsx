import React, { useMemo, useState } from 'react'
import { Plus, Search, Phone, Mail, MapPin, Briefcase, Pencil, Trash2, Truck } from 'lucide-react'
import { useFornecedores, removeFornecedor } from '../data/fornecedorStore'
import FornecedorModal from '../components/FornecedorModal'
import type { Fornecedor } from '../types'

export default function Fornecedores() {
  const fornecedores = useFornecedores()
  const [busca, setBusca] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Fornecedor | null>(null)

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return fornecedores
    return fornecedores.filter(
      (f) =>
        f.nome.toLowerCase().includes(q) ||
        f.tipoPrestacaoServico.toLowerCase().includes(q) ||
        (f.telefone ?? '').toLowerCase().includes(q),
    )
  }, [fornecedores, busca])

  function handleRemover(f: Fornecedor) {
    if (!window.confirm(`Excluir o fornecedor ${f.nome}?`)) return
    removeFornecedor(f.id)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Fornecedores</h1>
          <p className="text-slate-500 text-sm mt-0.5">{fornecedores.length} fornecedores cadastrados</p>
        </div>
        <button
          onClick={() => {
            setEditando(null)
            setModalOpen(true)
          }}
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-card transition self-start"
        >
          <Plus size={18} />
          Novo fornecedor
        </button>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, tipo de serviço ou telefone..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm bg-white shadow-card"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtrados.map((f) => (
          <div key={f.id} className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                  <Truck size={20} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-ink-900 truncate">{f.nome}</p>
                  <p className="text-xs text-slate-400 truncate">{f.tipoPrestacaoServico || 'Sem tipo definido'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => {
                    setEditando(f)
                    setModalOpen(true)
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-ink-900 hover:bg-slate-50"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => handleRemover(f)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone size={14} className="text-slate-400 shrink-0" />
                <span>{f.telefone || '-'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Mail size={14} className="text-slate-400 shrink-0" />
                <span className="truncate">{f.email || '-'}</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-slate-600">
                <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                <span className="truncate">{f.endereco || '-'}</span>
              </div>
              {(f.cnpj || f.cpf) && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Briefcase size={14} className="text-slate-400 shrink-0" />
                  <span>{f.cnpj || f.cpf}</span>
                </div>
              )}
            </div>
          </div>
        ))}
        {filtrados.length === 0 && (
          <div className="col-span-full text-center py-10 text-slate-400 bg-white rounded-xl border border-slate-200">
            Nenhum fornecedor encontrado.
          </div>
        )}
      </div>

      {modalOpen && (
        <FornecedorModal
          fornecedor={editando ?? undefined}
          onClose={() => {
            setModalOpen(false)
            setEditando(null)
          }}
        />
      )}
    </div>
  )
}
