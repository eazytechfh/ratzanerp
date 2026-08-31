import React, { useEffect, useMemo, useState } from 'react'
import { Plus, CheckCircle2, X, Search, Pencil } from 'lucide-react'
import { useContasPagar, addContaPagar, darBaixaContaPagar, cancelarContaPagar, editarContaPagar } from '../../data/contaPagarStore'
import type { ContaPagar, StatusConta } from '../../types'
import MoneyInput from '../MoneyInput'
import PeriodoFiltro from './PeriodoFiltro'

function mesMatch(dataStr: string, mes: Date | null) {
  if (!mes) return true
  return dataStr.slice(0, 7) === `${mes.getFullYear()}-${String(mes.getMonth() + 1).padStart(2, '0')}`
}

const STATUS_LABEL: Record<StatusConta, string> = { pendente: 'Pendente', pago: 'Pago', cancelado: 'Cancelado' }
const STATUS_STYLE: Record<StatusConta, string> = {
  pendente: 'bg-amber-50 text-amber-700 border-amber-200',
  pago: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelado: 'bg-slate-100 text-slate-500 border-slate-200',
}

const JANELA_EDICAO_MS = 5 * 60 * 1000

function dentroDaJanelaEdicao(criadoEm?: string) {
  if (!criadoEm) return false
  return Date.now() - new Date(criadoEm).getTime() < JANELA_EDICAO_MS
}

export default function ContasPagarTab() {
  const contas = useContasPagar()
  const [modalOpen, setModalOpen] = useState(false)
  const [descricao, setDescricao] = useState('')
  const [categoria, setCategoria] = useState('')
  const [valor, setValor] = useState(0)
  const [vencimento, setVencimento] = useState('')
  const [busca, setBusca] = useState('')
  const [recorrente, setRecorrente] = useState(false)
  const [repeticoes, setRepeticoes] = useState(2)
  const [editando, setEditando] = useState<ContaPagar | null>(null)
  const [mesFiltro, setMesFiltro] = useState<Date | null>(null)
  const [, forceTick] = useState(0)

  // re-renderiza periodicamente para a janela de edição de 5min expirar sozinha na tela
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 15000)
    return () => clearInterval(t)
  }, [])

  const contasDoPeriodo = useMemo(() => contas.filter((c) => mesMatch(c.vencimento, mesFiltro)), [contas, mesFiltro])

  const ordenadas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return [...contasDoPeriodo]
      .filter((c) => !q || c.descricao.toLowerCase().includes(q) || c.categoria.toLowerCase().includes(q))
      .sort((a, b) => (a.vencimento < b.vencimento ? -1 : 1))
  }, [contasDoPeriodo, busca])

  const totalPendente = contasDoPeriodo.filter((c) => c.status === 'pendente').reduce((a, c) => a + c.valor, 0)
  const totalPago = contasDoPeriodo.filter((c) => c.status === 'pago').reduce((a, c) => a + c.valor, 0)

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!descricao.trim() || !valor || !vencimento) return

    const qtd = recorrente ? Math.max(2, repeticoes) : 1
    for (let i = 0; i < qtd; i++) {
      const dataBase = new Date(vencimento + 'T00:00:00')
      dataBase.setMonth(dataBase.getMonth() + i)
      const vencimentoOcorrencia = dataBase.toISOString().slice(0, 10)
      const nova: ContaPagar = {
        id: `cp-${Date.now()}-${i}`,
        descricao: recorrente ? `${descricao.trim()} (${i + 1}/${qtd})` : descricao.trim(),
        categoria: categoria.trim() || 'Geral',
        valor,
        vencimento: vencimentoOcorrencia,
        status: 'pendente',
      }
      addContaPagar(nova)
    }

    setDescricao('')
    setCategoria('')
    setValor(0)
    setVencimento('')
    setRecorrente(false)
    setRepeticoes(2)
    setModalOpen(false)
  }

  function handleCancelar(c: ContaPagar) {
    if (!window.confirm(`Cancelar e excluir a conta "${c.descricao}"? Esta ação não pode ser desfeita.`)) return
    cancelarContaPagar(c.id)
  }

  function handleSalvarEdicao(e: React.FormEvent) {
    e.preventDefault()
    if (!editando) return
    editarContaPagar(editando.id, {
      descricao: editando.descricao,
      categoria: editando.categoria,
      valor: editando.valor,
      vencimento: editando.vencimento,
    })
    setEditando(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-sm">
          <p className="text-slate-500">Pendente: <span className="font-bold text-amber-600">{totalPendente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
          <p className="text-slate-500">Pago: <span className="font-bold text-emerald-600">{totalPago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-card transition"
        >
          <Plus size={16} /> Nova conta
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por descrição ou categoria..."
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm bg-white"
        />
      </div>

      <PeriodoFiltro mes={mesFiltro} onChange={setMesFiltro} />

      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100">
              <th className="px-4 py-3 font-medium">Descrição</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">Categoria</th>
              <th className="px-4 py-3 font-medium">Vencimento</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Valor</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {ordenadas.map((c) => (
              <tr key={c.id} className="border-b border-slate-50 last:border-0">
                <td className="px-4 py-3 font-medium text-ink-900">{c.descricao}</td>
                <td className="px-4 py-3 hidden sm:table-cell text-slate-600">{c.categoria}</td>
                <td className="px-4 py-3 text-slate-600">{new Date(c.vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLE[c.status]}`}>
                    {STATUS_LABEL[c.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-slate-700">{c.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td className="px-4 py-3">
                  {c.status === 'pendente' && (
                    <div className="flex items-center gap-1 justify-end">
                      {dentroDaJanelaEdicao(c.criadoEm) && (
                        <button onClick={() => setEditando(c)} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100" title="Editar (até 5 minutos após criar)">
                          <Pencil size={16} />
                        </button>
                      )}
                      <button onClick={() => darBaixaContaPagar(c.id)} className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50" title="Dar baixa">
                        <CheckCircle2 size={16} />
                      </button>
                      <button onClick={() => handleCancelar(c)} className="p-1.5 rounded-md text-rose-600 hover:bg-rose-50" title="Cancelar e excluir">
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-soft w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-ink-900">Nova conta a pagar</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Descrição</label>
                <input value={descricao} onChange={(e) => setDescricao(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Categoria</label>
                <input value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Ex: Insumos, Pessoal..." className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Valor</label>
                  <MoneyInput value={valor} onChange={setValor} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Vencimento</label>
                  <input type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500" />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={recorrente}
                    onChange={(e) => setRecorrente(e.target.checked)}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-200"
                  />
                  Despesa recorrente
                </label>
                {recorrente && (
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Quantas vezes se repete (mensal)</label>
                    <input
                      type="number"
                      min="2"
                      value={repeticoes}
                      onChange={(e) => setRepeticoes(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500"
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">Cancelar</button>
                <button type="submit" className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-card">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditando(null)} />
          <div className="relative bg-white rounded-2xl shadow-soft w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-ink-900">Editar conta a pagar</h2>
              <button onClick={() => setEditando(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSalvarEdicao} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Descrição</label>
                <input
                  value={editando.descricao}
                  onChange={(e) => setEditando({ ...editando, descricao: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Categoria</label>
                <input
                  value={editando.categoria}
                  onChange={(e) => setEditando({ ...editando, categoria: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Valor</label>
                  <MoneyInput
                    value={editando.valor}
                    onChange={(v) => setEditando({ ...editando, valor: v })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Vencimento</label>
                  <input
                    type="date"
                    value={editando.vencimento}
                    onChange={(e) => setEditando({ ...editando, vencimento: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditando(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">Cancelar</button>
                <button type="submit" className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-card">Salvar alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
