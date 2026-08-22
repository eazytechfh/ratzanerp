import React from 'react'
import { X, Printer } from 'lucide-react'
import type { Contrato } from '../types'
import ContratoDoc from './documentos/ContratoDoc'

interface Props {
  contrato: Contrato
  onClose: () => void
}

export default function ContratoViewModal({ contrato, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:relative print:p-0">
      <div className="absolute inset-0 bg-black/40 print:hidden" onClick={onClose} />
      <div className="relative bg-slate-100 rounded-2xl shadow-soft w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 print:max-h-none print:overflow-visible print:bg-white print:p-0">
        <div className="flex items-center justify-end gap-2 mb-4 print:hidden">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-ink-900 text-sm font-semibold px-4 py-2 rounded-lg shadow-card transition"
          >
            <Printer size={16} />
            Imprimir / Salvar PDF
          </button>
          <button onClick={onClose} className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
            <X size={18} />
          </button>
        </div>
        <ContratoDoc contrato={contrato} />
      </div>
    </div>
  )
}
