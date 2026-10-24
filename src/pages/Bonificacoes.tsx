import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Award, ChevronLeft, ChevronRight, PartyPopper, XCircle, Clock3, CheckCircle2, MinusCircle, Info } from 'lucide-react'
import { useServicos } from '../data/servicoStore'
import { useOperadores } from '../data/operadorStore'
import { useEventosServico } from '../data/servicoEventoStore'
import {
  BONUS_SEMANA,
  TABELA_REFORCO,
  calcularBonusOperador,
  participaDaBonificacao,
  type BonusOperador,
  type SemanaBonus,
  type StatusSemana,
} from '../lib/bonificacao'
import { fmtDuracao } from '../lib/atraso'

const MONTH_LABELS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const fmtMoeda = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDia = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

const STATUS_SEMANA: Record<StatusSemana, { label: string; classe: string; icone: React.ElementType }> = {
  elegivel: { label: 'Elegível', classe: 'bg-emerald-50 text-emerald-700 border-emerald-200', icone: CheckCircle2 },
  nao_elegivel: { label: 'Não elegível', classe: 'bg-rose-50 text-rose-700 border-rose-200', icone: XCircle },
  em_andamento: { label: 'Em andamento', classe: 'bg-amber-50 text-amber-700 border-amber-200', icone: Clock3 },
  sem_servico: { label: 'Sem serviços', classe: 'bg-slate-100 text-slate-500 border-slate-200', icone: MinusCircle },
  futura: { label: 'Ainda não começou', classe: 'bg-slate-100 text-slate-400 border-slate-200', icone: MinusCircle },
}

function Banner({ tipo, children }: { tipo: 'ok' | 'nao' | 'neutro'; children: React.ReactNode }) {
  const estilo =
    tipo === 'ok'
      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
      : tipo === 'nao'
        ? 'bg-rose-50 border-rose-200 text-rose-800'
        : 'bg-slate-50 border-slate-200 text-slate-500'
  return (
    <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${estilo}`}>
      {tipo === 'ok' && <PartyPopper size={16} className="shrink-0" />}
      {tipo === 'nao' && <XCircle size={16} className="shrink-0" />}
      {tipo === 'neutro' && <MinusCircle size={16} className="shrink-0" />}
      <span>{children}</span>
    </div>
  )
}

function LinhaSemana({ semana }: { semana: SemanaBonus }) {
  const info = STATUS_SEMANA[semana.status]
  const Icone = info.icone
  return (
    <li className="py-2 border-b border-slate-50 last:border-0">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink-900">
            {fmtDia(semana.segunda)} – {fmtDia(semana.domingo)}
          </p>
          <p className="text-xs text-slate-400">
            {semana.qtdServicos > 0 ? `${semana.qtdServicos} serviço(s)` : 'nenhum serviço'}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border shrink-0 ${info.classe}`}>
          <Icone size={12} /> {info.label}
        </span>
      </div>

      {semana.atrasos.length > 0 && (
        <ul className="mt-2 space-y-1 rounded-lg bg-rose-50/60 border border-rose-100 px-3 py-2">
          {semana.atrasos.map((a) => (
            <li key={a.servico.id} className="text-xs text-rose-800">
              <span className="font-semibold">{a.servico.clienteNome}</span> — {a.servico.tipoServico},{' '}
              {new Date(a.servico.dataAgendada + 'T00:00:00').toLocaleDateString('pt-BR')} às {a.servico.horaAgendada}:{' '}
              {a.iniciou ? `iniciou com ${fmtDuracao(a.minutos)} de atraso` : `ainda não iniciado (${fmtDuracao(a.minutos)} de atraso)`}{' '}
              — <span className="font-semibold">sem justificativa</span>
            </li>
          ))}
          <li className="text-[11px] text-rose-600 pt-1">
            Para liberar a semana, um gestor pode <Link to="/agenda" className="underline font-semibold">justificar o atraso na Agenda</Link>.
          </li>
        </ul>
      )}
    </li>
  )
}

function CartaoOperador({ r }: { r: BonusOperador }) {
  const semServicos = r.qtdServicosMes === 0 && r.semanas.every((s) => s.qtdServicos === 0)
  const semanasComServico = r.semanas.filter((s) => s.status !== 'sem_servico' && s.status !== 'futura')

  // Pontualidade: "Parabéns" se há semana elegível ou ainda dentro da regra; "Não elegível" se não sobrou nenhuma.
  const pontualidadeOk = r.semanasElegiveis + r.semanasEmAndamento > 0
  const pontualidadeNeutra = semanasComServico.length === 0
  const potencial = r.semanasEmAndamento * BONUS_SEMANA

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center font-bold shrink-0">
            {r.operador.nome.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-ink-900 truncate">{r.operador.nome}</p>
            {r.operador.cargo && <p className="text-xs text-slate-400 truncate">{r.operador.cargo}</p>}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">{r.mesEncerrado ? 'Total do mês' : 'Total até agora'}</p>
          <p className="text-xl font-bold text-ink-900">{fmtMoeda(r.total)}</p>
        </div>
      </div>

      {semServicos ? (
        <div className="px-5 py-6">
          <Banner tipo="neutro">Sem serviços neste mês</Banner>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          <div className="p-5 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-ink-900">Pontualidade</h3>
              <p className="text-xs text-slate-400">{fmtMoeda(BONUS_SEMANA)} por semana sem atraso</p>
            </div>
            {pontualidadeNeutra ? (
              <Banner tipo="neutro">Sem semanas com serviço ainda</Banner>
            ) : pontualidadeOk ? (
              <Banner tipo="ok">Parabéns, você tem bonificação este mês</Banner>
            ) : (
              <Banner tipo="nao">Não elegível este mês</Banner>
            )}
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-slate-500">Confirmado</span>
              <span className="font-bold text-ink-900">{fmtMoeda(r.valorPontualidade)}</span>
            </div>
            {potencial > 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                +{fmtMoeda(potencial)} se a semana em andamento terminar sem atraso
              </p>
            )}
            <ul>
              {r.semanas.map((s) => (
                <LinhaSemana key={s.segunda.toISOString()} semana={s} />
              ))}
            </ul>
          </div>

          <div className="p-5 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-ink-900">Reforços do mês</h3>
              <p className="text-xs text-slate-400">Quanto menos reforços, maior a bonificação</p>
            </div>
            {r.valorReforco > 0 ? (
              <Banner tipo="ok">Parabéns, você tem bonificação este mês</Banner>
            ) : (
              <Banner tipo="nao">Não elegível este mês</Banner>
            )}
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-slate-500">
                {r.reforcos.length} reforço(s){!r.mesEncerrado && ' até agora'}
              </span>
              <span className="font-bold text-ink-900">{fmtMoeda(r.valorReforco)}</span>
            </div>
            {!r.mesEncerrado && r.valorReforco > 0 && (
              <p className="text-xs text-slate-400">O valor pode diminuir se houver mais reforços até o fim do mês.</p>
            )}

            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              {TABELA_REFORCO.map((t, i) => (
                <li
                  key={t.qtd}
                  className={`flex justify-between rounded px-2 py-1 ${r.reforcos.length === i ? 'bg-brand-50 text-brand-800 font-semibold' : 'text-slate-500'}`}
                >
                  <span>{t.qtd}</span>
                  <span>{fmtMoeda(t.valor)}</span>
                </li>
              ))}
            </ul>

            {r.reforcos.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">Serviços de reforço</p>
                <ul className="space-y-0.5">
                  {r.reforcos.map((s) => (
                    <li key={s.id} className="text-xs text-slate-600">
                      {new Date(s.dataAgendada + 'T00:00:00').toLocaleDateString('pt-BR')} — {s.clienteNome} ({s.tipoServico})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Bonificacoes() {
  const servicos = useServicos()
  const operadores = useOperadores()
  const eventos = useEventosServico()
  const [mes, setMes] = useState(() => {
    const hoje = new Date()
    return new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  })
  const [agora, setAgora] = useState(() => new Date())

  useEffect(() => {
    const t = setInterval(() => setAgora(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  const mesAtual = new Date(agora.getFullYear(), agora.getMonth(), 1)
  const ehMesAtual = mes.getTime() >= mesAtual.getTime()

  function navegar(delta: number) {
    setMes((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1))
  }

  const resultados = useMemo(
    () =>
      [...operadores]
        .filter((o) => participaDaBonificacao(o.nome))
        .sort((a, b) => a.nome.localeCompare(b.nome))
        .map((o) => calcularBonusOperador(o, servicos, eventos, mes, agora)),
    [operadores, servicos, eventos, mes, agora],
  )

  const totalGeral = resultados.reduce((acc, r) => acc + r.total, 0)
  const comBonus = resultados.filter((r) => r.total > 0).length

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900 flex items-center gap-2">
            <Award size={24} className="text-brand-600" /> Bonificações
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Pontualidade e reforços dos operadores</p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 self-start">
          <button onClick={() => navegar(-1)} className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:bg-white" title="Mês anterior">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-ink-900 px-2 min-w-[140px] text-center">
            {MONTH_LABELS[mes.getMonth()]} de {mes.getFullYear()}
          </span>
          <button
            onClick={() => navegar(1)}
            disabled={ehMesAtual}
            className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent"
            title="Próximo mês"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-4">
          <p className="text-xs text-slate-500">{ehMesAtual ? 'Bonificações até agora' : 'Total de bonificações do mês'}</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{fmtMoeda(totalGeral)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-4">
          <p className="text-xs text-slate-500">Operadores com bonificação</p>
          <p className="text-2xl font-bold text-ink-900 mt-1">
            {comBonus} <span className="text-sm font-normal text-slate-400">de {resultados.length}</span>
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {resultados.map((r) => (
          <CartaoOperador key={r.operador.id} r={r} />
        ))}
        {resultados.length === 0 && (
          <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-200">
            Nenhum operador cadastrado.
          </div>
        )}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500 space-y-1.5">
        <p className="font-semibold text-slate-600 flex items-center gap-1.5"><Info size={13} /> Como funciona</p>
        <p>
          <strong>Pontualidade:</strong> {fmtMoeda(BONUS_SEMANA)} por semana (segunda a domingo, conta no mês em que começa) em que o operador
          não atrasou nenhum serviço. Atraso = passar de 15 minutos do horário agendado. Atraso justificado pelo gestor não conta contra o
          operador; atraso sem justificativa, ou serviço atrasado ainda não iniciado, deixa a semana não elegível. Semana sem serviços não conta.
        </p>
        <p>
          <strong>Reforços:</strong> 0 reforços = R$ 350 · 1 = R$ 300 · 2 = R$ 250 · 3 = R$ 150 · 4 ou mais = R$ 0. Conta o serviço agendado como
          Reforço/Garantia ou marcado como Reforço na baixa (cancelados não contam).
        </p>
        <p>
          Os atrasos são medidos pelo horário em que o serviço foi iniciado no sistema — meses anteriores à entrada desse controle podem estar
          incompletos.
        </p>
      </div>
    </div>
  )
}
