import React, { useMemo, useState } from 'react'
import {
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Gauge, Receipt, Target,
  Plus, Trash2, PiggyBank, Users, Handshake, Sparkles,
} from 'lucide-react'
import { useServicos } from '../../data/servicoStore'
import { useContasReceber } from '../../data/receivableStore'
import { useContasPagar } from '../../data/contaPagarStore'
import { useMetas, getMeta } from '../../data/metaStore'
import { useMetasInternas, addMetaInterna, removeMetaInterna } from '../../data/metaInternaStore'
import KpiCard from '../KpiCard'

const MONTH_LABELS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const ICONES_PADRAO: Record<string, React.ElementType> = {
  'Reserva': PiggyBank,
  'Participação dos lucros da equipe': Users,
  'Parceiro de Negócios': Handshake,
}

function fmtMoeda(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function PrevisibilidadeTab() {
  const servicos = useServicos()
  const contasReceber = useContasReceber()
  const contasPagar = useContasPagar()
  const metas = useMetas()
  const metasInternas = useMetasInternas()
  const [ref, setRef] = useState(new Date())
  const [novoNome, setNovoNome] = useState('')
  const [novoPercentual, setNovoPercentual] = useState('')

  const ano = ref.getFullYear()
  const mes = ref.getMonth() + 1
  const mesRefStr = `${ano}-${String(mes).padStart(2, '0')}`
  const meta = useMemo(() => getMeta(ano, mes), [metas, ano, mes])

  const servicosDoMes = useMemo(() => {
    return servicos.filter((s) => {
      const d = new Date(s.dataAgendada + 'T00:00:00')
      return d.getFullYear() === ano && d.getMonth() + 1 === mes
    })
  }, [servicos, ano, mes])

  const realizado = useMemo(() => {
    return servicosDoMes
      .filter((s) => s.status === 'concluido' && s.tipoAtendimento === 'novo')
      .reduce((acc, s) => acc + s.valor, 0)
  }, [servicosDoMes])

  const entradaPaga = useMemo(
    () => contasReceber.filter((c) => c.status === 'pago' && c.vencimento.slice(0, 7) === mesRefStr).reduce((a, c) => a + c.valor, 0),
    [contasReceber, mesRefStr],
  )
  const saidaPaga = useMemo(
    () => contasPagar.filter((c) => c.status === 'pago' && c.dataPagamento?.slice(0, 7) === mesRefStr).reduce((a, c) => a + c.valor, 0),
    [contasPagar, mesRefStr],
  )

  const lucroLiquido = entradaPaga - saidaPaga
  const margemLiquida = entradaPaga > 0 ? (lucroLiquido / entradaPaga) * 100 : 0

  const ticketMedio = useMemo(() => {
    const concluidos = servicosDoMes.filter((s) => s.status === 'concluido' && s.tipoAtendimento === 'novo')
    if (concluidos.length === 0) return 0
    return concluidos.reduce((acc, s) => acc + s.valor, 0) / concluidos.length
  }, [servicosDoMes])

  const previsao = useMemo(() => {
    const hoje = new Date()
    const ehMesAtual = hoje.getFullYear() === ano && hoje.getMonth() + 1 === mes
    const diasTotais = new Date(ano, mes, 0).getDate()
    const diasPassados = ehMesAtual ? hoje.getDate() : diasTotais
    const ritmoDiario = diasPassados > 0 ? realizado / diasPassados : 0
    const projecao = ritmoDiario * diasTotais
    const percentualProjetado = meta > 0 ? (projecao / meta) * 100 : 0
    const bateMeta = percentualProjetado >= 100
    return { ehMesAtual, diasPassados, diasTotais, ritmoDiario, projecao, percentualProjetado, bateMeta }
  }, [ano, mes, realizado, meta])

  function navegar(delta: number) {
    setRef((d) => new Date(d.getFullYear(), d.getMonth() + delta, 1))
  }

  function handleAddMeta(e: React.FormEvent) {
    e.preventDefault()
    const percentual = Number(novoPercentual)
    if (!novoNome.trim() || !percentual || percentual <= 0) return
    addMetaInterna({ id: `mi-${Date.now()}`, nome: novoNome.trim(), percentual })
    setNovoNome('')
    setNovoPercentual('')
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink-900">{MONTH_LABELS[mes - 1]} de {ano}</p>
        <div className="flex gap-1">
          <button onClick={() => navegar(-1)} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setRef(new Date())} className="px-3 h-8 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50">
            Mês atual
          </button>
          <button onClick={() => navegar(1)} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Analítico */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="Entradas pagas" value={fmtMoeda(entradaPaga)} icon={TrendingUp} tone="green" />
        <KpiCard label="Saídas pagas" value={fmtMoeda(saidaPaga)} icon={TrendingDown} tone="red" />
        <KpiCard label="Margem líquida" value={`${margemLiquida.toFixed(1)}%`} icon={Gauge} tone={margemLiquida >= 0 ? 'green' : 'red'} />
        <KpiCard label="Ticket médio" value={fmtMoeda(ticketMedio)} icon={Receipt} tone="brand" />
      </div>

      {/* Previsibilidade da meta */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={18} className="text-amber-500" />
          <h2 className="font-semibold text-ink-900">Previsibilidade da meta</h2>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          {previsao.ehMesAtual
            ? `Com base no ritmo dos primeiros ${previsao.diasPassados} de ${previsao.diasTotais} dias do mês`
            : 'Mês encerrado — resultado final'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="p-3 rounded-lg bg-slate-50">
            <p className="text-xs text-slate-500">Realizado até agora</p>
            <p className="text-lg font-bold text-ink-900">{fmtMoeda(realizado)}</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50">
            <p className="text-xs text-slate-500">Ritmo diário médio</p>
            <p className="text-lg font-bold text-ink-900">{fmtMoeda(previsao.ritmoDiario)}/dia</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50">
            <p className="text-xs text-slate-500">Projeção fim do mês</p>
            <p className="text-lg font-bold text-ink-900">{fmtMoeda(previsao.projecao)}</p>
          </div>
        </div>

        <div className={`rounded-lg border p-4 flex items-center justify-between flex-wrap gap-3 ${
          previsao.bateMeta ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
        }`}>
          <div>
            <p className={`text-sm font-semibold ${previsao.bateMeta ? 'text-emerald-800' : 'text-amber-800'}`}>
              {previsao.bateMeta
                ? `No ritmo atual, você vai bater a meta (${previsao.percentualProjetado.toFixed(0)}% projetado).`
                : `No ritmo atual, você NÃO vai bater a meta (${previsao.percentualProjetado.toFixed(0)}% projetado).`}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">Meta do mês: {fmtMoeda(meta)}</p>
          </div>
          <Target size={28} className={previsao.bateMeta ? 'text-emerald-500' : 'text-amber-500'} />
        </div>
      </div>

      {/* Metas internas */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
        <h2 className="font-semibold text-ink-900 mb-1">Metas internas</h2>
        <p className="text-xs text-slate-400 mb-4">Calculadas sobre o lucro líquido do mês ({fmtMoeda(lucroLiquido)})</p>

        <div className="space-y-2 mb-4">
          {metasInternas.map((m) => {
            const Icone = ICONES_PADRAO[m.nome] ?? Target
            const valor = (lucroLiquido / 100) * m.percentual
            return (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                <div className="w-9 h-9 rounded-lg bg-white text-brand-600 flex items-center justify-center shrink-0 border border-slate-200">
                  <Icone size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-900">{m.nome}</p>
                  <p className="text-xs text-slate-400">{m.percentual}% do lucro líquido</p>
                </div>
                <p className="text-sm font-bold text-ink-900 shrink-0">{fmtMoeda(valor)}</p>
                <button
                  onClick={() => removeMetaInterna(m.id)}
                  className="text-slate-400 hover:text-rose-600 shrink-0"
                  title="Remover meta"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )
          })}
          {metasInternas.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">Nenhuma meta interna cadastrada.</p>
          )}
        </div>

        <form onSubmit={handleAddMeta} className="flex flex-col sm:flex-row gap-2">
          <input
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            placeholder="Nome da meta (ex: Investimento em marketing)"
            className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500"
          />
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={novoPercentual}
            onChange={(e) => setNovoPercentual(e.target.value)}
            placeholder="%"
            className="w-full sm:w-24 px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-card shrink-0"
          >
            <Plus size={16} /> Adicionar
          </button>
        </form>
      </div>
    </div>
  )
}
