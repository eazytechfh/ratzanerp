import React, { useState } from 'react'
import { X } from 'lucide-react'
import type { ContaReceberManual } from '../types'
import { editarContaReceberManual } from '../data/manualReceivableStore'
import { registrarLog } from '../data/logStore'
import { useAuth } from '../context/AuthContext'
import MoneyInput from './MoneyInput'

interface Props {
  conta: ContaReceberManual
  onClose: () => void
}

// Edita um lançamento manual do contas a receber (inclui as parcelas geradas pelo
// pagamento recorrente). Grava na mesma tabela que o Financeiro lê, então a mudança
// aparece lá (contas a receber e fluxo de caixa) sem nenhum passo extra.
export default function EditarContaReceberManualModal({ conta, onClose }: Props) {
  const { userEmail } = useAuth()
  const [descricao, setDescricao] = useState(conta.descricao)
  const [valor, setValor] = useState(conta.valor)
  const [vencimento, setVencimento] = useState(conta.vencimento)
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
    await editarContaReceberManual(conta.id, { descricao: descricao.trim(), valor, vencimento })
    registrarLog(userEmail ?? 'sistema', 'Cobrança editada', `${conta.clienteNome} — ${descricao.trim()}`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-soft w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-ink-900">Editar cobrança</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Cliente</label>
            <input value={conta.clienteNome} disabled className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-400 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Descrição</label>
            <input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500"
            />
            {errors.descricao && <p className="text-xs text-rose-600 mt-1">{errors.descricao}</p>}
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
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">
              Cancelar
            </button>
            <button type="submit" className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-card">
              Salvar alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
