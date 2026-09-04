import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, FileText, ShieldCheck, Info, Printer, Lock, Megaphone } from 'lucide-react'
import { useServicos } from '../data/servicoStore'
import { useClientes } from '../data/clienteStore'
import { ServicoStatusBadge } from '../components/StatusBadge'
import OrdemServicoDoc from '../components/documentos/OrdemServicoDoc'
import CertificadoGarantiaDoc from '../components/documentos/CertificadoGarantiaDoc'
import AvisoDoc from '../components/documentos/AvisoDoc'

type Aba = 'detalhes' | 'os' | 'certificado' | 'aviso'

const FORMA_LABEL: Record<string, string> = {
  pix: 'Pix',
  transferencia: 'Transferência',
  debito: 'Débito',
  credito: 'Crédito',
  boleto_pj: 'Boleto PJ',
  garantia: 'Garantia',
  dinheiro: 'Dinheiro',
}

export default function ServicoDetalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const servicos = useServicos()
  const clientes = useClientes()
  const servico = servicos.find((s) => s.id === id)
  const cliente = clientes.find((c) => c.id === servico?.clienteId)
  const [aba, setAba] = useState<Aba>('detalhes')

  if (!servico) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500 mb-4">Serviço não encontrado.</p>
        <Link to="/servicos" className="text-brand-600 font-medium">Voltar para serviços</Link>
      </div>
    )
  }

  const documentosLiberados = servico.status === 'concluido' && !!servico.baixa

  const ABAS: { key: Aba; label: string; icon: React.ElementType; bloqueada?: boolean }[] = [
    { key: 'detalhes', label: 'Detalhes', icon: Info },
    { key: 'os', label: 'Ordem de Serviço', icon: FileText, bloqueada: !documentosLiberados },
    { key: 'certificado', label: 'Certificado de Garantia', icon: ShieldCheck, bloqueada: !documentosLiberados },
    { key: 'aviso', label: 'Gerar arte do aviso', icon: Megaphone },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate('/servicos')}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-ink-900 transition"
        >
          <ArrowLeft size={16} />
          Voltar para serviços
        </button>
        {aba !== 'detalhes' && (aba === 'aviso' || documentosLiberados) && (
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-ink-900 text-sm font-semibold px-4 py-2 rounded-lg shadow-card transition"
          >
            <Printer size={16} />
            Imprimir / Salvar PDF
          </button>
        )}
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 print:hidden">
        {ABAS.map((a) => (
          <button
            key={a.key}
            onClick={() => !a.bloqueada && setAba(a.key)}
            disabled={a.bloqueada}
            title={a.bloqueada ? 'Disponível somente após dar baixa no serviço' : undefined}
            className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-t-lg text-sm font-medium transition border-b-2 ${
              aba === a.key ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-ink-900'
            } ${a.bloqueada ? 'opacity-50 cursor-not-allowed hover:text-slate-500' : ''}`}
          >
            <a.icon size={16} />
            {a.label}
            {a.bloqueada && <Lock size={12} />}
          </button>
        ))}
      </div>

      {aba === 'detalhes' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6 space-y-5 max-w-3xl">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold text-ink-900">{servico.tipoServico}</h1>
              <p className="text-sm text-slate-500">{servico.clienteNome}</p>
            </div>
            <ServicoStatusBadge status={servico.status} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-sm">
            <div><p className="text-xs text-slate-400">Data / Hora</p><p className="text-slate-700">{new Date(servico.dataAgendada + 'T00:00:00').toLocaleDateString('pt-BR')} · {servico.horaAgendada}</p></div>
            <div><p className="text-xs text-slate-400">Operador</p><p className="text-slate-700">{servico.operador}</p></div>
            <div><p className="text-xs text-slate-400">Endereço</p><p className="text-slate-700">{servico.endereco || '-'}</p></div>
            <div><p className="text-xs text-slate-400">Valor</p><p className="text-slate-700">{servico.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></div>
            <div><p className="text-xs text-slate-400">Forma de pagamento</p><p className="text-slate-700">{FORMA_LABEL[servico.formaPagamento]}{servico.parcelas ? ` · ${servico.parcelas}x` : ''}</p></div>
            <div><p className="text-xs text-slate-400">Tipo de atendimento</p><p className="text-slate-700">{servico.tipoAtendimento === 'reforco' ? 'Reforço/Garantia' : servico.tipoAtendimento === 'visita' ? 'Visita' : 'Novo'}</p></div>
            <div className="sm:col-span-2"><p className="text-xs text-slate-400">Pragas</p><p className="text-slate-700">{servico.pragas.length > 0 ? servico.pragas.join(', ') : '-'}</p></div>
            {servico.observacoes && (
              <div className="sm:col-span-2"><p className="text-xs text-slate-400">Observações</p><p className="text-slate-700">{servico.observacoes}</p></div>
            )}
          </div>

          {servico.baixa && (
            <div className="pt-4 border-t border-slate-100">
              <h2 className="text-sm font-semibold text-ink-900 mb-3">Dados da baixa</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div><p className="text-xs text-slate-400">Horário</p><p className="text-slate-700">{servico.baixa.horaInicio} - {servico.baixa.horaFim}</p></div>
                <div><p className="text-xs text-slate-400">Garantia até</p><p className="text-slate-700">{servico.baixa.garantiaAte ? new Date(servico.baixa.garantiaAte + 'T00:00:00').toLocaleDateString('pt-BR') : '-'}</p></div>
                <div><p className="text-xs text-slate-400">Aplicação</p><p className="text-slate-700">{servico.baixa.aplicacao === 'reforco' ? 'Reforço' : 'Aplicação'}</p></div>
                <div><p className="text-xs text-slate-400">Recusou aplicação do veneno</p><p className="text-slate-700">{servico.baixa.recusouAplicacaoVeneno ? 'Sim (termo de ciência assinado)' : 'Não'}</p></div>
                <div className="sm:col-span-2">
                  <p className="text-xs text-slate-400">Insumos</p>
                  <p className="text-slate-700">
                    {[
                      servico.baixa.cipergranMl ? `Cipergran ${servico.baixa.cipergranMl}Ml` : null,
                      servico.baixa.ddvpMl ? `DDVP ${servico.baixa.ddvpMl}Ml` : null,
                      servico.baixa.cropnilMl ? `Cropnil ${servico.baixa.cropnilMl}Ml` : null,
                      servico.baixa.portaIscaQtd ? `Porta Isca ${servico.baixa.portaIscaQtd}` : null,
                      servico.baixa.raticidaQtd ? `Raticida ${servico.baixa.raticidaQtd}` : null,
                    ].filter(Boolean).join(' · ') || '-'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {(aba === 'os' || aba === 'certificado') && !documentosLiberados && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-10 max-w-3xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <Lock size={24} />
          </div>
          <h2 className="text-lg font-semibold text-ink-900 mb-1.5">Documento ainda não disponível</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            A Ordem de Serviço e o Certificado de Garantia só são emitidos depois que o serviço é concluído
            (dar baixa na Agenda), pois dependem dos dados preenchidos no momento do atendimento.
          </p>
        </div>
      )}

      {aba === 'os' && documentosLiberados && <OrdemServicoDoc servico={servico} cliente={cliente} />}
      {aba === 'certificado' && documentosLiberados && <CertificadoGarantiaDoc servico={servico} cliente={cliente} />}
      {aba === 'aviso' && <AvisoDoc servico={servico} />}
    </div>
  )
}
