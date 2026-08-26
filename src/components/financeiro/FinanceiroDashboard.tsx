import React, { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Target, TrendingUp, Percent, ArrowDownCircle, ArrowUpCircle, Trophy, Compass, Receipt, Wallet, Gauge } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { useServicos } from '../../data/servicoStore'
import { useClientes } from '../../data/clienteStore'
import { useMetas, getMeta } from '../../data/metaStore'
import { useContasReceber } from '../../data/receivableStore'
import { useContasPagar } from '../../data/contaPagarStore'
import { useAuth } from '../../context/AuthContext'
import KpiCard from '../KpiCard'

const MONTH_LABELS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const BAR_COLORS = ['#ab171a', '#c8323f', '#cc3366', '#e8578a', '#df6870', '#ec9a9d']

export default function FinanceiroDashboard() {
  const { perfil } = useAuth()
  const podeVerFluxoCaixa = perfil?.role === 'administrador'
  const servicos = useServicos()
  const clientes = useClientes()
  const contasReceber = useContasReceber()
  const contasPagar = useContasPagar()
  const metas = useMetas()
  const [ref, setRef] = useState(new Date())

  const ano = ref.getFullYear()
  const mes = ref.getMonth() + 1

  const servicosDoMes = useMemo(() => {
    return servicos.filter((s) => {
      const d = new Date(s.dataAgendada + 'T00:00:00')
      return d.getFullYear() === ano && d.getMonth() + 1 === mes
    })
  }, [servicos, ano, mes])

  const meta = useMemo(() => getMeta(ano, mes), [metas, ano, mes])

  const realizado = useMemo(() => {
    return servicosDoMes
      .filter((s) => s.status === 'concluido' && s.tipoAtendimento === 'novo')
      .reduce((acc, s) => acc + s.valor, 0)
  }, [servicosDoMes])

  const atingimento = meta > 0 ? Math.round((realizado / meta) * 100) : 0

  const fluxo = useMemo(() => {
    const hojeStr = new Date().toISOString().slice(0, 10)
    const inicioSemana = new Date()
    const fimSemana = new Date()
    fimSemana.setDate(fimSemana.getDate() + 7)

    const entradaPaga = contasReceber
      .filter((c) => c.status === 'pago' && c.vencimento.slice(0, 7) === `${ano}-${String(mes).padStart(2, '0')}`)
      .reduce((acc, c) => acc + c.valor, 0)
    const saidaPaga = contasPagar
      .filter((c) => c.status === 'pago' && c.dataPagamento?.slice(0, 7) === `${ano}-${String(mes).padStart(2, '0')}`)
      .reduce((acc, c) => acc + c.valor, 0)
    const entradaProgramada = contasReceber
      .filter((c) => c.status === 'pendente' && c.vencimento >= hojeStr && new Date(c.vencimento) <= fimSemana)
      .reduce((acc, c) => acc + c.valor, 0)
    const saidaProgramada = contasPagar
      .filter((c) => c.status === 'pendente' && c.vencimento >= hojeStr && new Date(c.vencimento) <= fimSemana)
      .reduce((acc, c) => acc + c.valor, 0)

    return { entradaPaga, saidaPaga, entradaProgramada, saidaProgramada }
  }, [contasReceber, contasPagar, ano, mes])

  const topServicosPorValor = useMemo(() => {
    const map = new Map<string, number>()
    servicosDoMes.forEach((s) => {
      if (s.status !== 'concluido') return
      map.set(s.tipoServico, (map.get(s.tipoServico) ?? 0) + s.valor)
    })
    return Array.from(map.entries())
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6)
  }, [servicosDoMes])

  const origemServicos = useMemo(() => {
    const map = new Map<string, number>()
    servicosDoMes.forEach((s) => {
      if (s.status !== 'concluido') return
      const cliente = clientes.find((c) => c.id === s.clienteId)
      const origem = cliente?.origem ?? 'Outro'
      map.set(origem, (map.get(origem) ?? 0) + s.valor)
    })
    return Array.from(map.entries()).map(([nome, total]) => ({ nome, total }))
  }, [servicosDoMes, clientes])

  const ticketMedio = useMemo(() => {
    const concluidos = servicosDoMes.filter((s) => s.status === 'concluido' && s.tipoAtendimento === 'novo')
    if (concluidos.length === 0) return 0
    return concluidos.reduce((acc, s) => acc + s.valor, 0) / concluidos.length
  }, [servicosDoMes])

  const lucroLiquido = fluxo.entradaPaga - fluxo.saidaPaga
  const margemLiquida = fluxo.entradaPaga > 0 ? (lucroLiquido / fluxo.entradaPaga) * 100 : 0

  function navegar(delta: number) {
    setRef((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1))
  }

  const fmtMoeda = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink-900">{MONTH_LABELS[mes - 1]} de {ano}</p>
        <div className="flex gap-1">
          <button onClick={() => navegar(-1)} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setRef(new Date())} className="px-3 h-8 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50">
            Mês atual
          </button>
          <button onClick={() => navegar(1)} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Meta mensal" value={fmtMoeda(meta)} icon={Target} tone="brand" />
        <KpiCard label="Realizado mensal" value={fmtMoeda(realizado)} icon={TrendingUp} tone="green" hint="Somente serviços novos" />
        <KpiCard label="Atingimento da meta" value={`${atingimento}%`} icon={Percent} tone={atingimento >= 100 ? 'green' : 'amber'} />
      </div>

      {podeVerFluxoCaixa && (
      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
        <h2 className="font-semibold text-ink-900 mb-4">Fluxo de caixa</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ArrowUpCircle size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Entrada (paga)</p>
              <p className="text-sm font-bold text-ink-900">{fmtMoeda(fluxo.entradaPaga)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <ArrowDownCircle size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Saída (paga)</p>
              <p className="text-sm font-bold text-ink-900">{fmtMoeda(fluxo.saidaPaga)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50/60 text-emerald-500 flex items-center justify-center shrink-0">
              <ArrowUpCircle size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500">A receber (7 dias)</p>
              <p className="text-sm font-bold text-ink-900">{fmtMoeda(fluxo.entradaProgramada)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-50/60 text-rose-500 flex items-center justify-center shrink-0">
              <ArrowDownCircle size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500">A pagar (7 dias)</p>
              <p className="text-sm font-bold text-ink-900">{fmtMoeda(fluxo.saidaProgramada)}</p>
            </div>
          </div>
        </div>
      </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
          <div className="flex items-center gap-2 mb-1">
            <Trophy size={18} className="text-amber-500" />
            <h2 className="font-semibold text-ink-900">Top serviços por $$</h2>
          </div>
          <p className="text-xs text-slate-400 mb-4">Faturamento por tipo de serviço concluído</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topServicosPorValor} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="nome" width={150} tick={{ fontSize: 12, fill: '#334155' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => fmtMoeda(v)} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
                <Bar dataKey="total" radius={[0, 6, 6, 0]} barSize={18}>
                  {topServicosPorValor.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
          <div className="flex items-center gap-2 mb-1">
            <Compass size={18} className="text-sky-500" />
            <h2 className="font-semibold text-ink-900">Origem dos serviços</h2>
          </div>
          <p className="text-xs text-slate-400 mb-4">Faturamento por canal de aquisição</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={origemServicos} margin={{ left: -10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="nome" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => fmtMoeda(v)} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} barSize={36} fill="#062233" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Ticket médio" value={fmtMoeda(ticketMedio)} icon={Receipt} tone="brand" />
        <KpiCard
          label="Lucro líquido"
          value={fmtMoeda(lucroLiquido)}
          icon={Wallet}
          tone={lucroLiquido >= 0 ? 'green' : 'red'}
          hint="Entradas pagas − saídas pagas no mês"
        />
        <KpiCard
          label="Margem líquida"
          value={`${margemLiquida.toFixed(1)}%`}
          icon={Gauge}
          tone={margemLiquida >= 0 ? 'green' : 'red'}
          hint="Lucro líquido ÷ faturamento (entradas pagas)"
        />
      </div>
    </div>
  )
}
