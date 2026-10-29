import React, { useMemo, useRef, useState } from 'react'
import { X, Mail, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { useServicos } from '../data/servicoStore'
import { useClientes } from '../data/clienteStore'
import { useLogs, registrarLog } from '../data/logStore'
import { useAuth } from '../context/AuthContext'
import { enviarDocumentosPorEmail, ehVisita } from '../lib/enviarDocumentos'

interface Props {
  onClose: () => void
}

type Resultado = { servicoId: string; nome: string; ok: boolean; texto: string }

const ACOES_ENVIO_OK = ['OS/Certificado enviados por e-mail', 'OS/Certificado reenviados por e-mail']

const fmtData = (iso: string) => new Date(iso.slice(0, 10) + 'T00:00:00').toLocaleDateString('pt-BR')

// Reenvio da OS e do Certificado de vários serviços concluídos de uma vez (a partir de uma data).
// Visitas ficam de fora. Vêm desmarcados: quem já tem envio bem-sucedido no Log desde a data escolhida
// e e-mails internos da Ratzan (@ratzan.com.br).
export default function ReenvioEmLoteModal({ onClose }: Props) {
  const servicos = useServicos()
  const clientes = useClientes()
  const logs = useLogs()
  const { perfil, userEmail } = useAuth()
  const [desde, setDesde] = useState('2026-10-17')
  const [desmarcados, setDesmarcados] = useState<Set<string>>(new Set())
  const [marcadosExtra, setMarcadosExtra] = useState<Set<string>>(new Set())
  const [enviando, setEnviando] = useState(false)
  const [progresso, setProgresso] = useState<{ atual: number; total: number; nome: string } | null>(null)
  const [resultados, setResultados] = useState<Resultado[]>([])
  const parar = useRef(false)

  const itens = useMemo(() => {
    const dataDe = (s: (typeof servicos)[number]) => s.baixa?.dataServico ?? s.dataAgendada
    return servicos
      .filter((s) => s.status === 'concluido' && !!s.baixa && !ehVisita(s) && dataDe(s) >= desde)
      .sort((a, b) => (dataDe(a) < dataDe(b) ? -1 : 1))
      .map((s) => {
        const cliente = clientes.find((c) => c.id === s.clienteId)
        const email = cliente?.email?.trim() ?? ''
        // Já houve envio com sucesso para este cliente desde a data? (o Log guarda "Cliente — e-mail")
        const jaEnviado = logs.find(
          (l) => ACOES_ENVIO_OK.includes(l.acao) && l.data.slice(0, 10) >= desde && l.detalhes.startsWith(`${s.clienteNome} — `),
        )
        // Casos que não devem receber por padrão (podem ser marcados manualmente): já enviado, e-mail
        // interno da Ratzan (cadastro de teste/sem e-mail real do cliente) e visitas.
        const interno = email.toLowerCase().endsWith('@ratzan.com.br')
        const motivoDesmarcado = jaEnviado
          ? `E-mail já enviado em ${fmtData(jaEnviado.data)} (veja o Log) — desmarcado para não duplicar`
          : interno
            ? 'E-mail interno da Ratzan (sem e-mail real do cliente ou cadastro de teste) — desmarcado'
            : null
        return { servico: s, cliente, email, data: dataDe(s), motivoDesmarcado }
      })
  }, [servicos, clientes, logs, desde])

  // Marcado por padrão: tem e-mail e ainda não tem envio registrado.
  const marcado = (it: (typeof itens)[number]) => {
    if (!it.email) return false
    if (it.motivoDesmarcado) return marcadosExtra.has(it.servico.id)
    return !desmarcados.has(it.servico.id)
  }
  const alternar = (it: (typeof itens)[number]) => {
    if (it.motivoDesmarcado) {
      setMarcadosExtra((p) => { const n = new Set(p); n.has(it.servico.id) ? n.delete(it.servico.id) : n.add(it.servico.id); return n })
    } else {
      setDesmarcados((p) => { const n = new Set(p); n.has(it.servico.id) ? n.delete(it.servico.id) : n.add(it.servico.id); return n })
    }
  }

  const selecionados = itens.filter(marcado)
  const semEmail = itens.filter((i) => !i.email).length

  async function enviar() {
    if (selecionados.length === 0 || enviando) return
    if (!window.confirm(`Enviar a OS e o Certificado por e-mail para ${selecionados.length} cliente(s)? Os e-mails serão enviados de verdade.`)) return
    setEnviando(true)
    parar.current = false
    setResultados([])
    const quem = perfil?.nome ?? userEmail ?? 'sistema'
    const fila = [...selecionados]
    for (let i = 0; i < fila.length; i++) {
      if (parar.current) break
      const it = fila[i]
      setProgresso({ atual: i + 1, total: fila.length, nome: it.servico.clienteNome })
      let r: Resultado
      try {
        const res = await enviarDocumentosPorEmail(it.servico, it.cliente!, it.email)
        if (res?.error) {
          registrarLog(quem, 'Falha ao reenviar e-mail ao cliente', `${it.servico.clienteNome}: ${res.error}`)
          r = { servicoId: it.servico.id, nome: it.servico.clienteNome, ok: false, texto: res.error }
        } else {
          registrarLog(quem, 'OS/Certificado reenviados por e-mail', `${it.servico.clienteNome} — ${it.email}`)
          r = { servicoId: it.servico.id, nome: it.servico.clienteNome, ok: true, texto: it.email }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        registrarLog(quem, 'Falha ao gerar documentos do e-mail', `${it.servico.clienteNome}: ${msg}`)
        r = { servicoId: it.servico.id, nome: it.servico.clienteNome, ok: false, texto: msg }
      }
      setResultados((prev) => [...prev, r])
      // Pausa curta entre envios para não sobrecarregar o provedor de e-mail.
      await new Promise((resolve) => setTimeout(resolve, 700))
    }
    setProgresso(null)
    setEnviando(false)
  }

  const concluido = !enviando && resultados.length > 0
  const okCount = resultados.filter((r) => r.ok).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={() => !enviando && onClose()} />
      <div className="relative bg-white rounded-2xl shadow-soft w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-ink-900 flex items-center gap-2">
            <Mail size={18} className="text-brand-600" />
            Reenviar OS e Certificado em lote
          </h2>
          <button onClick={onClose} disabled={enviando} className="text-slate-400 hover:text-slate-600 disabled:opacity-40">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Serviços concluídos a partir de</label>
              <input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                disabled={enviando}
                className="px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
              />
            </div>
            <p className="text-sm text-slate-500 pb-2">
              {itens.length} serviço(s) · <strong className="text-ink-900">{selecionados.length}</strong> selecionado(s)
              {semEmail > 0 && ` · ${semEmail} sem e-mail cadastrado`}
            </p>
          </div>

          <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {itens.length === 0 && <p className="p-4 text-sm text-slate-400">Nenhum serviço concluído a partir dessa data.</p>}
            {itens.map((it) => (
              <label key={it.servico.id} className={`flex items-start gap-3 px-3 py-2.5 text-sm ${!it.email ? 'opacity-60' : 'cursor-pointer hover:bg-slate-50'}`}>
                <input
                  type="checkbox"
                  checked={marcado(it)}
                  disabled={!it.email || enviando}
                  onChange={() => alternar(it)}
                  className="mt-1 rounded border-slate-300 text-brand-600 focus:ring-brand-200"
                />
                <span className="flex-1 min-w-0">
                  <span className="block font-medium text-ink-900 truncate">{it.servico.clienteNome}</span>
                  <span className="block text-xs text-slate-500 truncate">
                    {it.servico.tipoServico} · {fmtData(it.data)} · {it.email || 'sem e-mail cadastrado'}
                  </span>
                  {it.motivoDesmarcado && <span className="block text-xs text-amber-600">{it.motivoDesmarcado}</span>}
                </span>
              </label>
            ))}
          </div>

          {progresso && (
            <p className="flex items-center gap-2 text-sm text-slate-600">
              <Loader2 size={16} className="animate-spin" />
              Enviando {progresso.atual} de {progresso.total}: {progresso.nome}
            </p>
          )}

          {resultados.length > 0 && (
            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-48 overflow-y-auto">
              {resultados.map((r) => (
                <p key={r.servicoId} className={`flex items-start gap-2 px-3 py-2 text-xs ${r.ok ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {r.ok ? <CheckCircle2 size={14} className="shrink-0 mt-0.5" /> : <XCircle size={14} className="shrink-0 mt-0.5" />}
                  <span><strong>{r.nome}</strong> — {r.ok ? `enviado para ${r.texto}` : `falhou: ${r.texto}`}</span>
                </p>
              ))}
            </div>
          )}
          {concluido && (
            <p className="text-sm font-medium text-ink-900">
              Concluído: {okCount} enviado(s){resultados.length - okCount > 0 ? `, ${resultados.length - okCount} com falha (veja o Log)` : ''}.
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            {enviando ? (
              <button onClick={() => { parar.current = true }} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Parar após o atual
              </button>
            ) : (
              <>
                <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                  {concluido ? 'Fechar' : 'Cancelar'}
                </button>
                <button
                  onClick={enviar}
                  disabled={selecionados.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold disabled:opacity-50"
                >
                  <Mail size={16} />
                  Enviar para {selecionados.length} cliente(s)
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
