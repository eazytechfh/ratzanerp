import React, { useMemo, useState } from 'react'
import { CheckCircle2, Repeat, Search, FileText, Receipt, Loader2, ExternalLink, AlertCircle } from 'lucide-react'
import { useContasReceber, darBaixaContaReceber } from '../../data/receivableStore'
import { useClientes } from '../../data/clienteStore'
import { useCobrancasAsaas, ultimaCobranca, refetchCobrancasAsaas } from '../../data/cobrancaAsaasStore'
import { emitirBoleto, emitirNotaFiscal } from '../../data/asaasClient'

export default function ContasReceberTab() {
  const contas = useContasReceber()
  const clientes = useClientes()
  useCobrancasAsaas()
  const [filtro, setFiltro] = useState<'todos' | 'pendente' | 'pago'>('todos')
  const [busca, setBusca] = useState('')
  const [processando, setProcessando] = useState<string | null>(null)
  const [erroPorItem, setErroPorItem] = useState<Record<string, string>>({})

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return contas
      .filter((c) => filtro === 'todos' || c.status === filtro)
      .filter((c) => !q || c.clienteNome.toLowerCase().includes(q) || c.descricao.toLowerCase().includes(q))
      .sort((a, b) => (a.vencimento < b.vencimento ? -1 : 1))
  }, [contas, filtro, busca])

  const totalPendente = contas.filter((c) => c.status === 'pendente').reduce((a, c) => a + c.valor, 0)
  const totalPago = contas.filter((c) => c.status === 'pago').reduce((a, c) => a + c.valor, 0)

  async function handleEmitir(tipo: 'boleto' | 'nf', item: (typeof contas)[number]) {
    const cliente = clientes.find((c) => c.id === item.clienteId)
    if (!cliente) return
    const chave = `${tipo}-${item.id}`
    setProcessando(chave)
    setErroPorItem((prev) => ({ ...prev, [chave]: '' }))

    const resultado = tipo === 'boleto'
      ? await emitirBoleto({ itemId: item.id, cliente, valor: item.valor, vencimento: item.vencimento, descricao: item.descricao })
      : await emitirNotaFiscal({ itemId: item.id, cliente, valor: item.valor, vencimento: item.vencimento, descricao: item.descricao })

    setProcessando(null)
    if (resultado.error) {
      setErroPorItem((prev) => ({ ...prev, [chave]: resultado.error! }))
      return
    }
    await refetchCobrancasAsaas()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex gap-4 text-sm">
          <p className="text-slate-500">A receber: <span className="font-bold text-amber-600">{totalPendente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
          <p className="text-slate-500">Recebido: <span className="font-bold text-emerald-600">{totalPago.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
        </div>
        <div className="flex gap-1.5">
          {(['todos', 'pendente', 'pago'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition ${
                filtro === f ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por cliente ou descrição..."
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm bg-white"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100">
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">Descrição</th>
              <th className="px-4 py-3 font-medium">Vencimento</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Valor</th>
              <th className="px-4 py-3 font-medium text-right">Asaas</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtradas.map((c) => {
              const boleto = ultimaCobranca(c.id, 'boleto')
              const nf = ultimaCobranca(c.id, 'nf')
              const carregandoBoleto = processando === `boleto-${c.id}`
              const carregandoNf = processando === `nf-${c.id}`
              const erroBoleto = erroPorItem[`boleto-${c.id}`]
              const erroNf = erroPorItem[`nf-${c.id}`]
              return (
                <tr key={c.id} className="border-b border-slate-50 last:border-0 align-top">
                  <td className="px-4 py-3 font-medium text-ink-900">{c.clienteNome}</td>
                  <td className="px-4 py-3 hidden sm:table-cell text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      {c.origem === 'recorrente' && <Repeat size={12} className="text-sky-500" />}
                      {c.descricao}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{new Date(c.vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      c.status === 'pago' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {c.status === 'pago' ? 'Pago' : 'Pendente'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-700">{c.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-end gap-1">
                      {c.formaPagamento === 'credito' ? (
                        <span className="text-xs text-slate-400">Pago no cartão de crédito — sem emissão de boleto</span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEmitir('boleto', c)}
                            disabled={carregandoBoleto}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50"
                          >
                            {carregandoBoleto ? <Loader2 size={12} className="animate-spin" /> : <Receipt size={12} />}
                            {boleto?.url ? 'Reemitir boleto' : 'Emitir boleto'}
                          </button>
                          {boleto?.url && (
                            <a href={boleto.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-ink-900">
                              <ExternalLink size={11} /> Ver boleto
                            </a>
                          )}
                          {erroBoleto && (
                            <span className="inline-flex items-center gap-1 text-xs text-rose-600 max-w-[180px] text-right"><AlertCircle size={11} className="shrink-0" /> {erroBoleto}</span>
                          )}
                        </>
                      )}

                      <button
                        onClick={() => handleEmitir('nf', c)}
                        disabled={carregandoNf}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-ink-900 hover:text-brand-700 disabled:opacity-50 mt-1"
                      >
                        {carregandoNf ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
                        {nf?.url ? 'Reemitir NF' : 'Emitir NF'}
                      </button>
                      {nf?.url && (
                        <a href={nf.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-ink-900">
                          <ExternalLink size={11} /> Ver NF
                        </a>
                      )}
                      {!nf?.url && nf?.erro && (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600 max-w-[180px] text-right">
                          <Loader2 size={11} className="shrink-0" /> {nf.erro}
                        </span>
                      )}
                      {erroNf && (
                        <span className="inline-flex items-center gap-1 text-xs text-rose-600 max-w-[180px] text-right"><AlertCircle size={11} className="shrink-0" /> {erroNf}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {c.status === 'pendente' && (
                      <button onClick={() => darBaixaContaReceber(c.id)} className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50" title="Dar baixa">
                        <CheckCircle2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400">Nenhuma conta encontrada.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
