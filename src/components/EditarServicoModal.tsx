import React, { useState } from 'react'
import { X } from 'lucide-react'
import type { FormaPagamento, Maquininha, Servico } from '../types'
import { MAQUININHAS } from '../types'
import { useClientes } from '../data/clienteStore'
import { updateServico } from '../data/servicoStore'
import { useOperadores } from '../data/operadorStore'
import { useTiposServico } from '../data/tipoServicoStore'
import { useTiposPraga } from '../data/tipoPragaStore'
import { registrarLog } from '../data/logStore'
import { useAuth } from '../context/AuthContext'

interface Props {
  servico: Servico
  onClose: () => void
}

const FORMAS_PAGAMENTO: { value: FormaPagamento; label: string }[] = [
  { value: 'pix', label: 'Pix' },
  { value: 'transferencia', label: 'Transferência' },
  { value: 'debito', label: 'Débito' },
  { value: 'credito', label: 'Crédito' },
  { value: 'boleto_pj', label: 'Boleto PJ' },
  { value: 'garantia', label: 'Garantia' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'incluso_no_contrato', label: 'Incluso no Contrato' },
]

// Linhas editáveis das parcelas de um boleto parcelado (valor + vencimento de cada uma).
// Vêm de parcelasDetalhe; em serviços antigos sem esse detalhe, a 1ª parcela assume o
// valor/data do serviço e as demais começam em branco para serem preenchidas.
function parcelasIniciais(s: Servico): { valor: string; vencimento: string }[] {
  const n = s.parcelas ?? 1
  if (s.formaPagamento !== 'boleto_pj' || n <= 1) return []
  const det = s.parcelasDetalhe ?? []
  return Array.from({ length: n }, (_, i) =>
    det[i]
      ? { valor: String(det[i].valor), vencimento: det[i].vencimento }
      : { valor: i === 0 ? String(s.valor) : '', vencimento: i === 0 ? s.dataAgendada : '' },
  )
}

export default function EditarServicoModal({ servico, onClose }: Props) {
  const clientes = useClientes()
  const tiposServico = useTiposServico()
  const tiposPraga = useTiposPraga()
  const operadores = useOperadores()
  const { userEmail } = useAuth()

  const cliente = clientes.find((c) => c.id === servico.clienteId)

  const [tipoServico, setTipoServico] = useState(servico.tipoServico)
  const [operador, setOperador] = useState(servico.operador)
  const [dataAgendada, setDataAgendada] = useState(servico.dataAgendada)
  const [horaAgendada, setHoraAgendada] = useState(servico.horaAgendada)
  const [valor, setValor] = useState(String(servico.valor || ''))
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>(servico.formaPagamento)
  const [parcelas, setParcelas] = useState(servico.parcelas ?? 1)
  const [maquininha, setMaquininha] = useState<Maquininha>(servico.maquininha ?? 'infinity')
  const [parcelasEdit, setParcelasEdit] = useState(() => parcelasIniciais(servico))
  const [pragas, setPragas] = useState<string[]>(servico.pragas ?? [])
  const [garantiaAte, setGarantiaAte] = useState(servico.garantiaAte ?? '')
  const [observacoes, setObservacoes] = useState(servico.observacoes ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function togglePraga(p: string) {
    setPragas((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }

  const valorDispensado = formaPagamento === 'garantia' || formaPagamento === 'incluso_no_contrato'
  const maxParcelas = formaPagamento === 'credito' || formaPagamento === 'boleto_pj' ? 12 : 1
  // Boleto em várias parcelas: cada parcela tem seu valor e vencimento (vão pro contas a receber).
  const boletoParcelado = formaPagamento === 'boleto_pj' && parcelas > 1

  function handleParcelasChange(n: number) {
    setParcelas(n)
    if (formaPagamento !== 'boleto_pj') return
    setParcelasEdit((prev) => {
      const next = prev.slice(0, n)
      while (next.length < n) {
        next.push(next.length === 0 ? { valor, vencimento: dataAgendada } : { valor: '', vencimento: '' })
      }
      return next
    })
  }

  function updateParcela(idx: number, field: 'valor' | 'vencimento', value: string) {
    setParcelasEdit((prev) => prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)))
  }

  function validate() {
    const errs: Record<string, string> = {}
    if (!dataAgendada) errs.dataAgendada = 'Informe a data'
    if (boletoParcelado) {
      const incompleta = parcelasEdit.length !== parcelas || parcelasEdit.some((p) => !p.valor || Number(p.valor) <= 0 || !p.vencimento)
      if (incompleta) errs.parcelas = 'Preencha valor e vencimento de todas as parcelas'
    } else if (!valorDispensado && (!valor || Number(valor) <= 0)) {
      errs.valor = 'Informe um valor válido'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const parcelasDetalhe = boletoParcelado
      ? parcelasEdit.map((p) => ({ valor: Number(p.valor), vencimento: p.vencimento }))
      : undefined

    await updateServico(servico.id, {
      tipoServico,
      operador,
      dataAgendada,
      horaAgendada,
      // No boleto parcelado o valor do serviço é o da 1ª parcela (mesmo critério do cadastro).
      valor: valorDispensado ? 0 : parcelasDetalhe ? parcelasDetalhe[0].valor : Number(valor),
      parcelasDetalhe,
      // Visita é um tipo próprio (cadastro de visita no cliente) — não pode virar "novo" ao editar.
      tipoAtendimento: servico.tipoAtendimento === 'visita' ? 'visita' : formaPagamento === 'garantia' ? 'reforco' : 'novo',
      pragas,
      formaPagamento,
      parcelas: formaPagamento === 'credito' || formaPagamento === 'boleto_pj' ? parcelas : undefined,
      contabilizarReceita: formaPagamento !== 'garantia' && formaPagamento !== 'incluso_no_contrato',
      garantiaAte: garantiaAte || undefined,
      maquininha: formaPagamento === 'credito' || formaPagamento === 'debito' ? maquininha : undefined,
      observacoes,
    })
    registrarLog(userEmail ?? 'sistema', 'Serviço editado', `${tipoServico} — ${servico.clienteNome}`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-soft w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-ink-900">Editar serviço — {servico.clienteNome}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Cliente</label>
            <input value={cliente?.nome ?? servico.clienteNome} disabled className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-400 text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo de serviço</label>
            <select
              value={tipoServico}
              onChange={(e) => setTipoServico(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm bg-white"
            >
              {tiposServico.map((t) => (
                <option key={t.id} value={t.nome}>{t.nome}</option>
              ))}
            </select>
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
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Operador responsável</label>
            <select
              value={operador}
              onChange={(e) => setOperador(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm bg-white"
            >
              {operadores.map((o) => (
                <option key={o.id} value={o.nome}>{o.nome}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Data</label>
              <input
                type="date"
                value={dataAgendada}
                onChange={(e) => setDataAgendada(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
              />
              {errors.dataAgendada && <p className="text-xs text-rose-600 mt-1">{errors.dataAgendada}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Hora</label>
              <input
                type="time"
                value={horaAgendada}
                onChange={(e) => setHoraAgendada(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
              />
            </div>
          </div>

          {!valorDispensado && !boletoParcelado && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Valor (R$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
              />
              {errors.valor && <p className="text-xs text-rose-600 mt-1">{errors.valor}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Forma de pagamento</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FORMAS_PAGAMENTO.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => {
                    setFormaPagamento(f.value)
                    setParcelas(1)
                    setParcelasEdit([])
                  }}
                  className={`px-2.5 py-2 rounded-lg text-xs font-semibold border transition ${
                    formaPagamento === f.value
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {(formaPagamento === 'debito' || formaPagamento === 'credito') && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Maquininha</label>
                <div className="flex gap-2">
                  {MAQUININHAS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setMaquininha(m.value)}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition ${
                        maquininha === m.value
                          ? 'bg-brand-600 border-brand-600 text-white'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {(formaPagamento === 'credito' || formaPagamento === 'boleto_pj') && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Parcelas</label>
                <select
                  value={parcelas}
                  onChange={(e) => handleParcelasChange(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm bg-white"
                >
                  {Array.from({ length: maxParcelas }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n}x</option>
                  ))}
                </select>
              </div>
            )}
            {boletoParcelado && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-slate-500">Cada parcela vai para o contas a receber na sua data de vencimento.</p>
                {parcelasEdit.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-16 shrink-0">Parcela {idx + 1}</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Valor"
                      value={p.valor}
                      onChange={(e) => updateParcela(idx, 'valor', e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
                    />
                    <input
                      type="date"
                      value={p.vencimento}
                      onChange={(e) => updateParcela(idx, 'vencimento', e.target.value)}
                      className="w-40 px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
                    />
                  </div>
                ))}
                {errors.parcelas && <p className="text-xs text-rose-600">{errors.parcelas}</p>}
              </div>
            )}
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

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Observações</label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">
              Cancelar
            </button>
            <button type="submit" className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-card">
              Salvar alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
