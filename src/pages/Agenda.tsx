import React, { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, CalendarClock, Clock, MapPin, RefreshCw, PlayCircle, Trash2, Link2, Loader2, Pencil, AlertTriangle, Search, X } from 'lucide-react'
import { useServicos, removeServico, updateServico, getServicoById } from '../data/servicoStore'
import { useClientes } from '../data/clienteStore'
import { useOperadores } from '../data/operadorStore'
import { registrarLog } from '../data/logStore'
import { useAuth } from '../context/AuthContext'
import { ServicoStatusBadge } from '../components/StatusBadge'
import DarBaixaModal from '../components/DarBaixaModal'
import ReagendarModal from '../components/ReagendarModal'
import EditarServicoModal from '../components/EditarServicoModal'
import JustificarAtrasoModal from '../components/JustificarAtrasoModal'
import { useEventosServico, registrarEventoServico } from '../data/servicoEventoStore'
import { situacaoDeAtraso, inicioRealDoServico, fmtHora, fmtDuracao } from '../lib/atraso'
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
  const clientes = useClientes()
  const operadores = useOperadores()
  const { userEmail, perfil } = useAuth()
  // Ao abrir a Agenda, a visão inicial é o dia de hoje (semana e mês continuam a um clique).
  const [visao, setVisao] = useState<Visao>('dia')
  const [dataRef, setDataRef] = useState(new Date())
  const [selecionado, setSelecionado] = useState<Servico | null>(null)
  const [modalBaixa, setModalBaixa] = useState(false)
  const [modalReagendar, setModalReagendar] = useState(false)
  const [modalEditar, setModalEditar] = useState(false)
  const googleConectado = useGoogleCalendarConectado(perfil?.id)
  // A função de sincronização apaga a conexão quando o Google recusa renová-la (acesso expirado ou
  // revogado). Isso só é descoberto no clique, então marcamos aqui para trocar "Sincronizar" por
  // "Conectar" sem precisar recarregar a página.
  const [googleDesconectado, setGoogleDesconectado] = useState(false)
  const [sincronizando, setSincronizando] = useState(false)
  const [iniciandoId, setIniciandoId] = useState<string | null>(null)
  const [justificando, setJustificando] = useState<{ servico: Servico; minutos: number } | null>(null)
  const eventos = useEventosServico()

  // Relógio da tela: reavalia "atrasado" a cada 30s sem precisar recarregar a página.
  const [agora, setAgora] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setAgora(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const status = params.get('google')
    if (!status) return
    if (status === 'conectado') alert('Google Calendar conectado com sucesso!')
    else if (status === 'erro') alert(`Não foi possível conectar ao Google Calendar: ${params.get('msg') ?? 'erro desconhecido'}`)
    window.history.replaceState({}, '', window.location.pathname)
  }, [])

  async function handleSincronizarGoogle() {
    // Usa a lista completa do perfil (sem o filtro de operador da tela) — filtrar a visualização
    // não pode mudar o que é enviado ao Google Calendar.
    const relevantes = servicosBase.filter((s) => s.status === 'agendado' || s.status === 'em_andamento' || s.status === 'cancelado')
    setSincronizando(true)
    const resultado = await sincronizarGoogleCalendar(relevantes)
    setSincronizando(false)
    if (resultado.error) {
      const erro = resultado.error.toLowerCase()
      if (erro.includes('não conectado') || erro.includes('expirou') || erro.includes('revogad')) {
        setGoogleDesconectado(true)
        alert('A conexão com o Google Calendar expirou ou foi desfeita. Clique em "Conectar Google Calendar" e autorize novamente para voltar a sincronizar.')
        return
      }
      alert(`Falha ao sincronizar: ${resultado.error}`)
      return
    }
    registrarLog(userEmail ?? 'sistema', 'Google Calendar sincronizado', `${resultado.criados ?? 0} criados, ${resultado.atualizados ?? 0} atualizados, ${resultado.cancelados ?? 0} cancelados`)
    const erros = resultado.erros ?? []
    const avisoErros = erros.length > 0 ? `\n\n${erros.length} serviço(s) com falha:\n${erros.slice(0, 3).join('\n')}${erros.length > 3 ? '\n…' : ''}` : ''
    alert(`Sincronizado! ${resultado.criados ?? 0} criados, ${resultado.atualizados ?? 0} atualizados, ${resultado.cancelados ?? 0} removidos.${avisoErros}`)
  }

  const meuNomeOperador = useMemo(() => {
    if (perfil?.role !== 'operador' || !perfil.operadorId) return null
    return operadores.find((o) => o.id === perfil.operadorId)?.nome ?? null
  }, [perfil, operadores])

  // O operador só enxerga os próprios serviços; os demais perfis veem todos.
  const servicosBase = useMemo(() => {
    if (!meuNomeOperador) return servicosTodos
    return servicosTodos.filter((s) => s.operador === meuNomeOperador)
  }, [servicosTodos, meuNomeOperador])

  // Filtro por operador (administrador e gerentes). Vazio = todos os operadores.
  const podeFiltrarOperador = !!perfil && perfil.role !== 'operador'
  const [filtroOperador, setFiltroOperador] = useState('')

  // Operadores cadastrados + qualquer nome que apareça em serviço (ex.: operador renomeado/removido),
  // para nenhum serviço ficar fora do filtro.
  const opcoesOperador = useMemo(() => {
    const nomes = new Set<string>(operadores.map((o) => o.nome))
    servicosTodos.forEach((s) => s.operador && nomes.add(s.operador))
    return [...nomes].sort((a, b) => a.localeCompare(b))
  }, [operadores, servicosTodos])

  // Busca por cliente: nome, telefone ou endereço. Com texto digitado, procura em todas as datas.
  const [busca, setBusca] = useState('')
  const termoBusca = busca.trim()

  const servicos = useMemo(() => {
    const porOperador = !podeFiltrarOperador || !filtroOperador ? servicosBase : servicosBase.filter((s) => s.operador === filtroOperador)
    if (!termoBusca) return porOperador
    const norm = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    const q = norm(termoBusca)
    const digitos = termoBusca.replace(/D/g, '')
    return porOperador.filter((s) => {
      const cliente = clientes.find((c) => c.id === s.clienteId)
      const textos = [s.clienteNome, s.endereco, ...(cliente?.enderecos.map((e) => e.endereco) ?? [])]
      if (textos.some((t) => t && norm(t).includes(q))) return true
      // Telefone: compara só os números, ignorando máscara. Precisa de ao menos 3 dígitos.
      return digitos.length >= 3 && !!cliente?.telefone && cliente.telefone.replace(/D/g, '').includes(digitos)
    })
  }, [servicosBase, podeFiltrarOperador, filtroOperador, termoBusca, clientes])

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

  // Inicia o serviço com um toque: grava a hora real de início e registra no histórico do serviço
  // (sem foto — a foto da fachada foi retirada porque enchia o armazenamento do banco).
  async function handleIniciar(s: Servico) {
    if (iniciandoId) return // evita toque duplo
    setIniciandoId(s.id)
    const hora = fmtHora(new Date())
    await updateServico(s.id, { status: 'em_andamento', horaInicioReal: hora })
    // updateServico não devolve erro; se o status não mudou, não deu certo.
    if (getServicoById(s.id)?.status !== 'em_andamento') {
      setIniciandoId(null)
      alert('Não foi possível iniciar o serviço. Verifique a conexão e tente novamente.')
      return
    }
    registrarLog(userEmail ?? 'sistema', 'Serviço iniciado', `${s.tipoServico} — ${s.clienteNome} às ${hora}`)
    await registrarEventoServico(s.id, 'inicio', `Serviço iniciado às ${hora}`, perfil?.nome ?? userEmail ?? 'sistema')
    setIniciandoId(null)
  }

  function handleExcluir(s: Servico) {
    if (!window.confirm(`Excluir permanentemente o serviço de ${s.clienteNome}?`)) return
    removeServico(s.id)
    registrarLog(userEmail ?? 'sistema', 'Serviço excluído', `${s.tipoServico} — ${s.clienteNome}`)
  }

  const podeExcluir = perfil?.role !== 'operador'
  // Justificar atraso: gerente operacional, gerente geral e administrador (não o operador).
  const podeJustificar = perfil?.role !== 'operador'

  function justificativaDoServico(s: Servico) {
    const lista = eventos.filter((e) => e.servicoId === s.id && e.tipo === 'atraso_justificado')
    return lista[lista.length - 1]
  }

  function enderecoDoServico(s: Servico) {
    if (s.endereco) return s.endereco
    return clientes.find((c) => c.id === s.clienteId)?.enderecos[0]?.endereco ?? ''
  }

  // Coordenadas confirmadas no mapa no cadastro do cliente (ver EnderecosEditor), se
  // houver — abrem a rota exata no Google Maps em vez de depender dele adivinhar o
  // endereço só pelo texto, que é o que faz o GPS cair na rua errada quando existem
  // ruas de mesmo nome em bairros diferentes.
  function coordenadasDoServico(s: Servico): { lat: number; lng: number } | null {
    if (s.endereco) {
      return s.enderecoLat != null && s.enderecoLng != null ? { lat: s.enderecoLat, lng: s.enderecoLng } : null
    }
    const primeiro = clientes.find((c) => c.id === s.clienteId)?.enderecos[0]
    return primeiro?.lat != null && primeiro?.lng != null ? { lat: primeiro.lat, lng: primeiro.lng } : null
  }

  function linkRotaServico(s: Servico) {
    const coords = coordenadasDoServico(s)
    const destino = coords ? `${coords.lat},${coords.lng}` : encodeURIComponent(enderecoDoServico(s))
    return `https://www.google.com/maps/dir/?api=1&destination=${destino}`
  }

  function renderAcoes(s: Servico) {
    if (s.status !== 'agendado' && s.status !== 'em_andamento') return null
    const atraso = situacaoDeAtraso(s, eventos, agora)
    const pedeJustificativa = (atraso.atrasadoSemIniciar || atraso.iniciouComAtraso) && !justificativaDoServico(s)
    return (
      <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-1.5 sm:flex-wrap">
        {podeJustificar && pedeJustificativa && (
          <button
            onClick={() => setJustificando({ servico: s, minutos: atraso.minutos })}
            className="inline-flex items-center justify-center gap-1 px-2.5 py-2 sm:py-1 rounded-md text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 border border-rose-700 shadow-sm"
          >
            <AlertTriangle size={13} /> Justificar atraso
          </button>
        )}
        {s.status === 'agendado' && (
          <button
            onClick={() => handleIniciar(s)}
            disabled={iniciandoId === s.id}
            className="inline-flex items-center justify-center gap-1 px-2.5 py-2 sm:py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 disabled:opacity-60"
          >
            {iniciandoId === s.id ? <Loader2 size={13} className="animate-spin" /> : <PlayCircle size={13} />} Iniciar serviço
          </button>
        )}
        <button
          onClick={() => { setSelecionado(s); setModalBaixa(true) }}
          className="inline-flex items-center justify-center gap-1 px-2.5 py-2 sm:py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
        >
          <CheckCircle2 size={13} /> Dar baixa
        </button>
        <button
          onClick={() => { setSelecionado(s); setModalReagendar(true) }}
          className="inline-flex items-center justify-center gap-1 px-2.5 py-2 sm:py-1 rounded-md text-xs font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200"
        >
          <CalendarClock size={13} /> Reagendar
        </button>
        <button
          onClick={() => { setSelecionado(s); setModalEditar(true) }}
          className="inline-flex items-center justify-center gap-1 px-2.5 py-2 sm:py-1 rounded-md text-xs font-semibold bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
        >
          <Pencil size={13} /> Editar
        </button>
        <button
          onClick={() => handleCancelar(s)}
          className="inline-flex items-center justify-center gap-1 px-2.5 py-2 sm:py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
        >
          <XCircle size={13} /> Cancelar
        </button>
        {podeExcluir && (
          <button
            onClick={() => handleExcluir(s)}
            className="inline-flex items-center justify-center gap-1 px-2.5 py-2 sm:py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
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
                {lista.map((s) => {
                  const atraso = situacaoDeAtraso(s, eventos, agora)
                  const inicio = inicioRealDoServico(s, eventos)
                  const justificativa = justificativaDoServico(s)
                  return (
                  <div key={s.id} className={`px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 ${atraso.atrasadoSemIniciar ? 'bg-rose-50/60' : ''}`}>
                    <div className="w-28 shrink-0">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Clock size={14} />
                        {s.horaAgendada}
                      </div>
                      {inicio && (
                        <p className="text-xs font-semibold text-indigo-600 mt-0.5 pl-[22px]">Iniciou {fmtHora(inicio)}</p>
                      )}
                      {atraso.iniciouComAtraso && (
                        <p className="text-[10px] font-bold text-rose-600 pl-[22px]">+{fmtDuracao(atraso.minutos)} de atraso</p>
                      )}
                      {atraso.atrasadoSemIniciar && (
                        <div className="mt-1">
                          <span className="inline-block bg-rose-600 text-white text-[11px] font-extrabold tracking-wider px-2 py-0.5 rounded shadow-sm ring-2 ring-rose-200">
                            ATRASADO
                          </span>
                          <p className="text-[10px] font-semibold text-rose-600 mt-0.5">{fmtDuracao(atraso.minutos)} de atraso</p>
                        </div>
                      )}
                      {justificativa && (
                        <p className="text-[10px] font-medium text-amber-700 mt-0.5 cursor-help" title={`${justificativa.usuario}: ${justificativa.detalhe}`}>
                          Atraso justificado
                        </p>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink-900 truncate">{s.clienteNome}</p>
                      <p className="text-xs text-slate-400 truncate">{s.tipoServico} · {s.operador}</p>
                      <p className="text-xs font-medium text-brand-700 truncate">
                        {FORMA_PAGAMENTO_LABEL[s.formaPagamento]}
                        {s.parcelas ? ` · ${s.parcelas}x` : ''}
                        {s.linkPagamento && <span className="ml-1.5 text-[11px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">Gerar link de pagamento</span>}
                      </p>
                      {enderecoDoServico(s) && (
                        <a
                          href={linkRotaServico(s)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-brand-600 hover:text-brand-700 hover:underline truncate flex items-center gap-1 mt-0.5"
                        >
                          <MapPin size={11} className="shrink-0" /> {enderecoDoServico(s)}
                        </a>
                      )}
                    </div>
                    <ServicoStatusBadge status={s.status} />
                    {renderAcoes(s)}
                  </div>
                  )
                })}
              </div>
            </div>
          )
        })}
        {datas.every((d) => (servicosPorData.get(d) ?? []).length === 0) && (
          <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200">
            {termoBusca
              ? `Nenhum serviço encontrado para "${termoBusca}".`
              : filtroOperador ? `Nenhum serviço de ${filtroOperador} neste período.` : 'Nenhum serviço agendado neste período.'}
          </div>
        )}
      </div>
    )
  }

  const conteudo = useMemo(() => {
    if (termoBusca) {
      // Resultado da busca: todas as datas com serviços do cliente, da mais recente para a mais antiga.
      const datas = [...servicosPorData.keys()].sort((a, b) => (a < b ? 1 : -1))
      return renderLista(datas)
    }
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
  }, [visao, dataRef, servicosPorData, eventos, agora, perfil, iniciandoId, termoBusca])

  const tituloPeriodo = useMemo(() => {
    if (termoBusca) return `Resultados para "${termoBusca}" — ${servicos.length} serviço(s)`
    if (visao === 'dia') return dataRef.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
    if (visao === 'semana') {
      const inicio = startOfWeek(dataRef)
      const fim = addDays(inicio, 6)
      return `${inicio.toLocaleDateString('pt-BR')} — ${fim.toLocaleDateString('pt-BR')}`
    }
    return `${MONTH_LABELS[dataRef.getMonth()]} de ${dataRef.getFullYear()}`
  }, [visao, dataRef, termoBusca, servicos.length])

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Agenda</h1>
          <p className="text-slate-500 text-sm mt-0.5 capitalize">{tituloPeriodo}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start">
          {(googleConectado === false || googleDesconectado) && (
            <button
              onClick={() => perfil && conectarGoogleCalendar(perfil.id)}
              className="hidden sm:inline-flex items-center gap-2 px-3 h-9 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
            >
              <Link2 size={15} />
              Conectar Google Calendar
            </button>
          )}
          {googleConectado === true && !googleDesconectado && (
            <button
              onClick={handleSincronizarGoogle}
              disabled={sincronizando}
              className="hidden sm:inline-flex items-center gap-2 px-3 h-9 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              {sincronizando ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
              Sincronizar com Google Calendar
            </button>
          )}
          {podeFiltrarOperador && (
            <select
              value={filtroOperador}
              onChange={(e) => setFiltroOperador(e.target.value)}
              aria-label="Filtrar por operador"
              className={`h-9 rounded-lg border text-sm px-3 bg-white outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 ${
                filtroOperador ? 'border-brand-400 text-brand-700 font-medium' : 'border-slate-200 text-slate-600'
              }`}
            >
              <option value="">Todos os operadores</option>
              {opcoesOperador.map((nome) => (
                <option key={nome} value={nome}>{nome}</option>
              ))}
            </select>
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

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar cliente por nome, telefone ou endereço..."
          className="w-full h-10 pl-9 pr-9 rounded-lg border border-slate-200 bg-white text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        {busca && (
          <button onClick={() => setBusca('')} aria-label="Limpar busca" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        )}
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
      {justificando && (
        <JustificarAtrasoModal servico={justificando.servico} minutos={justificando.minutos} onClose={() => setJustificando(null)} />
      )}
    </div>
  )
}
