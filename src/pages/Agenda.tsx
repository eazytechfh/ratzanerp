import React, { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, CalendarClock, Clock, MapPin, RefreshCw, PlayCircle, Trash2, Link2, Loader2, Pencil } from 'lucide-react'
import { useServicos, updateServico, removeServico } from '../data/servicoStore'
import { useOperadores } from '../data/operadorStore'
import { registrarLog } from '../data/logStore'
import { useAuth } from '../context/AuthContext'
import { ServicoStatusBadge } from '../components/StatusBadge'
import DarBaixaModal from '../components/DarBaixaModal'
import ReagendarModal from '../components/ReagendarModal'
import EditarServicoModal from '../components/EditarServicoModal'
import { conectarGoogleCalendar, useGoogleCalendarConectado, sincronizarGoogleCalendar } from '../data/googleCalendarClient'
import type { Servico } from '../types'

type Visao = 'dia' | 'semana' | 'mes'

const FORMA_PAGAMENTO_LABEL: Record<Servico['formaPagamento'], string> = {
  pix: 'Pix',
  transferencia: 'Transferência',
  debito: 'Débito',
  credito: 'Crédito',
  boleto_pj: 'Boleto PJ',
  garantia: 'Garantia',
  dinheiro: 'Dinheiro',
  incluso_no_contrato: 'Incluso no Contrato',
}

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTH_LABELS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function fmtDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function startOfWeek(date: Date) {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export default function Agenda() {
  const servicosTodos = useServicos()
  const operadores = useOperadores()
  const { userEmail, perfil } = useAuth()
  const [visao, setVisao] = useState<Visao>('semana')
  const [dataRef, setDataRef] = useState(new Date())
  const [selecionado, setSelecionado] = useState<Servico | null>(null)
  const [modalBaixa, setModalBaixa] = useState(false)
  const [modalReagendar, setModalReagendar] = useState(false)
  const [modalEditar, setModalEditar] = useState(false)
  const googleConectado = useGoogleCalendarConectado(perfil?.id)
  const [sincronizando, setSincronizando] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const status = params.get('google')
    if (!status) return
    if (status === 'conectado') alert('Google Calendar conectado com sucesso!')
    else if (status === 'erro') alert(`Não foi possível conectar ao Google Calendar: ${params.get('msg') ?? 'erro desconhecido'}`)
    window.history.replaceState({}, '', window.location.pathname)
  }, [])

  async function handleSincronizarGoogle() {
    const relevantes = servicos.filter((s) => s.status === 'agendado' || s.status === 'em_andamento' || s.status === 'cancelado')
    setSincronizando(true)
    const resultado = await sincronizarGoogleCalendar(relevantes)
    setSincronizando(false)
    if (resultado.error) {
      alert(`Falha ao sincronizar: ${resultado.error}`)
      return
    }
    registrarLog(userEmail ?? 'sistema', 'Google Calendar sincronizado', `${resultado.criados ?? 0} criados, ${resultado.atualizados ?? 0} atualizados, ${resultado.cancelados ?? 0} cancelados`)
    alert(`Sincronizado! ${resultado.criados ?? 0} criados, ${resultado.atualizados ?? 0} atualizados, ${resultado.cancelados ?? 0} removidos.`)
  }

  const meuNomeOperador = useMemo(() => {
    if (perfil?.role !== 'operador' || !perfil.operadorId) return null
    return operadores.find((o) => o.id === perfil.operadorId)?.nome ?? null
  }, [perfil, operadores])

  const servicos = useMemo(() => {
    if (!meuNomeOperador) return servicosTodos
    return servicosTodos.filter((s) => s.operador === meuNomeOperador)
  }, [servicosTodos, meuNomeOperador])

  const servicosPorData = useMemo(() => {
    const map = new Map<string, Servico[]>()
    servicos.forEach((s) => {
      if (!map.has(s.dataAgendada)) map.set(s.dataAgendada, [])
      map.get(s.dataAgendada)!.push(s)
    })
    map.forEach((lista) => lista.sort((a, b) => a.horaAgendada.localeCompare(b.horaAgendada)))
    return map
  }, [servicos])

  function navegar(delta: number) {
    if (visao === 'dia') setDataRef((d) => addDays(d, delta))
    else if (visao === 'semana') setDataRef((d) => addDays(d, delta * 7))
    else setDataRef((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1))
  }

  function handleCancelar(s: Servico) {
    if (!window.confirm(`Cancelar o serviço de ${s.clienteNome}? O serviço será excluído da agenda e do contas a receber.`)) return
    removeServico(s.id)
    registrarLog(userEmail ?? 'sistema', 'Serviço cancelado', `${s.tipoServico} — ${s.clienteNome}`)
  }

  function handleIniciar(s: Servico) {
    const agora = new Date()
    const horaAtual = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`
    updateServico(s.id, { status: 'em_andamento', horaInicioReal: horaAtual })
    registrarLog(userEmail ?? 'sistema', 'Serviço iniciado', `${s.tipoServico} — ${s.clienteNome} às ${horaAtual}`)
  }

  function handleExcluir(s: Servico) {
    if (!window.confirm(`Excluir permanentemente o serviço de ${s.clienteNome}?`)) return
    removeServico(s.id)
    registrarLog(userEmail ?? 'sistema', 'Serviço excluído', `${s.tipoServico} — ${s.clienteNome}`)
  }

  const podeExcluir = perfil?.role !== 'operador'

  function renderAcoes(s: Servico) {
    if (s.status !== 'agendado' && s.status !== 'em_andamento') return null
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {s.status === 'agendado' && (
          <button
            onClick={() => handleIniciar(s)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
          >
            <PlayCircle size={13} /> Iniciar serviço
          </button>
        )}
        <button
          onClick={() => { setSelecionado(s); setModalBaixa(true) }}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
        >
          <CheckCircle2 size={13} /> Dar baixa
        </button>
        <button
          onClick={() => { setSelecionado(s); setModalReagendar(true) }}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200"
        >
          <CalendarClock size={13} /> Reagendar
        </button>
        <button
          onClick={() => { setSelecionado(s); setModalEditar(true) }}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
        >
          <Pencil size={13} /> Editar
        </button>
        <button
          onClick={() => handleCancelar(s)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
        >
          <XCircle size={13} /> Cancelar
        </button>
        {podeExcluir && (
          <button
            onClick={() => handleExcluir(s)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
          >
            <Trash2 size={13} /> Excluir
          </button>
        )}
      </div>
    )
  }

  function renderLista(datas: string[]) {
    return (
      <div className="space-y-4">
        {datas.map((dataStr) => {
          const lista = servicosPorData.get(dataStr) ?? []
          if (lista.length === 0) return null
          const d = new Date(dataStr + 'T00:00:00')
          return (
            <div key={dataStr} className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-sm font-semibold text-ink-900">
                {WEEKDAY_LABELS[d.getDay()]}, {d.toLocaleDateString('pt-BR')}
                <span className="ml-2 text-xs font-normal text-slate-400">{lista.length} serviço(s)</span>
              </div>
              <div className="divide-y divide-slate-50">
                {lista.map((s) => (
                  <div key={s.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-2 text-sm text-slate-500 w-20 shrink-0">
                      <Clock size={14} />
                      {s.horaAgendada}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink-900 truncate">{s.clienteNome}</p>
                      <p className="text-xs text-slate-400 truncate">{s.tipoServico} · {s.operador}</p>
                      <p className="text-xs font-medium text-brand-700 truncate">
                        {FORMA_PAGAMENTO_LABEL[s.formaPagamento]}
                        {s.parcelas ? ` · ${s.parcelas}x` : ''}
                      </p>
                      {s.endereco && (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.endereco)}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-brand-600 hover:text-brand-700 hover:underline truncate flex items-center gap-1 mt-0.5"
                        >
                          <MapPin size={11} className="shrink-0" /> {s.endereco}
                        </a>
                      )}
                    </div>
                    <ServicoStatusBadge status={s.status} />
                    {renderAcoes(s)}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
        {datas.every((d) => (servicosPorData.get(d) ?? []).length === 0) && (
          <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200">
            Nenhum serviço agendado neste período.
          </div>
        )}
      </div>
    )
  }

  const conteudo = useMemo(() => {
    if (visao === 'dia') {
      return renderLista([fmtDate(dataRef)])
    }
    if (visao === 'semana') {
      const inicio = startOfWeek(dataRef)
      const datas = Array.from({ length: 7 }, (_, i) => fmtDate(addDays(inicio, i)))
      return renderLista(datas)
    }
    // mês: grade de calendário
    const inicioMes = new Date(dataRef.getFullYear(), dataRef.getMonth(), 1)
    const fimMes = new Date(dataRef.getFullYear(), dataRef.getMonth() + 1, 0)
    const inicioGrade = startOfWeek(inicioMes)
    const dias: Date[] = []
    let cursor = inicioGrade
    while (cursor <= fimMes || dias.length % 7 !== 0) {
      dias.push(cursor)
      cursor = addDays(cursor, 1)
      if (dias.length > 42) break
    }
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-100">
          {WEEKDAY_LABELS.map((l) => (
            <div key={l} className="px-2 py-2 text-center text-xs font-semibold text-slate-500 bg-slate-50">{l}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {dias.map((d, i) => {
            const dataStr = fmtDate(d)
            const lista = servicosPorData.get(dataStr) ?? []
            const foraDoMes = d.getMonth() !== dataRef.getMonth()
            return (
              <div key={i} className={`min-h-24 border-b border-r border-slate-100 p-1.5 ${foraDoMes ? 'bg-slate-50/50' : ''}`}>
                <p className={`text-xs mb-1 ${foraDoMes ? 'text-slate-300' : 'text-slate-500'}`}>{d.getDate()}</p>
                <div className="space-y-1">
                  {lista.slice(0, 3).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => { setSelecionado(s); if (s.status === 'agendado' || s.status === 'em_andamento') setModalBaixa(true) }}
                      className="w-full text-left text-[10px] px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 truncate hover:bg-brand-100"
                    >
                      {s.horaAgendada} {s.clienteNome}
                    </button>
                  ))}
                  {lista.length > 3 && <p className="text-[10px] text-slate-400 px-1.5">+{lista.length - 3} mais</p>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visao, dataRef, servicosPorData])

  const tituloPeriodo = useMemo(() => {
    if (visao === 'dia') return dataRef.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
    if (visao === 'semana') {
      const inicio = startOfWeek(dataRef)
      const fim = addDays(inicio, 6)
      return `${inicio.toLocaleDateString('pt-BR')} — ${fim.toLocaleDateString('pt-BR')}`
    }
    return `${MONTH_LABELS[dataRef.getMonth()]} de ${dataRef.getFullYear()}`
  }, [visao, dataRef])

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Agenda</h1>
          <p className="text-slate-500 text-sm mt-0.5 capitalize">{tituloPeriodo}</p>
        </div>
        <div className="flex items-center gap-2 self-start">
          {googleConectado === false && (
            <button
              onClick={() => perfil && conectarGoogleCalendar(perfil.id)}
              className="hidden sm:inline-flex items-center gap-2 px-3 h-9 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
            >
              <Link2 size={15} />
              Conectar Google Calendar
            </button>
          )}
          {googleConectado === true && (
            <button
              onClick={handleSincronizarGoogle}
              disabled={sincronizando}
              className="hidden sm:inline-flex items-center gap-2 px-3 h-9 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              {sincronizando ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
              Sincronizar com Google Calendar
            </button>
          )}
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            {(['dia', 'semana', 'mes'] as Visao[]).map((v) => (
              <button
                key={v}
                onClick={() => setVisao(v)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition ${
                  visao === v ? 'bg-white text-ink-900 shadow-sm' : 'text-slate-500 hover:text-ink-900'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            <button onClick={() => navegar(-1)} className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => setDataRef(new Date())} className="px-3 h-9 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
              Hoje
            </button>
            <button onClick={() => navegar(1)} className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {conteudo}

      {modalBaixa && selecionado && (
        <DarBaixaModal servico={selecionado} onClose={() => { setModalBaixa(false); setSelecionado(null) }} />
      )}
      {modalReagendar && selecionado && (
        <ReagendarModal servico={selecionado} onClose={() => { setModalReagendar(false); setSelecionado(null) }} />
      )}
      {modalEditar && selecionado && (
        <EditarServicoModal servico={selecionado} onClose={() => { setModalEditar(false); setSelecionado(null) }} />
      )}
    </div>
  )
}
