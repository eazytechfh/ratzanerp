import React, { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Search, Wrench, Bug, ChevronRight, ArrowUp, ArrowDown, ShieldAlert, X } from 'lucide-react'
import { useServicos } from '../data/servicoStore'
import { ServicoStatusBadge } from '../components/StatusBadge'
import NovoServicoModal from '../components/NovoServicoModal'
import TiposServicoModal from '../components/TiposServicoModal'
import TiposPragaModal from '../components/TiposPragaModal'
import PeriodoFiltro from '../components/financeiro/PeriodoFiltro'
import type { Servico, StatusServico } from '../types'

type FiltroStatus = 'todos' | StatusServico

const MONTH_LABELS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const FORMA_LABEL: Record<Servico['formaPagamento'], string> = {
  pix: 'Pix',
  transferencia: 'Transferência',
  debito: 'Débito',
  credito: 'Crédito',
  boleto_pj: 'Boleto PJ',
  garantia: 'Garantia',
  dinheiro: 'Dinheiro',
  incluso_no_contrato: 'Incluso no Contrato',
}

// Reforço/garantia: atendimento de reforço ou pago pela garantia (não gera cobrança nova).
const ehReforco = (s: Servico) => s.tipoAtendimento === 'reforco' || s.formaPagamento === 'garantia'

type FiltroGarantia = 'a_vencer' | 'vencidas' | null

const fmtISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// Data de garantia do serviço (a da baixa tem prioridade).
const garantiaDe = (s: Servico) => s.baixa?.garantiaAte ?? s.garantiaAte

function mesMatch(dataStr: string, mes: Date | null) {
  if (!mes) return true
  return dataStr.slice(0, 7) === `${mes.getFullYear()}-${String(mes.getMonth() + 1).padStart(2, '0')}`
}

const FILTROS: { key: FiltroStatus; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'agendado', label: 'Agendados' },
  { key: 'em_andamento', label: 'Em andamento' },
  { key: 'concluido', label: 'Concluídos' },
]

export default function Servicos() {
  const servicos = useServicos()
  const navigate = useNavigate()
  // Vindo do Dashboard: /servicos?garantia=a_vencer | vencidas
  const [searchParams] = useSearchParams()
  const [filtroGarantia, setFiltroGarantia] = useState<FiltroGarantia>(() => {
    const g = searchParams.get('garantia')
    return g === 'a_vencer' || g === 'vencidas' ? g : null
  })
  const [filtro, setFiltro] = useState<FiltroStatus>('todos')
  const [busca, setBusca] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [tiposOpen, setTiposOpen] = useState(false)
  const [tiposPragaOpen, setTiposPragaOpen] = useState(false)
  // 'todas' | 'pagos' | 'reforco' | uma forma de pagamento específica
  const [filtroPagamento, setFiltroPagamento] = useState<string>('todas')
  const [filtroOperador, setFiltroOperador] = useState('todos')
  const [ordem, setOrdem] = useState<'desc' | 'asc'>('desc')
  // Abre já no mês atual; "Todos os períodos" volta a mostrar tudo.
  // Com filtro de garantia a lista é de todos os períodos (a garantia não depende do mês do serviço).
  const [mesFiltro, setMesFiltro] = useState<Date | null>(() => (filtroGarantia ? null : new Date()))

  function alternarOrdem() {
    setOrdem((prev) => (prev === 'desc' ? 'asc' : 'desc'))
  }

  const doPeriodo = useMemo(() => servicos.filter((s) => mesMatch(s.dataAgendada, mesFiltro)), [servicos, mesFiltro])

  const operadores = useMemo(
    () => Array.from(new Set(servicos.map((s) => s.operador).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [servicos],
  )

  // Tudo menos o status: período + operador + pagamento + busca. As contagens dos botões de status
  // e o resumo acompanham esses filtros.
  const base = useMemo(() => {
    const q = busca.trim().toLowerCase()
    const hojeStr = fmtISO(new Date())
    const limite = new Date()
    limite.setDate(limite.getDate() + 30)
    const limiteStr = fmtISO(limite)
    const matchGarantia = (s: Servico) => {
      if (!filtroGarantia) return true
      const ate = garantiaDe(s)
      if (!ate || s.status === 'cancelado') return false
      return filtroGarantia === 'vencidas' ? ate < hojeStr : ate >= hojeStr && ate <= limiteStr
    }
    return doPeriodo.filter((s) => {
      const matchBusca =
        !q ||
        s.clienteNome.toLowerCase().includes(q) ||
        s.tipoServico.toLowerCase().includes(q) ||
        s.operador.toLowerCase().includes(q)
      const matchOperador = filtroOperador === 'todos' || s.operador === filtroOperador || s.operadorAdicional === filtroOperador
      const matchPagamento =
        filtroPagamento === 'todas' ||
        (filtroPagamento === 'reforco' ? ehReforco(s) : filtroPagamento === 'pagos' ? !ehReforco(s) : s.formaPagamento === filtroPagamento)
      return matchBusca && matchOperador && matchPagamento && matchGarantia(s)
    })
  }, [doPeriodo, busca, filtroOperador, filtroPagamento, filtroGarantia])

  const filtrados = useMemo(() => {
    return base
      .filter((s) => filtro === 'todos' || s.status === filtro)
      .sort((a, b) => {
        const chaveA = `${a.dataAgendada} ${a.horaAgendada}`
        const chaveB = `${b.dataAgendada} ${b.horaAgendada}`
        if (chaveA === chaveB) return 0
        const maiorPrimeiro = chaveA < chaveB ? 1 : -1
        return ordem === 'desc' ? maiorPrimeiro : -maiorPrimeiro
      })
  }, [base, filtro, ordem])

  const counts = useMemo(() => {
    const c: Record<FiltroStatus, number> = { todos: base.length, agendado: 0, em_andamento: 0, concluido: 0, cancelado: 0 }
    base.forEach((s) => {
      c[s.status] += 1
    })
    return c
  }, [base])

  // Resumo do que está na lista agora (com todos os filtros aplicados).
  const resumo = useMemo(() => {
    const reforcos = filtrados.filter(ehReforco).length
    return { total: filtrados.length, reforcos, pagos: filtrados.length - reforcos }
  }, [filtrados])

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Serviços</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {mesFiltro
              ? `${doPeriodo.length} serviço(s) em ${MONTH_LABELS[mesFiltro.getMonth()]} de ${mesFiltro.getFullYear()} · ${servicos.length} no total`
              : `${servicos.length} ordens de serviço registradas`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setTiposOpen(true)}
            className="inline-flex items-center gap-2 whitespace-nowrap bg-white border border-slate-200 hover:bg-slate-50 text-ink-900 text-sm font-semibold px-4 py-2.5 rounded-lg shadow-card transition"
          >
            <Wrench size={18} />
            Tipos de Serviço
          </button>
          <button
            onClick={() => setTiposPragaOpen(true)}
            className="inline-flex items-center gap-2 whitespace-nowrap bg-white border border-slate-200 hover:bg-slate-50 text-ink-900 text-sm font-semibold px-4 py-2.5 rounded-lg shadow-card transition"
          >
            <Bug size={18} />
            Tipos de Praga
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 whitespace-nowrap bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-card transition"
          >
            <Plus size={18} />
            Cadastrar novo serviço
          </button>
        </div>
      </div>

      {filtroGarantia && (
        <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="flex items-center gap-2 text-sm text-amber-800">
            <ShieldAlert size={16} />
            <span>
              {filtroGarantia === 'vencidas' ? 'Garantias vencidas' : 'Garantias a vencer (próximos 30 dias)'}: <strong>{filtrados.length}</strong> serviço(s)
            </span>
          </p>
          <button onClick={() => setFiltroGarantia(null)} className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900">
            <X size={14} /> Limpar filtro
          </button>
        </div>
      )}

      <PeriodoFiltro mes={mesFiltro} onChange={setMesFiltro} />

      <div className="bg-white rounded-xl border border-slate-200 shadow-card">
        <div className="p-4 flex flex-col lg:flex-row gap-3 border-b border-slate-100">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por cliente, tipo de serviço ou operador..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
            />
          </div>
          <select
            value={filtroOperador}
            onChange={(e) => setFiltroOperador(e.target.value)}
            className="shrink-0 px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
            title="Filtrar por operador"
          >
            <option value="todos">Todos os operadores</option>
            {operadores.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          <select
            value={filtroPagamento}
            onChange={(e) => setFiltroPagamento(e.target.value)}
            className="shrink-0 px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
            title="Filtrar por forma de pagamento"
          >
            <option value="todas">Todas as formas</option>
            <option value="pagos">Serviços pagos</option>
            <option value="reforco">Reforço / Garantia</option>
            {(Object.keys(FORMA_LABEL) as Servico['formaPagamento'][]).map((k) => (
              <option key={k} value={k}>{FORMA_LABEL[k]}</option>
            ))}
          </select>
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

        <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/60 text-sm text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
          <span><strong className="text-ink-900">{resumo.total}</strong> serviço(s) na lista</span>
          <span><strong className="text-ink-900">{resumo.pagos}</strong> pago(s)</span>
          <span><strong className="text-amber-700">{resumo.reforcos}</strong> reforço/garantia</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="px-4 py-3 font-medium">
                  <button
                    onClick={alternarOrdem}
                    className="inline-flex items-center gap-1 hover:text-ink-900 transition"
                    title="Ordenar por data"
                  >
                    Data / Hora
                    {ordem === 'desc' ? <ArrowDown size={13} /> : <ArrowUp size={13} />}
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Serviço</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Operador</th>
                {filtroGarantia && <th className="px-4 py-3 font-medium">Garantia até</th>}
                <th className="px-4 py-3 font-medium hidden md:table-cell">Pagamento</th>
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
                  <td className="px-4 py-3 hidden lg:table-cell text-slate-600">{s.operador}{s.operadorAdicional ? ` + ${s.operadorAdicional}` : ''}</td>
                  {filtroGarantia && (
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {garantiaDe(s) ? new Date(garantiaDe(s)! + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}
                    </td>
                  )}
                  <td className="px-4 py-3 hidden md:table-cell text-slate-600 whitespace-nowrap">
                    {FORMA_LABEL[s.formaPagamento]}
                    {s.linkPagamento && <span className="ml-1.5 text-[11px] font-semibold px-1.5 py-0.5 rounded bg-sky-50 text-sky-700">Link</span>}
                    {ehReforco(s) && <span className="ml-1.5 text-[11px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">Reforço</span>}
                  </td>
                  <td className="px-4 py-3"><ServicoStatusBadge status={s.status} /></td>
                  <td className="px-4 py-3 text-right text-slate-700">
                    {s.contabilizarReceita ? (
                      s.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    ) : (
                      <span className="text-slate-300" title="Este serviço não gera cobrança própria (ex: data extra de um agendamento em lote, garantia ou incluso no contrato)">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-300"><ChevronRight size={18} /></td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-slate-400">
                    Nenhum serviço encontrado com esses filtros.
                    {mesFiltro && servicos.length > 0 && (
                      <span className="block text-xs mt-1">
                        A lista está limitada ao mês selecionado — use "Todos os períodos" para buscar em todo o histórico.
                      </span>
                    )}
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
