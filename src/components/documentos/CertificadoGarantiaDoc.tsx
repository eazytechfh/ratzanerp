import React from 'react'
import { Check } from 'lucide-react'
import { CertificadoHeader } from './RatzanHeader'
import type { Cliente, Servico } from '../../types'

interface Props {
  servico: Servico
  cliente?: Cliente
}

function fmtData(dataStr?: string) {
  if (!dataStr) return '-'
  return new Date(dataStr + 'T00:00:00').toLocaleDateString('pt-BR')
}

function Campo({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="mb-3">
      <p className="text-xs font-bold text-ink-900">{label}</p>
      <p className="text-sm text-slate-700 mt-0.5">{value}</p>
    </div>
  )
}

function ChecklistLinha({ label, itens }: { label: string; itens: string[] }) {
  return (
    <div className="mb-3">
      <p className="text-xs font-bold text-ink-900 mb-1">{label}</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {itens.map((item) => (
          <span key={item} className="inline-flex items-center gap-1 text-sm text-slate-700">
            <span className="w-4 h-4 rounded-sm bg-brand-600 text-white flex items-center justify-center shrink-0">
              <Check size={12} />
            </span>
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function CertificadoGarantiaDoc({ servico, cliente }: Props) {
  const baixa = servico.baixa
  const dataServico = baixa?.dataServico ?? servico.dataAgendada
  const garantiaAte = baixa?.garantiaAte
  const horaInicio = baixa?.horaInicio ?? servico.horaAgendada
  const horaFim = baixa?.horaFim
  const pragas = (baixa?.pragas ?? servico.pragas)

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 space-y-4 max-w-3xl mx-auto print:rounded-none print:border-0 print:shadow-none print:max-w-none print:mx-0">
      <CertificadoHeader />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
        <div>
          <Campo label="Nome do Cliente ou Estabelecimento:" value={servico.clienteNome} />
          <Campo label="Endereço do Serviço:" value={servico.endereco || '-'} />
          <Campo label="Bairro:" value={cliente?.bairro ?? '-'} />
          <ChecklistLinha label="Serviço Contratado:" itens={[servico.tipoServico]} />
        </div>
        <div>
          <Campo label="Data do Serviço:" value={fmtData(dataServico)} />
          <Campo label="Garantia do Serviço:" value={fmtData(garantiaAte)} />
          <Campo label="Horário:" value={`${horaInicio}${horaFim ? ` - ${horaFim}` : ''}`} />
          <ChecklistLinha label="Praga:" itens={pragas.length > 0 ? pragas : ['-']} />
        </div>
      </div>

      {!baixa && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Certificado em pré-visualização — os dados finais são confirmados ao dar baixa no serviço.
        </p>
      )}

      <div className="pt-6 flex flex-col sm:flex-row sm:flex-wrap sm:items-end sm:justify-between gap-6 border-t border-slate-100">
        <div className="text-xs text-slate-500 leading-relaxed">
          <p className="font-semibold text-ink-900 mb-1">Telefones de utilização pública e emergência:</p>
          <p>- Centro de informações toxicológicas: DDG 08006435252 (24h)</p>
          <p>- Defesa Civil: (21) 3232-2371</p>
          <p>- Ibama: (21) 3077-4252</p>
          <p>- Bombeiros: 193 / Polícia Militar: 190 / SAMU: 192</p>
        </div>
        <div className="text-center shrink-0">
          <div className="border border-slate-300 rounded px-4 py-2 text-[10px] text-slate-500 mb-1">
            43.238.618/0001-05
          </div>
          <p className="text-xs text-slate-500 leading-tight">
            RATZAN CONTROLE DE PRAGAS LTDA<br />
            R. Conselheiro Lampreia, 191<br />
            Cosme Velho · Cep 22241-230<br />
            Rio de Janeiro - RJ
          </p>
          <p className="text-xs font-semibold text-ink-900 mt-2">Ratzan Controle de Pragas</p>
        </div>
      </div>
    </div>
  )
}
