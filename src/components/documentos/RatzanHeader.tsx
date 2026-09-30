import React from 'react'
import { Bug } from 'lucide-react'
import ratzanLogo from '../../assets/ratzan-logo.webp'

// OSHeader ainda usa o ícone genérico (não a logo nova): o layout da Ordem de Serviço
// está em aprovação com o cliente, então segue como está em produção até aprovar.
export function OSHeader({ titulo }: { titulo: string }) {
  return (
    <>
      <div className="bg-brand-600 rounded-lg px-6 py-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0">
          <Bug size={24} className="text-brand-600" />
        </div>
        <span className="text-white text-2xl font-extrabold tracking-tight">RATZAN</span>
      </div>
      <div className="bg-slate-100 rounded-lg px-6 py-3 text-center">
        <h2 className="text-lg font-bold text-ink-900">{titulo}</h2>
      </div>
    </>
  )
}

export function CertificadoHeader() {
  return (
    <>
      <div className="bg-brand-600 rounded-lg px-6 py-4">
        <div className="flex items-center mb-3">
          <div className="bg-white rounded-lg px-3 py-2 inline-flex items-center">
            <img src={ratzanLogo} alt="Ratzan Controle de Pragas" className="h-9 w-auto" />
          </div>
        </div>
        <div className="flex items-start justify-between gap-3 text-white text-[10px] leading-relaxed">
          <div>
            <p>www.ratzan.com.br</p>
            <p>contato@ratzan.com.br</p>
            <p>98117-4376</p>
          </div>
          <div className="text-right">
            <p>CNPJ 43.238.618/0001-05</p>
            <p>Endereço: R. Conselheiro Lampreia - 191</p>
            <p>Rio de Janeiro - RJ</p>
            <p>CEP 22.241-230</p>
          </div>
        </div>
      </div>
      <div className="bg-slate-100 rounded-lg px-6 py-3 text-center">
        <h2 className="text-lg font-bold text-ink-900">CERTIFICADO DE GARANTIA</h2>
      </div>
    </>
  )
}
