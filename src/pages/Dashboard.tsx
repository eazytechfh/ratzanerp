import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, UserCheck, CalendarClock, CalendarX, CalendarDays, CalendarRange, Calendar, Trophy, Bell, CheckCircle2,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Legend,
} from 'recharts'
import KpiCard from '../components/KpiCard'
import { useClientes } from '../data/clienteStore'
import { useServicos } from '../data/servicoStore'
import { useAlertas, concluirAlerta } from '../data/alertaStore'
import type { StatusCliente } from '../types'

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function startOfWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

export default function Dashboard() {
  const clientes = useClientes()
  const servicos = useServicos()
  const alertas = useAlertas()
  const navigate = useNavigate()
  const [periodoAlertas, setPeriodoAlertas] = useState<'hoje' | 'semana' | 'mes' | 'todos'>('todos')
  const hoje = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const alertasPendentes = useMemo(() => {
    const pendentes = alertas.filter((a) => !a.concluido)
    const filtrados = pendentes.filter((a) => {
      if (periodoAlertas === 'todos') return true
      const venc = new Date(a.dataVencimento + 'T00:00:00')
      if (periodoAlertas === 'hoje') {
        return venc.getTime() === hoje.getTime()
      }
      if (periodoAlertas === 'semana') {
        const inicioSemana = startOfWeek(hoje)
        const fimSemana = new Date(inicioSemana)
        fimSemana.setDate(fimSemana.getDate() + 6)
        return venc >= inicioSemana && venc <= fimSemana
      }
      const inicioMes = startOfMonth(hoje)
      const fimMes = endOfMonth(hoje)
      return venc >= inicioMes && venc <= fimMes
    })
    return filtrados.sort((a, b) => (a.dataVencimento < b.dataVencimento ? -1 : 1))
  }, [alertas, periodoAlertas, hoje])

  const kpis = useMemo(() => {
    const total = clientes.length
    const ativos = clientes.filter((c) => c.status === 'ativo').length
    const aVencer = clientes.filter((c) => c.status === 'vencendo').length
    const vencidos = clientes.filter((c) => c.status === 'vencido').length
    return { total, ativos, aVencer, vencidos }
  }, [clientes])

  function irParaClientes(status?: StatusCliente) {
    navigate(status ? `/clientes?status=${status}` : '/clientes')
  }

  const servicosExecutadosPorDia = useMemo(() => {
    const inicioSemana = startOfWeek(hoje)
    const counts = new Array(7).fill(0)
    servicos.forEach((s) => {
      if (s.status !== 'concluido') return
      const d = new Date(s.dataAgendada + 'T00:00:00')
      const diff = Math.floor((d.getTime() - inicioSemana.getTime()) / (1000 * 60 * 60 * 24))
      if (diff >= 0 && diff < 7) counts[diff] += 1
    })
    return WEEKDAY_LABELS.map((label, i) => ({ dia: label, qtd: counts[i] }))
  }, [hoje, servicos])

  const agendados = useMemo(() => {
    const hojeStr = hoje.toISOString().slice(0, 10)
    const inicioSemana = startOfWeek(hoje)
    const fimSemana = new Date(inicioSemana)
    fimSemana.setDate(fimSemana.getDate() + 6)
    const inicioMes = startOfMonth(hoje)
    const fimMes = endOfMonth(hoje)

    let hojeCount = 0
    let semanaCount = 0
    let mesCount = 0

    servicos.forEach((s) => {
      if (s.status === 'cancelado') return
      const d = new Date(s.dataAgendada + 'T00:00:00')
      if (s.dataAgendada === hojeStr) hojeCount += 1
      if (d >= inicioSemana && d <= fimSemana) semanaCount += 1
      if (d >= inicioMes && d <= fimMes) mesCount += 1
    })

    return { hoje: hojeCount, semana: semanaCount, mes: mesCount }
  }, [hoje, servicos])

  const topServicos = useMemo(() => {
    const map = new Map<string, number>()
    servicos.forEach((s) => {
      if (s.status !== 'concluido') return
      map.set(s.tipoServico, (map.get(s.tipoServico) ?? 0) + 1)
    })
    return Array.from(map.entries())
      .map(([nome, qtd]) => ({ nome, qtd }))
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 6)
  }, [servicos])

  const porOperador = useMemo(() => {
    const map = new Map<string, { novo: number; reforco: number }>()
    servicos.forEach((s) => {
      if (s.status !== 'concluido') return
      const atual = map.get(s.operador) ?? { novo: 0, reforco: 0 }
      if (s.tipoAtendimento === 'reforco') atual.reforco += 1
      else atual.novo += 1
      map.set(s.operador, atual)
    })
    return Array.from(map.entries())
      .map(([nome, v]) => ({ nome, novo: v.novo, reforco: v.reforco, total: v.novo + v.reforco }))
      .sort((a, b) => b.total - a.total)
  }, [servicos])

  const BAR_COLORS = ['#ab171a', '#c8323f', '#cc3366', '#e8578a', '#df6870', '#ec9a9d']

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">Visão geral das operações da Ratzan</p>
      </div>

      {/* KPIs de clientes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <button onClick={() => irParaClientes()} className="text-left w-full">
          <KpiCard label="Clientes na base" value={kpis.total} icon={Users} tone="brand" />
        </button>
        <button onClick={() => irParaClientes('ativo')} className="text-left w-full">
          <KpiCard label="Clientes ativos" value={kpis.ativos} icon={UserCheck} tone="green" />
        </button>
        <button onClick={() => irParaClientes('vencendo')} className="text-left w-full">
          <KpiCard label="Contratos a vencer" value={kpis.aVencer} icon={CalendarClock} tone="amber" hint="Próximos 30 dias" />
        </button>
        <button onClick={() => irParaClientes('vencido')} className="text-left w-full">
          <KpiCard label="Contratos vencidos" value={kpis.vencidos} icon={CalendarX} tone="red" />
        </button>
      </div>

      {alertas.some((a) => !a.concluido) && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-brand-600" />
              <h2 className="font-semibold text-ink-900">Alertas / Tarefas pendentes</h2>
            </div>
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
              {([
                { key: 'hoje', label: 'Hoje' },
                { key: 'semana', label: 'Semana' },
                { key: 'mes', label: 'Mês' },
                { key: 'todos', label: 'Todos' },
              ] as const).map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPeriodoAlertas(p.key)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                    periodoAlertas === p.key ? 'bg-white text-ink-900 shadow-sm' : 'text-slate-500 hover:text-ink-900'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-400 mb-4">{alertasPendentes.length} tarefa(s) no período selecionado</p>
          <div className="space-y-2">
            {alertasPendentes.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    a.prioridade === 'alta' ? 'bg-rose-500' : a.prioridade === 'media' ? 'bg-amber-500' : 'bg-slate-400'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => navigate(`/clientes/${a.clienteId}`)}
                    className="text-sm font-medium text-ink-900 hover:text-brand-600 truncate block text-left"
                  >
                    {a.clienteNome}
                  </button>
                  <p className="text-xs text-slate-500 truncate">{a.texto}</p>
                </div>
                <span className="text-xs text-slate-400 shrink-0">
                  {new Date(a.dataVencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                  {a.recorrente && ' ↻'}
                </span>
                <button
                  onClick={() => concluirAlerta(a.id)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 shrink-0"
                >
                  <CheckCircle2 size={14} /> Concluir
                </button>
              </div>
            ))}
            {alertasPendentes.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">Nenhuma tarefa pendente neste período.</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Wave chart serviços executados */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-card p-5">
          <h2 className="font-semibold text-ink-900 mb-1">Serviços executados na semana</h2>
          <p className="text-xs text-slate-400 mb-4">Quantidade de serviços concluídos por dia</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={servicosExecutadosPorDia} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="waveFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ab171a" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#ab171a" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="dia" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Area
                  type="monotone"
                  dataKey="qtd"
                  name="Serviços executados"
                  stroke="#ab171a"
                  strokeWidth={2.5}
                  fill="url(#waveFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Agendados */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5 flex flex-col gap-4">
          <h2 className="font-semibold text-ink-900">Serviços agendados</h2>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
            <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
              <Calendar size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Hoje</p>
              <p className="text-xl font-bold text-ink-900">{agendados.hoje}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
            <div className="w-10 h-10 rounded-lg bg-accent-500/10 text-accent-600 flex items-center justify-center">
              <CalendarDays size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Nesta semana</p>
              <p className="text-xl font-bold text-ink-900">{agendados.semana}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
            <div className="w-10 h-10 rounded-lg bg-ink-800/10 text-ink-800 flex items-center justify-center">
              <CalendarRange size={18} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Neste mês</p>
              <p className="text-xl font-bold text-ink-900">{agendados.mes}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Top serviços */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
          <div className="flex items-center gap-2 mb-1">
            <Trophy size={18} className="text-amber-500" />
            <h2 className="font-semibold text-ink-900">Top serviços realizados</h2>
          </div>
          <p className="text-xs text-slate-400 mb-4">Serviços concluídos por tipo</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topServicos} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="nome"
                  width={150}
                  tick={{ fontSize: 12, fill: '#334155' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
                <Bar dataKey="qtd" name="Concluídos" radius={[0, 6, 6, 0]} barSize={18}>
                  {topServicos.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Por operador */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
          <h2 className="font-semibold text-ink-900 mb-1">Serviços realizados por operador</h2>
          <p className="text-xs text-slate-400 mb-4">Serviço novo x reforço/garantia</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porOperador} margin={{ left: -20, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="nome" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="novo" name="Novo" stackId="op" radius={[0, 0, 0, 0]} barSize={36} fill="#cc3366" />
                <Bar dataKey="reforco" name="Reforço/Garantia" stackId="op" radius={[6, 6, 0, 0]} barSize={36} fill="#e8578a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
