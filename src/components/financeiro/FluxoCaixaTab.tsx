import React, { useMemo } from 'react'
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { useContasReceber } from '../../data/receivableStore'
import { useContasPagar } from '../../data/contaPagarStore'

interface Movimento {
  id: string
  tipo: 'entrada' | 'saida'
  descricao: string
  contraparte: string
  data: string
  status: 'pendente' | 'pago' | 'cancelado'
  valor: number
}

export default function FluxoCaixaTab() {
  const contasReceber = useContasReceber()
  const contasPagar = useContasPagar()

  const movimentos = useMemo<Movimento[]>(() => {
    const entradas: Movimento[] = contasReceber.map((c) => ({
      id: c.id,
      tipo: 'entrada',
      descricao: c.descricao,
      contraparte: c.clienteNome,
      data: c.vencimento,
      status: c.status,
      valor: c.valor,
    }))
    const saidas: Movimento[] = contasPagar.map((c) => ({
      id: c.id,
      tipo: 'saida',
      descricao: c.descricao,
      contraparte: c.categoria,
      data: c.vencimento,
      status: c.status,
      valor: c.valor,
    }))
    return [...entradas, ...saidas].sort((a, b) => (a.data < b.data ? -1 : 1))
  }, [contasReceber, contasPagar])

  const totalEntradas = movimentos.filter((m) => m.tipo === 'entrada' && m.status === 'pago').reduce((a, m) => a + m.valor, 0)
  const totalSaidas = movimentos.filter((m) => m.tipo === 'saida' && m.status === 'pago').reduce((a, m) => a + m.valor, 0)
  const saldo = totalEntradas - totalSaidas

  const hojeStr = new Date().toISOString().slice(0, 10)
  const emSeteDias = new Date()
  emSeteDias.setDate(emSeteDias.getDate() + 7)

  function vencendoEmBreve(m: Movimento) {
    return m.status === 'pendente' && m.data >= hojeStr && new Date(m.data) <= emSeteDias
  }

  const fmtMoeda = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-4">
          <p className="text-xs text-slate-500">Total de entradas (pagas)</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">{fmtMoeda(totalEntradas)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-4">
          <p className="text-xs text-slate-500">Total de saídas (pagas)</p>
          <p className="text-xl font-bold text-rose-600 mt-1">{fmtMoeda(totalSaidas)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-4">
          <p className="text-xs text-slate-500">Saldo</p>
          <p className={`text-xl font-bold mt-1 ${saldo >= 0 ? 'text-ink-900' : 'text-rose-600'}`}>{fmtMoeda(saldo)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <h2 className="font-semibold text-ink-900 text-sm">Movimentações</h2>
          <p className="text-xs text-slate-400">Contas a pagar e a receber combinadas · destaque para o que vence nos próximos 7 dias</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100">
              <th className="px-4 py-2.5 font-medium">Data</th>
              <th className="px-4 py-2.5 font-medium">Descrição</th>
              <th className="px-4 py-2.5 font-medium hidden sm:table-cell">Contraparte</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {movimentos.map((m) => (
              <tr key={`${m.tipo}-${m.id}`} className={`border-b border-slate-50 last:border-0 ${vencendoEmBreve(m) ? 'bg-amber-50/50' : ''}`}>
                <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">{new Date(m.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                <td className="px-4 py-2.5 text-ink-900 font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    {m.tipo === 'entrada' ? <ArrowUpCircle size={14} className="text-emerald-500" /> : <ArrowDownCircle size={14} className="text-rose-500" />}
                    {m.descricao}
                  </span>
                </td>
                <td className="px-4 py-2.5 hidden sm:table-cell text-slate-600">{m.contraparte}</td>
                <td className="px-4 py-2.5">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${
                    m.status === 'pago'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : m.status === 'cancelado'
                        ? 'bg-slate-100 text-slate-500 border-slate-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {m.status === 'pago' ? 'Pago' : m.status === 'cancelado' ? 'Cancelado' : 'Pendente'}
                  </span>
                </td>
                <td className={`px-4 py-2.5 text-right font-medium ${m.tipo === 'entrada' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {m.tipo === 'entrada' ? '+' : '-'}{fmtMoeda(m.valor)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
