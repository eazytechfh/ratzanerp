import { useEffect, useState } from 'react'
import { PlayCircle, AlertTriangle, Camera, X } from 'lucide-react'
import type { Servico } from '../types'
import { useEventosServico } from '../data/servicoEventoStore'
import { buscarFotoServico, fotoExpiraEm, FOTO_RETENCAO_DIAS, type FotoServico } from '../data/fotoServicoStore'

function fmtDataHora(iso: string) {
  const d = new Date(iso)
  return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

// Linha do tempo do serviço: início (com a foto da fachada, guardada só por 7 dias) e
// justificativas de atraso. A foto expira; o restante do histórico fica.
export default function HistoricoServico({ servico }: { servico: Servico }) {
  const todos = useEventosServico()
  const eventos = todos
    .filter((e) => e.servicoId === servico.id)
    .sort((a, b) => (a.criadoEm < b.criadoEm ? -1 : 1))
  const [foto, setFoto] = useState<FotoServico | null>(null)
  const [ampliada, setAmpliada] = useState(false)

  useEffect(() => {
    let cancelado = false
    buscarFotoServico(servico.id).then((f) => {
      if (!cancelado) setFoto(f)
    })
    return () => {
      cancelado = true
    }
  }, [servico.id])

  const temEventoInicio = eventos.some((e) => e.tipo === 'inicio')
  // Serviço iniciado antes deste histórico existir: só temos a hora guardada no próprio serviço.
  const inicioLegado = !temEventoInicio && servico.horaInicioReal && servico.status !== 'agendado'
  const ultimoInicio = [...eventos].reverse().find((e) => e.tipo === 'inicio')
  const esperavaFoto = !!ultimoInicio && ultimoInicio.detalhe.includes('foto da fachada registrada')

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
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{e.detalhe}</p>
            </div>
          </li>
        ))}
      </ol>

      {foto ? (
        <div className="mt-4">
          <p className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1.5">
            <Camera size={13} /> Foto da fachada ao iniciar — disponível até {fotoExpiraEm(foto.criadaEm).toLocaleDateString('pt-BR')}
          </p>
          <button type="button" onClick={() => setAmpliada(true)} className="block">
            <img src={foto.imagem} alt="Fachada do local" className="h-32 rounded-lg border border-slate-200 object-cover hover:opacity-90 transition" />
          </button>
        </div>
      ) : (
        esperavaFoto && (
          <p className="mt-4 text-xs text-slate-400 flex items-center gap-1.5">
            <Camera size={13} /> A foto da fachada expirou (ficam guardadas por {FOTO_RETENCAO_DIAS} dias).
          </p>
        )
      )}

      {ampliada && foto && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setAmpliada(false)}>
          <button className="absolute top-4 right-4 text-white/80 hover:text-white" onClick={() => setAmpliada(false)}>
            <X size={28} />
          </button>
          <img src={foto.imagem} alt="Fachada do local" className="max-h-full max-w-full rounded-lg" />
        </div>
      )}
    </div>
  )
}
