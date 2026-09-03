import React, { useState } from 'react'
import { X, CheckCircle2, ShieldAlert } from 'lucide-react'
import type { Servico, TipoAplicacao } from '../types'
import { useTiposPraga } from '../data/tipoPragaStore'
import { updateServico } from '../data/servicoStore'
import { dispararWebhookConclusao } from '../data/webhooks'
import { registrarLog } from '../data/logStore'
import { useAuth } from '../context/AuthContext'
import { useClientes } from '../data/clienteStore'
import { addContaPagar } from '../data/contaPagarStore'
import { TAXAS_MAQUININHA, MAQUININHAS } from '../types'
import { componentToPdfBase64 } from '../lib/componentToPdf'
import { montarEmailOsCertificado } from '../lib/emailTemplates'
import { enviarEmailCliente } from '../data/emailClient'
import OrdemServicoDoc from './documentos/OrdemServicoDoc'
import CertificadoGarantiaDoc from './documentos/CertificadoGarantiaDoc'
import SignaturePad from './SignaturePad'

interface Props {
  servico: Servico
  onClose: () => void
}

function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

async function enviarDocumentosPorEmail(servico: Servico, cliente: ReturnType<typeof useClientes>[number]) {
  if (!cliente?.email) return

  const anexos: { nome: string; base64: string }[] = []

  const osBase64 = await componentToPdfBase64(<OrdemServicoDoc servico={servico} cliente={cliente} />)
  anexos.push({ nome: `OS-${servico.clienteNome}.pdf`, base64: osBase64 })

  const certBase64 = await componentToPdfBase64(<CertificadoGarantiaDoc servico={servico} cliente={cliente} />)
  anexos.push({ nome: `Certificado-Garantia-${servico.clienteNome}.pdf`, base64: certBase64 })

  return enviarEmailCliente({
    clienteEmail: cliente.email,
    clienteNome: cliente.nome,
    assunto: `Ordem de Serviço — ${servico.tipoServico} — Ratzan`,
    mensagemHtml: montarEmailOsCertificado(cliente.nome),
    anexos,
  })
}

export default function DarBaixaModal({ servico, onClose }: Props) {
  const { userEmail } = useAuth()
  const clientes = useClientes()
  const tiposPraga = useTiposPraga()
  const [dataServico, setDataServico] = useState(fmtDate(new Date()))
  const [garantiaAte, setGarantiaAte] = useState(servico.garantiaAte ?? '')
  const [horaInicio, setHoraInicio] = useState(servico.horaAgendada)
  const [horaFim, setHoraFim] = useState('')
  const [pragas, setPragas] = useState<string[]>(servico.pragas ?? [])
  const [aplicacao, setAplicacao] = useState<TipoAplicacao>('aplicacao')
  const [cipergranMl, setCipergranMl] = useState('')
  const [ddvpMl, setDdvpMl] = useState('')
  const [cropnilMl, setCropnilMl] = useState('')
  const [portaIscaQtd, setPortaIscaQtd] = useState('')
  const [raticidaQtd, setRaticidaQtd] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [assinaturaCliente, setAssinaturaCliente] = useState('')
  const [emitirCertificado, setEmitirCertificado] = useState(true)
  const [recusouAplicacaoVeneno, setRecusouAplicacaoVeneno] = useState(false)
  const [assinaturaTermoCiencia, setAssinaturaTermoCiencia] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function togglePraga(p: string) {
    setPragas((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }

  function validate() {
    const errs: Record<string, string> = {}
    if (!dataServico) errs.dataServico = 'Informe a data'
    if (!horaInicio) errs.horaInicio = 'Informe o horário de início'
    if (!horaFim) errs.horaFim = 'Informe o horário de fim'
    if (!assinaturaCliente) errs.assinaturaCliente = 'Assinatura do cliente é obrigatória'
    if (recusouAplicacaoVeneno && !assinaturaTermoCiencia) {
      errs.assinaturaTermoCiencia = 'Assinatura do termo de ciência é obrigatória quando há recusa'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleConcluir(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const atualizado: Servico = {
      ...servico,
      status: 'concluido',
      pragas,
      baixa: {
        dataServico,
        garantiaAte: garantiaAte || undefined,
        horaInicio,
        horaFim,
        pragas,
        aplicacao,
        cipergranMl: cipergranMl ? Number(cipergranMl) : undefined,
        ddvpMl: ddvpMl ? Number(ddvpMl) : undefined,
        cropnilMl: cropnilMl ? Number(cropnilMl) : undefined,
        portaIscaQtd: portaIscaQtd ? Number(portaIscaQtd) : undefined,
        raticidaQtd: raticidaQtd ? Number(raticidaQtd) : undefined,
        observacoes,
        assinaturaCliente,
        emitirCertificado,
        recusouAplicacaoVeneno,
        assinaturaTermoCiencia: recusouAplicacaoVeneno ? assinaturaTermoCiencia : undefined,
      },
    }

    updateServico(servico.id, atualizado)
    dispararWebhookConclusao(atualizado)
    registrarLog(userEmail ?? 'sistema', 'Baixa dada em serviço', `${servico.tipoServico} — ${servico.clienteNome}`)

    if (
      (servico.formaPagamento === 'credito' || servico.formaPagamento === 'debito') &&
      servico.maquininha &&
      servico.valor > 0
    ) {
      const taxas = TAXAS_MAQUININHA[servico.maquininha]
      const percentual = servico.formaPagamento === 'debito' ? taxas.debito : taxas.credito(servico.parcelas ?? 1)
      const taxaValor = Math.round(servico.valor * percentual * 100) / 100
      const maquininhaLabel = MAQUININHAS.find((m) => m.value === servico.maquininha)?.label ?? servico.maquininha
      addContaPagar({
        id: `cp-taxa-${servico.id}`,
        descricao: `Taxa maquininha ${maquininhaLabel} — ${servico.clienteNome}`,
        categoria: 'Taxas de Cartão',
        valor: taxaValor,
        vencimento: dataServico,
        status: 'pendente',
      })
      registrarLog(userEmail ?? 'sistema', 'Taxa de cartão lançada', `${maquininhaLabel} — ${servico.clienteNome} — ${taxaValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`)
    }

    const cliente = clientes.find((c) => c.id === servico.clienteId)
    onClose()

    if (cliente?.email) {
      enviarDocumentosPorEmail(atualizado, cliente)
        .then((res) => {
          if (res?.error) {
            console.error('Falha ao enviar e-mail ao cliente:', res.error)
            registrarLog(userEmail ?? 'sistema', 'Falha ao enviar e-mail ao cliente', `${servico.clienteNome}: ${res.error}`)
          } else {
            registrarLog(userEmail ?? 'sistema', 'OS/Certificado enviados por e-mail', `${servico.clienteNome} — ${cliente.email}`)
          }
        })
        .catch((err) => console.error('Falha ao gerar/enviar documentos por e-mail:', err))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-soft w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-ink-900 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
            Dar baixa — {servico.clienteNome}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleConcluir} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Data do serviço</label>
              <input
                type="date"
                value={dataServico}
                onChange={(e) => setDataServico(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
              />
              {errors.dataServico && <p className="text-xs text-rose-600 mt-1">{errors.dataServico}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Garantia até</label>
              <input
                type="date"
                value={garantiaAte}
                onChange={(e) => setGarantiaAte(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Horário início</label>
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
              />
              {errors.horaInicio && <p className="text-xs text-rose-600 mt-1">{errors.horaInicio}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Horário fim</label>
              <input
                type="time"
                value={horaFim}
                onChange={(e) => setHoraFim(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
              />
              {errors.horaFim && <p className="text-xs text-rose-600 mt-1">{errors.horaFim}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Pragas</label>
            <div className="grid grid-cols-2 gap-2">
              {tiposPraga.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-sm text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1.5">
                  <input
                    type="checkbox"
                    checked={pragas.includes(p.nome)}
                    onChange={() => togglePraga(p.nome)}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-200"
                  />
                  {p.nome}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Aplicação</label>
            <div className="flex gap-2">
              {(['aplicacao', 'reforco'] as TipoAplicacao[]).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAplicacao(a)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition ${
                    aplicacao === a
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {a === 'aplicacao' ? 'Aplicação' : 'Reforço'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Veneno / Insumos</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Cipergran (Ml)</label>
                <input type="number" min="0" value={cipergranMl} onChange={(e) => setCipergranMl(e.target.value)} className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-sm outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">DDVP (Ml)</label>
                <input type="number" min="0" value={ddvpMl} onChange={(e) => setDdvpMl(e.target.value)} className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-sm outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Cropnil (Ml)</label>
                <input type="number" min="0" value={cropnilMl} onChange={(e) => setCropnilMl(e.target.value)} className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-sm outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Porta Isca (qtd)</label>
                <input type="number" min="0" value={portaIscaQtd} onChange={(e) => setPortaIscaQtd(e.target.value)} className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-sm outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Raticida (qtd)</label>
                <input type="number" min="0" value={raticidaQtd} onChange={(e) => setRaticidaQtd(e.target.value)} className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-sm outline-none focus:border-brand-500" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Observações</label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Assinatura do cliente</label>
            <SignaturePad value={assinaturaCliente} onChange={setAssinaturaCliente} error={errors.assinaturaCliente} />
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 space-y-3">
            <label className="flex items-start gap-2 text-sm text-amber-900 font-medium">
              <input
                type="checkbox"
                checked={recusouAplicacaoVeneno}
                onChange={(e) => setRecusouAplicacaoVeneno(e.target.checked)}
                className="mt-0.5 rounded border-amber-300 text-brand-600 focus:ring-brand-200"
              />
              <span className="flex items-center gap-1.5">
                <ShieldAlert size={15} className="shrink-0" />
                Cliente se recusou à aplicação do veneno
              </span>
            </label>
            {recusouAplicacaoVeneno && (
              <div>
                <p className="text-xs text-amber-800 mb-2">
                  TERMO DE CIÊNCIA E RESPONSABILIDADE SOBRE MÉTODO DE EXECUÇÃO DE SERVIÇO — o cliente declara estar ciente de que a
                  recusa ao método padrão de aplicação pode comprometer a eficácia do serviço, isentando a Ratzan de responsabilidade
                  sobre o resultado. O cliente deve assinar abaixo para confirmar ciência.
                </p>
                <label className="block text-xs font-medium text-amber-900 mb-1.5">Assinatura do termo de ciência</label>
                <SignaturePad value={assinaturaTermoCiencia} onChange={setAssinaturaTermoCiencia} error={errors.assinaturaTermoCiencia} />
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={emitirCertificado}
              onChange={(e) => setEmitirCertificado(e.target.checked)}
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-200"
            />
            Emitir certificado de garantia
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-card"
            >
              Concluir
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
