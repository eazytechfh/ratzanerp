import { PlayCircle, AlertTriangle } from 'lucide-react'
import type { Servico } from '../types'
import { useEventosServico } from '../data/servicoEventoStore'

function fmtDataHora(iso: string) {
  const d = new Date(iso)
  return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

// Linha do tempo do serviço: início e justificativas de atraso.
export default function HistoricoServico({ servico }: { servico: Servico }) {
  const todos = useEventosServico()
  const eventos = todos
    .filter((e) => e.servicoId === servico.id)
    .sort((a, b) => (a.criadoEm < b.criadoEm ? -1 : 1))

  const temEventoInicio = eventos.some((e) => e.tipo === 'inicio')
  // Serviço iniciado antes deste histórico existir: só temos a hora guardada no próprio serviço.
  const inicioLegado = !temEventoInicio && servico.horaInicioReal && servico.status !== 'agendado'

  return (
    <div className="pt-4 border-t border-slate-100">
      <h2 className="text-sm font-semibold text-ink-900 mb-3">Histórico do serviço</h2>

      {eventos.length === 0 && !inicioLegado && (
        <p className="text-sm text-slate-400">Nenhum registro ainda. O início do serviço e as justificativas de atraso aparecem aqui.</p>
      )}

      <ol className="space-y-3">
        {inicioLegado && (
          <li className="flex items-start gap-3">
            <span className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <PlayCircle size={15} />
            </span>
            <p className="text-sm text-slate-700 pt-1">Serviço iniciado às {servico.horaInicioReal}</p>
          </li>
        )}

        {eventos.map((e) => (
          <li key={e.id} className="flex items-start gap-3">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                e.tipo === 'inicio' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'
              }`}
            >
              {e.tipo === 'inicio' ? <PlayCircle size={15} /> : <AlertTriangle size={15} />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-400">
                {fmtDataHora(e.criadoEm)}{e.usuario ? ` · ${e.usuario}` : ''}
              </p>
              {e.tipo === 'atraso_justificado' && <p className="text-xs font-semibold text-rose-600">Atraso justificado</p>}
              {/* Registros antigos citam a foto da fachada, que não existe mais — tira o trecho na exibição. */}
              <p className="text-sm text-slate-700 whitespace-pre-wrap">
                {e.detalhe.replace(' (foto da fachada registrada)', '').replace(' (sem foto da fachada)', '')}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
