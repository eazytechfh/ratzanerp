import React, { useState } from 'react'
import { X } from 'lucide-react'
import type { Cliente, Contrato, Periodicidade } from '../types'
import { PERIODICIDADES } from '../types'
import { addContrato } from '../data/contratoStore'
import { registrarLog } from '../data/logStore'
import { useAuth } from '../context/AuthContext'

interface Props {
  cliente: Cliente
  onClose: () => void
  onCreated: (contrato: Contrato) => void
}

function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

export default function NovoContratoModal({ cliente, onClose, onCreated }: Props) {
  const { userEmail } = useAuth()
  const [contratanteNome, setContratanteNome] = useState(cliente.nome)
  const [contratanteDocumento, setContratanteDocumento] = useState(cliente.cnpj || cliente.cpf || '')
  const [contratanteEndereco, setContratanteEndereco] = useState(cliente.enderecos[0]?.endereco ?? '')
  const [contratanteEmail, setContratanteEmail] = useState(cliente.email)
  const [servicosAbrangidos, setServicosAbrangidos] = useState('')
  const [reajustePercentual, setReajustePercentual] = useState('0')
  const [periodicidade, setPeriodicidade] = useState<Periodicidade>('Semestral')
  const [reforcoProgramado, setReforcoProgramado] = useState('')
  const [valorTotal, setValorTotal] = useState('')
  const [formaPagamento, setFormaPagamento] = useState('Boleto bancário')
  const [parcelado, setParcelado] = useState(false)
  const [qtdParcelas, setQtdParcelas] = useState('1')
  const [valorParcela, setValorParcela] = useState('')
  const [vencimentos, setVencimentos] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [dataAssinatura, setDataAssinatura] = useState(fmtDate(new Date()))
  const [responsavelContratante, setResponsavelContratante] = useState('')
  const [representanteRatzan, setRepresentanteRatzan] = useState('Humberto Araújo da Silva')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const errs: Record<string, string> = {}
    if (!contratanteNome.trim()) errs.contratanteNome = 'Nome é obrigatório'
    if (!servicosAbrangidos.trim()) errs.servicosAbrangidos = 'Descreva os serviços abrangidos'
    if (!valorTotal || Number(valorTotal) <= 0) errs.valorTotal = 'Informe um valor válido'
    if (!dataInicio) errs.dataInicio = 'Informe a data de início'
    if (!dataFim) errs.dataFim = 'Informe a data de término'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const novo: Contrato = {
      id: `ctr-${Date.now()}`,
      clienteId: cliente.id,
      contratanteNome: contratanteNome.trim(),
      contratanteDocumento: contratanteDocumento.trim(),
      contratanteEndereco: contratanteEndereco.trim(),
      contratanteEmail: contratanteEmail.trim(),
      servicosAbrangidos: servicosAbrangidos.trim(),
      reajustePercentual: Number(reajustePercentual) || 0,
      periodicidade,
      reforcoProgramado: reforcoProgramado.trim(),
      valorTotal: Number(valorTotal),
      formaPagamento: formaPagamento.trim(),
      parcelado,
      qtdParcelas: parcelado ? Number(qtdParcelas) || 1 : undefined,
      valorParcela: parcelado ? Number(valorParcela) || 0 : undefined,
      vencimentos: vencimentos.trim(),
      dataInicio,
      dataFim,
      dataAssinatura,
      responsavelContratante: responsavelContratante.trim(),
      representanteRatzan: representanteRatzan.trim(),
      criadoEm: fmtDate(new Date()),
    }

    const created = await addContrato(novo)
    if (!created) return
    registrarLog(userEmail ?? 'sistema', 'Contrato gerado', cliente.nome)
    onCreated(created)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-soft w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-ink-900">Gerar contrato — {cliente.nome}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Dados do contratante</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome / Razão social</label>
                <input value={contratanteNome} onChange={(e) => setContratanteNome(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500" />
                {errors.contratanteNome && <p className="text-xs text-rose-600 mt-1">{errors.contratanteNome}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">CNPJ/CPF</label>
                <input value={contratanteDocumento} onChange={(e) => setContratanteDocumento(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Endereço</label>
                <input value={contratanteEndereco} onChange={(e) => setContratanteEndereco(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mail</label>
                <input value={contratanteEmail} onChange={(e) => setContratanteEmail(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500" />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Objeto do contrato</p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Serviços abrangidos</label>
              <input
                value={servicosAbrangidos}
                onChange={(e) => setServicosAbrangidos(e.target.value)}
                placeholder="Ex: Desinsetização: baratas, pulgas, carrapatos e Desratização"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500"
              />
              {errors.servicosAbrangidos && <p className="text-xs text-rose-600 mt-1">{errors.servicosAbrangidos}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Reajuste (%)</label>
                <input type="number" step="0.01" value={reajustePercentual} onChange={(e) => setReajustePercentual(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Periodicidade</label>
                <select value={periodicidade} onChange={(e) => setPeriodicidade(e.target.value as Periodicidade)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500 bg-white">
                  {PERIODICIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Reforço programado</label>
                <input value={reforcoProgramado} onChange={(e) => setReforcoProgramado(e.target.value)} placeholder="Ex: 3 meses após 1º serviço" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500" />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Valor e forma de pagamento</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Valor total (R$)</label>
                <input type="number" min="0" step="0.01" value={valorTotal} onChange={(e) => setValorTotal(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500" />
                {errors.valorTotal && <p className="text-xs text-rose-600 mt-1">{errors.valorTotal}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Forma de pagamento</label>
                <input value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)} placeholder="Ex: Boleto bancário, Pix..." className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500" />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700 mt-4">
              <input type="checkbox" checked={parcelado} onChange={(e) => setParcelado(e.target.checked)} className="rounded border-slate-300 text-brand-600 focus:ring-brand-200" />
              Pagamento parcelado
            </label>

            {parcelado && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Qtd. parcelas</label>
                  <input type="number" min="1" value={qtdParcelas} onChange={(e) => setQtdParcelas(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Valor da parcela (R$)</label>
                  <input type="number" min="0" step="0.01" value={valorParcela} onChange={(e) => setValorParcela(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Vencimentos</label>
                  <input value={vencimentos} onChange={(e) => setVencimentos(e.target.value)} placeholder="Ex: 30, 60, 90 e 120 dias" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500" />
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Vigência e assinatura</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Início</label>
                <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500" />
                {errors.dataInicio && <p className="text-xs text-rose-600 mt-1">{errors.dataInicio}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Término</label>
                <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500" />
                {errors.dataFim && <p className="text-xs text-rose-600 mt-1">{errors.dataFim}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Data de assinatura</label>
                <input type="date" value={dataAssinatura} onChange={(e) => setDataAssinatura(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Responsável do contratante</label>
                <input value={responsavelContratante} onChange={(e) => setResponsavelContratante(e.target.value)} placeholder="Ex: Síndico(a), representante..." className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Representante Ratzan</label>
                <input value={representanteRatzan} onChange={(e) => setRepresentanteRatzan(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">Cancelar</button>
            <button type="submit" className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-card">Gerar contrato</button>
          </div>
        </form>
      </div>
    </div>
  )
}
