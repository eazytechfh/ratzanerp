import React, { useState } from 'react'
import { X } from 'lucide-react'
import type { Fornecedor } from '../types'
import { addFornecedor, updateFornecedor } from '../data/fornecedorStore'

interface Props {
  fornecedor?: Fornecedor
  onClose: () => void
}

export default function FornecedorModal({ fornecedor, onClose }: Props) {
  const [nome, setNome] = useState(fornecedor?.nome ?? '')
  const [tipoPrestacaoServico, setTipoPrestacaoServico] = useState(fornecedor?.tipoPrestacaoServico ?? '')
  const [cnpj, setCnpj] = useState(fornecedor?.cnpj ?? '')
  const [cpf, setCpf] = useState(fornecedor?.cpf ?? '')
  const [email, setEmail] = useState(fornecedor?.email ?? '')
  const [telefone, setTelefone] = useState(fornecedor?.telefone ?? '')
  const [endereco, setEndereco] = useState(fornecedor?.endereco ?? '')
  const [observacoes, setObservacoes] = useState(fornecedor?.observacoes ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const errs: Record<string, string> = {}
    if (!nome.trim()) errs.nome = 'Nome é obrigatório'
    if (!tipoPrestacaoServico.trim()) errs.tipoPrestacaoServico = 'Informe o tipo de prestação de serviço'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const dados = {
      nome: nome.trim(),
      tipoPrestacaoServico: tipoPrestacaoServico.trim(),
      cnpj: cnpj.trim() || undefined,
      cpf: cpf.trim() || undefined,
      email: email.trim() || undefined,
      telefone: telefone.trim() || undefined,
      endereco: endereco.trim() || undefined,
      observacoes: observacoes.trim() || undefined,
    }

    if (fornecedor) {
      updateFornecedor(fornecedor.id, dados)
    } else {
      addFornecedor({ id: `forn-${Date.now()}`, ...dados })
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-soft w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-ink-900">{fornecedor ? 'Editar fornecedor' : 'Novo fornecedor'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome / Razão social</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
            />
            {errors.nome && <p className="text-xs text-rose-600 mt-1">{errors.nome}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo de prestação de serviço</label>
            <input
              value={tipoPrestacaoServico}
              onChange={(e) => setTipoPrestacaoServico(e.target.value)}
              placeholder="Ex: Insumos químicos, Frota, Manutenção..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
            />
            {errors.tipoPrestacaoServico && <p className="text-xs text-rose-600 mt-1">{errors.tipoPrestacaoServico}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">CNPJ</label>
              <input value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0001-00" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">CPF</label>
              <input value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mail</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Telefone</label>
              <input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(21) 90000-0000" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Endereço</label>
            <input value={endereco} onChange={(e) => setEndereco(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Observações</label>
            <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500 resize-none" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">Cancelar</button>
            <button type="submit" className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-card">
              {fornecedor ? 'Salvar alterações' : 'Salvar fornecedor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
