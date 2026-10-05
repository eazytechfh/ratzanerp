import React, { useState } from 'react'
import { X } from 'lucide-react'
import type { ContaPagar } from '../types'
import { editarContaPagar } from '../data/contaPagarStore'
import { useFornecedores } from '../data/fornecedorStore'
import { registrarLog } from '../data/logStore'
import { useAuth } from '../context/AuthContext'
import MoneyInput from './MoneyInput'

interface Props {
  conta: ContaPagar
  onClose: () => void
}

const hoje = () => new Date().toISOString().slice(0, 10)

// Edita uma conta a pagar em qualquer situação (pendente ou já paga).
export default function EditarContaPagarModal({ conta, onClose }: Props) {
  const fornecedores = useFornecedores()
  const { userEmail } = useAuth()
  const [descricao, setDescricao] = useState(conta.descricao)
  const [fornecedorId, setFornecedorId] = useState(conta.fornecedorId ?? '')
  const [categoria, setCategoria] = useState(conta.categoria)
  const [valor, setValor] = useState(conta.valor)
  const [vencimento, setVencimento] = useState(conta.vencimento)
  const [pago, setPago] = useState(conta.status === 'pago')
  const [dataPagamento, setDataPagamento] = useState(conta.dataPagamento ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const errs: Record<string, string> = {}
    if (!descricao.trim()) errs.descricao = 'Informe a descrição'
    if (!valor || valor <= 0) errs.valor = 'Informe um valor válido'
    if (!vencimento) errs.vencimento = 'Informe o vencimento'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    await editarContaPagar(conta.id, {
      descricao: descricao.trim(),
      fornecedorId: fornecedorId || undefined,
      categoria: categoria.trim() || 'Geral',
      valor,
      vencimento,
      status: pago ? 'pago' : 'pendente',
      dataPagamento: pago ? dataPagamento || hoje() : undefined,
    })
    registrarLog(userEmail ?? 'sistema', 'Conta a pagar editada', descricao.trim())
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-soft w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-ink-900">Editar conta a pagar</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Descrição</label>
            <input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500"
            />
            {errors.descricao && <p className="text-xs text-rose-600 mt-1">{errors.descricao}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Fornecedor <span className="text-slate-400 font-normal">(opcional)</span></label>
            <select
              value={fornecedorId}
              onChange={(e) => setFornecedorId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500 bg-white"
            >
              <option value="">Sem fornecedor</option>
              {fornecedores.map((f) => (
                <option key={f.id} value={f.id}>{f.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Categoria</label>
            <input
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Valor</label>
              <MoneyInput
                value={valor}
                onChange={setValor}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500"
              />
              {errors.valor && <p className="text-xs text-rose-600 mt-1">{errors.valor}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Vencimento</label>
              <input
                type="date"
                value={vencimento}
                onChange={(e) => setVencimento(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500"
              />
              {errors.vencimento && <p className="text-xs text-rose-600 mt-1">{errors.vencimento}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Situação</label>
            <div className="flex gap-2">
              {([
                { v: false, label: 'Pendente' },
                { v: true, label: 'Pago' },
              ] as const).map((o) => (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => setPago(o.v)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition ${
                    pago === o.v ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            {pago && (
              <div className="mt-3">
                <label className="block text-xs text-slate-500 mb-1">Data do pagamento</label>
                <input
                  type="date"
                  value={dataPagamento || hoje()}
                  onChange={(e) => setDataPagamento(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500"
                />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">Cancelar</button>
            <button type="submit" className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-card">Salvar alterações</button>
          </div>
        </form>
      </div>
    </div>
  )
}
