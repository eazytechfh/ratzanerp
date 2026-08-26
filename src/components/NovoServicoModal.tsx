import React, { useState } from 'react'
import { X } from 'lucide-react'
import type { FormaPagamento, Maquininha, ParcelaServico, Servico } from '../types'
import { PRAGAS, MAQUININHAS } from '../types'
import { useClientes } from '../data/clienteStore'
import { addServico } from '../data/servicoStore'
import { useOperadores } from '../data/operadorStore'
import { useTiposServico } from '../data/tipoServicoStore'
import { registrarLog } from '../data/logStore'
import { useAuth } from '../context/AuthContext'
import ClienteCombobox from './ClienteCombobox'

interface Props {
  onClose: () => void
  clienteIdInicial?: string
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

export default function NovoServicoModal({ onClose, clienteIdInicial }: Props) {
  const clientes = useClientes()
  const tiposServico = useTiposServico()
  const operadores = useOperadores()
  const { userEmail } = useAuth()
  const [clienteId, setClienteId] = useState(clienteIdInicial ?? '')
  const [tipoServico, setTipoServico] = useState(tiposServico[0]?.nome ?? '')
  const [operador, setOperador] = useState(operadores[0]?.nome ?? '')
  const [dataAgendada, setDataAgendada] = useState('')
  const [horaAgendada, setHoraAgendada] = useState('09:00')
  const [valor, setValor] = useState('')
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('pix')
  const [parcelas, setParcelas] = useState(1)
  const [maquininha, setMaquininha] = useState<Maquininha>('infinity')
  const [parcelasExtras, setParcelasExtras] = useState<{ valor: string; vencimento: string }[]>([])
  const [pragas, setPragas] = useState<string[]>([])
  const [observacoes, setObservacoes] = useState('')
  const [garantiaAte, setGarantiaAte] = useState('')
  const [multiplasDatas, setMultiplasDatas] = useState(false)
  const [datasExtras, setDatasExtras] = useState<{ data: string; hora: string }[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  function addDataExtra() {
    setDatasExtras((prev) => [...prev, { data: '', hora: '09:00' }])
  }

  function updateDataExtra(idx: number, field: 'data' | 'hora', value: string) {
    setDatasExtras((prev) => prev.map((d, i) => (i === idx ? { ...d, [field]: value } : d)))
  }

  function removeDataExtra(idx: number) {
    setDatasExtras((prev) => prev.filter((_, i) => i !== idx))
  }

  function togglePraga(p: string) {
    setPragas((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }

  function handleParcelasChange(n: number) {
    setParcelas(n)
    setParcelasExtras((prev) => {
      const qtd = n - 1
      const next = prev.slice(0, qtd)
      while (next.length < qtd) next.push({ valor: '', vencimento: '' })
      return next
    })
  }

  function updateParcelaExtra(idx: number, field: 'valor' | 'vencimento', value: string) {
    setParcelasExtras((prev) => prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)))
  }

  const valorDispensado = formaPagamento === 'garantia' || formaPagamento === 'incluso_no_contrato'

  function validate() {
    const errs: Record<string, string> = {}
    if (!clienteId) errs.clienteId = 'Selecione um cliente'
    if (!dataAgendada) errs.dataAgendada = 'Informe a data'
    if (!valorDispensado && (!valor || Number(valor) <= 0)) errs.valor = 'Informe um valor válido'
    if (formaPagamento === 'boleto_pj' && parcelas > 1) {
      const incompleta = parcelasExtras.some((p) => !p.valor || Number(p.valor) <= 0 || !p.vencimento)
      if (incompleta) errs.parcelas = 'Preencha valor e data de pagamento de todas as parcelas'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    const cliente = clientes.find((c) => c.id === clienteId)!

    const datasParaCriar = [
      { data: dataAgendada, hora: horaAgendada },
      ...(multiplasDatas ? datasExtras.filter((d) => d.data) : []),
    ]

    const parcelasDetalhe: ParcelaServico[] | undefined =
      formaPagamento === 'boleto_pj' && parcelas > 1
        ? [
            { valor: Number(valor), vencimento: dataAgendada },
            ...parcelasExtras.map((p) => ({ valor: Number(p.valor), vencimento: p.vencimento })),
          ]
        : undefined

    let algumFalhou = false
    for (let i = 0; i < datasParaCriar.length; i++) {
      const { data, hora } = datasParaCriar[i]
      const ehPrimeiro = i === 0
      const novo: Servico = {
        id: `serv-${Date.now()}-${i}`,
        clienteId: cliente.id,
        clienteNome: cliente.nome,
        tipoServico,
        operador,
        dataAgendada: data,
        horaAgendada: hora,
        status: 'agendado',
        endereco: cliente.enderecos[0]?.endereco ?? '',
        observacoes,
        valor: ehPrimeiro && !valorDispensado ? Number(valor) : 0,
        tipoAtendimento: ehPrimeiro && formaPagamento === 'garantia' ? 'reforco' : 'novo',
        pragas,
        formaPagamento: ehPrimeiro ? formaPagamento : 'incluso_no_contrato',
        parcelas: ehPrimeiro && (formaPagamento === 'credito' || formaPagamento === 'boleto_pj') ? parcelas : undefined,
        contabilizarReceita: ehPrimeiro && formaPagamento !== 'garantia' && formaPagamento !== 'incluso_no_contrato',
        garantiaAte: garantiaAte || undefined,
        maquininha: ehPrimeiro && (formaPagamento === 'credito' || formaPagamento === 'debito') ? maquininha : undefined,
        parcelasDetalhe: ehPrimeiro ? parcelasDetalhe : undefined,
      }

      const created = await addServico(novo)
      if (!created) {
        algumFalhou = true
        continue
      }
      registrarLog(userEmail ?? 'sistema', 'Serviço agendado', `${created.tipoServico} — ${created.clienteNome}`)
    }

    if (algumFalhou) {
      setErrors({ valor: 'Não foi possível salvar um ou mais serviços. Tente novamente.' })
      return
    }
    onClose()
  }

  const maxParcelas = formaPagamento === 'credito' ? 3 : formaPagamento === 'boleto_pj' ? 12 : 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-soft w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-ink-900">Novo serviço</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Cliente</label>
            <ClienteCombobox clientes={clientes} value={clienteId} onChange={setClienteId} error={errors.clienteId} />
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
              {PRAGAS.map((p) => (
                <label key={p} className="flex items-center gap-2 text-sm text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1.5">
                  <input
                    type="checkbox"
                    checked={pragas.includes(p)}
                    onChange={() => togglePraga(p)}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-200"
                  />
                  {p}
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

          <div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={multiplasDatas}
                onChange={(e) => {
                  setMultiplasDatas(e.target.checked)
                  if (e.target.checked && datasExtras.length === 0) addDataExtra()
                }}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-200"
              />
              Agendar mais de um serviço (outras datas)
            </label>
            {multiplasDatas && (
              <div className="mt-3 space-y-2">
                {datasExtras.map((d, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="date"
                      value={d.data}
                      onChange={(e) => updateDataExtra(idx, 'data', e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
                    />
                    <input
                      type="time"
                      value={d.hora}
                      onChange={(e) => updateDataExtra(idx, 'hora', e.target.value)}
                      className="w-28 px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeDataExtra(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addDataExtra}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  + Adicionar outra data
                </button>
                <p className="text-xs text-slate-500">
                  A forma de pagamento e o valor informados são aplicados apenas ao primeiro serviço.
                </p>
              </div>
            )}
          </div>

          {!valorDispensado && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Valor (R$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
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
                    handleParcelasChange(1)
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
            {formaPagamento === 'garantia' && (
              <p className="text-xs text-amber-600 mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Serviço em garantia não é lançado no contas a receber e é contabilizado como Reforço.
              </p>
            )}
            {formaPagamento === 'incluso_no_contrato' && (
              <p className="text-xs text-amber-600 mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Serviço incluso no contrato não é lançado no contas a receber.
              </p>
            )}
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
            {formaPagamento === 'boleto_pj' && parcelas > 1 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-slate-500">
                  Parcela 1: {valor ? Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'} — na data do serviço
                </p>
                {parcelasExtras.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-16 shrink-0">Parcela {idx + 2}</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Valor da parcela"
                      value={p.valor}
                      onChange={(e) => updateParcelaExtra(idx, 'valor', e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
                    />
                    <input
                      type="date"
                      value={p.vencimento}
                      onChange={(e) => updateParcelaExtra(idx, 'vencimento', e.target.value)}
                      className="w-40 px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
                    />
                  </div>
                ))}
                {errors.parcelas && <p className="text-xs text-rose-600">{errors.parcelas}</p>}
                <p className="text-xs text-slate-500">Cada parcela vai para o contas a receber na sua respectiva data de pagamento.</p>
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
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-card"
            >
              Agendar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
