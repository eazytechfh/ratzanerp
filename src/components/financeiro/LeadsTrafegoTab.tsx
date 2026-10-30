import React, { useMemo, useState } from 'react'
import { Rocket } from 'lucide-react'
import { useLeadsTrafego, RESPONSAVEL_TRAFEGO, PERCENTUAL_COMISSAO_TRAFEGO } from '../../data/trafegoStore'
import { ServicoStatusBadge } from '../StatusBadge'
import PeriodoFiltro from './PeriodoFiltro'

const MONTH_LABELS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const chaveMes = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

export default function LeadsTrafegoTab() {
  const todos = useLeadsTrafego()
  // Abre no mês atual; "Todos os períodos" soma tudo.
  const [mes, setMes] = useState<Date | null>(() => new Date())

  const leads = useMemo(
    () => (mes ? todos.filter((l) => l.dataServico.slice(0, 7) === chaveMes(mes)) : todos),
    [todos, mes],
  )

  // Comissão paga/devida = serviços concluídos; "prevista" = ainda agendados ou em andamento.
  const totalComissao = useMemo(
    () => leads.filter((l) => l.status === 'concluido').reduce((acc, l) => acc + l.comissaoTotal, 0),
    [leads],
  )
  const comissaoPrevista = useMemo(
    () => leads.filter((l) => l.status !== 'concluido').reduce((acc, l) => acc + l.comissaoTotal, 0),
    [leads],
  )

  // Resumo mês a mês (de todos os leads), para ver a comissão separada por mês.
  const porMes = useMemo(() => {
    const map = new Map<string, { concluidos: number; comissao: number; prevista: number }>()
    todos.forEach((l) => {
      const k = l.dataServico.slice(0, 7)
      const atual = map.get(k) ?? { concluidos: 0, comissao: 0, prevista: 0 }
      if (l.status === 'concluido') {
        atual.concluidos += 1
        atual.comissao += l.comissaoTotal
      } else {
        atual.prevista += l.comissaoTotal
      }
      map.set(k, atual)
    })
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1))
  }, [todos])

  const fmtMoeda = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <Rocket size={20} />
          </div>
          <div>
            <p className="text-sm text-slate-500">
              Comissão de tráfego pago ({PERCENTUAL_COMISSAO_TRAFEGO * 100}% dos serviços concluídos) — {mes ? `${MONTH_LABELS[mes.getMonth()]} de ${mes.getFullYear()}` : 'todos os períodos'}
            </p>
            <p className="text-xl font-bold text-ink-900">{fmtMoeda(totalComissao)} <span className="text-sm font-normal text-slate-400">para {RESPONSAVEL_TRAFEGO}</span></p>
            {comissaoPrevista > 0 && (
              <p className="text-xs text-slate-400 mt-0.5">+ {fmtMoeda(comissaoPrevista)} previstos (serviços ainda não concluídos)</p>
            )}
          </div>
        </div>
        <p className="text-xs text-slate-400 max-w-sm">
          Todo serviço novo de clientes com origem "Tráfego Pago" separa automaticamente 10% do valor para {RESPONSAVEL_TRAFEGO}.
          Em pagamentos parcelados, a comissão é dividida igualmente entre as parcelas.
        </p>
      </div>

      <PeriodoFiltro mes={mes} onChange={setMes} />

      {porMes.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
          <p className="px-4 py-3 text-sm font-semibold text-ink-900 border-b border-slate-100">Comissão de {RESPONSAVEL_TRAFEGO} por mês</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="px-4 py-2 font-medium">Mês</th>
                <th className="px-4 py-2 font-medium text-right">Serviços concluídos</th>
                <th className="px-4 py-2 font-medium text-right">Comissão</th>
                <th className="px-4 py-2 font-medium text-right hidden sm:table-cell">Prevista</th>
              </tr>
            </thead>
            <tbody>
              {porMes.map(([k, v]) => {
                const [ano, m] = k.split('-').map(Number)
                const ativo = mes !== null && chaveMes(mes) === k
                return (
                  <tr
                    key={k}
                    onClick={() => setMes(new Date(ano, m - 1, 1))}
                    className={`border-b border-slate-50 last:border-0 cursor-pointer hover:bg-slate-50 ${ativo ? 'bg-brand-50/60' : ''}`}
                  >
                    <td className="px-4 py-2.5 font-medium text-ink-900">{MONTH_LABELS[m - 1]} de {ano}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">{v.concluidos}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-brand-600">{fmtMoeda(v.comissao)}</td>
                    <td className="px-4 py-2.5 text-right text-slate-400 hidden sm:table-cell">{v.prevista > 0 ? fmtMoeda(v.prevista) : '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100">
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">Serviço</th>
              <th className="px-4 py-3 font-medium text-right">Valor serviço</th>
              <th className="px-4 py-3 font-medium text-right">Comissão (10%)</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell text-right">Por parcela</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.servicoId} className="border-b border-slate-50 last:border-0">
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{new Date(l.dataServico + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                <td className="px-4 py-3 font-medium text-ink-900">{l.clienteNome}</td>
                <td className="px-4 py-3 hidden sm:table-cell text-slate-600">{l.tipoServico}</td>
                <td className="px-4 py-3 text-right text-slate-700">{fmtMoeda(l.valorServico)}</td>
                <td className="px-4 py-3 text-right font-semibold text-brand-600">{fmtMoeda(l.comissaoTotal)}</td>
                <td className="px-4 py-3 hidden md:table-cell text-right text-slate-500">
                  {l.parcelas > 1 ? `${fmtMoeda(l.comissaoParcela)} × ${l.parcelas}x` : '-'}
                </td>
                <td className="px-4 py-3"><ServicoStatusBadge status={l.status} /></td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                  {mes ? 'Nenhum lead de tráfego pago neste mês. ' : 'Nenhum lead de tráfego pago encontrado. '}Cadastre clientes com origem "Tráfego Pago" para vê-los aqui.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
