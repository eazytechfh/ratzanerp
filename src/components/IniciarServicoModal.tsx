import React, { useRef, useState } from 'react'
import { X, Camera, PlayCircle, Loader2, RefreshCw } from 'lucide-react'
import type { Servico } from '../types'
import { updateServico, getServicoById } from '../data/servicoStore'
import { registrarEventoServico } from '../data/servicoEventoStore'
import { salvarFotoServico, FOTO_RETENCAO_DIAS } from '../data/fotoServicoStore'
import { registrarLog } from '../data/logStore'
import { useAuth } from '../context/AuthContext'
import { comprimirImagem } from '../lib/imagem'
import { fmtHora } from '../lib/atraso'

interface Props {
  servico: Servico
  onClose: () => void
}

// Ao iniciar o serviço o operador tira a foto da fachada do local (abre a câmera do celular).
// A foto é opcional para não travar o operador sem câmera/sinal — mas a falta dela fica
// registrada no histórico do serviço.
export default function IniciarServicoModal({ servico, onClose }: Props) {
  const { userEmail, perfil } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const [foto, setFoto] = useState<string | null>(null)
  const [processando, setProcessando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  async function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    e.target.value = '' // permite tirar a mesma foto de novo
    if (!arquivo) return
    setErro('')
    setProcessando(true)
    try {
      setFoto(await comprimirImagem(arquivo))
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível usar essa foto.')
    } finally {
      setProcessando(false)
    }
  }

  async function handleIniciar() {
    setSalvando(true)
    const quem = perfil?.nome ?? userEmail ?? 'sistema'
    const hora = fmtHora(new Date())

    await updateServico(servico.id, { status: 'em_andamento', horaInicioReal: hora })
    // updateServico não devolve erro; se o serviço não mudou de status, não deu certo.
    if (getServicoById(servico.id)?.status !== 'em_andamento') {
      setSalvando(false)
      setErro('Não foi possível iniciar o serviço. Tente novamente.')
      return
    }

    registrarLog(userEmail ?? 'sistema', 'Serviço iniciado', `${servico.tipoServico} — ${servico.clienteNome} às ${hora}`)
    await registrarEventoServico(
      servico.id,
      'inicio',
      foto ? `Serviço iniciado às ${hora} (foto da fachada registrada)` : `Serviço iniciado às ${hora} (sem foto da fachada)`,
      quem,
    )

    if (foto) {
      const r = await salvarFotoServico(servico.id, foto)
      if (r.error) alert('O serviço foi iniciado, mas não deu para salvar a foto da fachada. Tente tirar a foto novamente depois.')
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={salvando ? undefined : onClose} />
      <div className="relative bg-white rounded-2xl shadow-soft w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-ink-900 flex items-center gap-2">
            <PlayCircle size={18} className="text-indigo-600" />
            Iniciar serviço
          </h2>
          <button onClick={onClose} disabled={salvando} className="text-slate-400 hover:text-slate-600 disabled:opacity-40">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <p className="font-medium text-ink-900">{servico.clienteNome}</p>
            <p className="text-sm text-slate-500">{servico.tipoServico}</p>
            {servico.endereco && <p className="text-xs text-slate-400 mt-0.5">{servico.endereco}</p>}
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-1.5">Foto da fachada do local</p>
            {/* capture="environment" abre direto a câmera traseira no celular */}
            <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={handleArquivo} className="hidden" />

            {foto ? (
              <div className="space-y-2">
                <img src={foto} alt="Fachada do local" className="w-full rounded-lg border border-slate-200 max-h-64 object-cover" />
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={processando || salvando}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50"
                >
                  <RefreshCw size={13} /> Tirar outra foto
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={processando || salvando}
                className="w-full flex flex-col items-center justify-center gap-2 py-8 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50/40 transition disabled:opacity-60"
              >
                {processando ? <Loader2 size={26} className="animate-spin" /> : <Camera size={26} />}
                <span className="text-sm font-semibold">{processando ? 'Preparando foto...' : 'Tirar foto da fachada'}</span>
              </button>
            )}

            <p className="text-xs text-slate-400 mt-2">
              A foto fica guardada no histórico do serviço por {FOTO_RETENCAO_DIAS} dias.
            </p>
            {!foto && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                Você pode iniciar sem a foto, mas isso fica registrado no histórico do serviço.
              </p>
            )}
            {erro && <p className="text-xs text-rose-600 mt-2">{erro}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={salvando}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleIniciar}
              disabled={salvando || processando}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold shadow-card disabled:opacity-60 ${
                foto ? 'text-white bg-indigo-600 hover:bg-indigo-700' : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200'
              }`}
            >
              {salvando && <Loader2 size={15} className="animate-spin" />}
              {foto ? 'Iniciar serviço' : 'Iniciar sem foto'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
