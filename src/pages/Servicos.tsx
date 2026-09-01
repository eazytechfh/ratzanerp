import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Wrench, Bug, ChevronRight } from 'lucide-react'
import { useServicos } from '../data/servicoStore'
import { ServicoStatusBadge } from '../components/StatusBadge'
import NovoServicoModal from '../components/NovoServicoModal'
import TiposServicoModal from '../components/TiposServicoModal'
import TiposPragaModal from '../components/TiposPragaModal'
import type { StatusServico } from '../types'

type FiltroStatus = 'todos' | StatusServico

const FILTROS: { key: FiltroStatus; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'agendado', label: 'Agendados' },
  { key: 'em_andamento', label: 'Em andamento' },
  { key: 'concluido', label: 'Concluídos' },
]

export default function Servicos() {
  const servicos = useServicos()
  const navigate = useNavigate()
  const [filtro, setFiltro] = useState<FiltroStatus>('todos')
  const [busca, setBusca] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [tiposOpen, setTiposOpen] = useState(false)
  const [tiposPragaOpen, setTiposPragaOpen] = useState(false)

  const filtrados = useMemo(() => {
    return servicos
      .filter((s) => {
        const matchStatus = filtro === 'todos' || s.status === filtro
        const q = busca.trim().toLowerCase()
        const matchBusca =
          !q ||
          s.clienteNome.toLowerCase().includes(q) ||
          s.tipoServico.toLowerCase().includes(q) ||
          s.operador.toLowerCase().includes(q)
        return matchStatus && matchBusca
      })
      .sort((a, b) => (a.dataAgendada < b.dataAgendada ? 1 : -1))
  }, [servicos, filtro, busca])

  const counts = useMemo(() => {
    const c: Record<FiltroStatus, number> = { todos: servicos.length, agendado: 0, em_andamento: 0, concluido: 0, cancelado: 0 }
    servicos.forEach((s) => {
      c[s.status] += 1
    })
    return c
  }, [servicos])

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Serviços</h1>
          <p className="text-slate-500 text-sm mt-0.5">{servicos.length} ordens de serviço registradas</p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <button
            onClick={() => setTiposOpen(true)}
            className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-ink-900 text-sm font-semibold px-4 py-2.5 rounded-lg shadow-card transition"
          >
            <Wrench size={18} />
            Tipos de Serviço
          </button>
          <button
            onClick={() => setTiposPragaOpen(true)}
            className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-ink-900 text-sm font-semibold px-4 py-2.5 rounded-lg shadow-card transition"
          >
            <Bug size={18} />
            Tipos de Praga
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-card transition"
          >
            <Plus size={18} />
            Cadastrar novo serviço
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-card">
        <div className="p-4 flex flex-col sm:flex-row gap-3 border-b border-slate-100">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por cliente, tipo de serviço ou operador..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {FILTROS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFiltro(f.key)}
                className={`shrink-0 px-3.5 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                  filtro === f.key
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label} <span className="opacity-70">({counts[f.key]})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="px-4 py-3 font-medium">Data / Hora</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Serviço</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Operador</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Valor</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtrados.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => navigate(`/servicos/${s.id}`)}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer transition"
                >
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {new Date(s.dataAgendada + 'T00:00:00').toLocaleDateString('pt-BR')}
                    <span className="text-slate-400"> {s.horaAgendada}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-ink-900">{s.clienteNome}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-slate-600">{s.tipoServico}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-slate-600">{s.operador}</td>
                  <td className="px-4 py-3"><ServicoStatusBadge status={s.status} /></td>
                  <td className="px-4 py-3 text-right text-slate-700">
                    {s.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td className="px-4 py-3 text-slate-300"><ChevronRight size={18} /></td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    Nenhum serviço encontrado com esses filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && <NovoServicoModal onClose={() => setModalOpen(false)} />}
      {tiposOpen && <TiposServicoModal onClose={() => setTiposOpen(false)} />}
      {tiposPragaOpen && <TiposPragaModal onClose={() => setTiposPragaOpen(false)} />}
    </div>
  )
}
