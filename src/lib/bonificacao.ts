import type { EventoServico, Operador, Servico } from '../types'
import { situacaoDeAtraso } from './atraso'

// ---------------------------------------------------------------------------------------
// Regras de bonificação dos operadores
//
// PONTUALIDADE — R$ 25 a mais por SEMANA em que o operador não atrasou nenhum serviço.
//  - Semana = segunda a domingo, e conta no mês em que COMEÇA (segunda-feira).
//  - Atraso = serviço iniciado depois da tolerância (15 min) ou ainda não iniciado depois dela.
//  - Atraso justificado pelo gestor não conta contra o operador; sem justificativa, a semana
//    não é elegível. Serviço atrasado e ainda sem justificativa também tira a elegibilidade.
//  - Semana sem nenhum serviço do operador não conta (nem bônus, nem perda).
//
// REFORÇOS — bônus do mês conforme a quantidade de reforços feitos no mês:
//  0 → R$ 350 · 1 → R$ 300 · 2 → R$ 250 · 3 → R$ 150 · 4 ou mais → R$ 0 (a tabela só vai até 3).
//  - Reforço = serviço agendado como Reforço/Garantia OU marcado como Reforço na baixa.
//  - Serviços cancelados não contam. Mês sem nenhum serviço do operador não gera o bônus.
// ---------------------------------------------------------------------------------------

export const BONUS_SEMANA = 25
const BONUS_REFORCO_POR_QTD = [350, 300, 250, 150]

export function bonusReforco(qtd: number): number {
  return qtd >= 0 && qtd < BONUS_REFORCO_POR_QTD.length ? BONUS_REFORCO_POR_QTD[qtd] : 0
}

export const TABELA_REFORCO: { qtd: string; valor: number }[] = [
  { qtd: '0 reforços', valor: 350 },
  { qtd: '1 reforço', valor: 300 },
  { qtd: '2 reforços', valor: 250 },
  { qtd: '3 reforços', valor: 150 },
]

export function ehReforco(s: Servico): boolean {
  return s.tipoAtendimento === 'reforco' || s.baixa?.aplicacao === 'reforco'
}

export type StatusSemana = 'elegivel' | 'nao_elegivel' | 'em_andamento' | 'sem_servico' | 'futura'

export interface AtrasoInjustificado {
  servico: Servico
  minutos: number
  /** true = iniciou com atraso; false = ainda não iniciou e já passou da tolerância */
  iniciou: boolean
}

export interface SemanaBonus {
  segunda: Date
  domingo: Date
  status: StatusSemana
  qtdServicos: number
  atrasos: AtrasoInjustificado[]
}

export interface BonusOperador {
  operador: Operador
  semanas: SemanaBonus[]
  semanasElegiveis: number
  semanasEmAndamento: number
  /** R$ já garantido pelas semanas encerradas sem atraso */
  valorPontualidade: number
  qtdServicosMes: number
  reforcos: Servico[]
  valorReforco: number
  /** pontualidade garantida + reforço */
  total: number
  mesEncerrado: boolean
}

function fmtISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDias(d: Date, dias: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + dias)
  return r
}

/** Segundas-feiras que caem dentro do mês — cada uma abre uma semana que conta nesse mês. */
export function segundasDoMes(mes: Date): Date[] {
  const ano = mes.getFullYear()
  const m = mes.getMonth()
  const d = new Date(ano, m, 1)
  while (d.getDay() !== 1) d.setDate(d.getDate() + 1)
  const segundas: Date[] = []
  while (d.getMonth() === m) {
    segundas.push(new Date(d))
    d.setDate(d.getDate() + 7)
  }
  return segundas
}

function calcularSemana(segunda: Date, servicosOp: Servico[], eventos: EventoServico[], agora: Date): SemanaBonus {
  const domingo = addDias(segunda, 6)
  const ini = fmtISO(segunda)
  const fim = fmtISO(domingo)
  const doPeriodo = servicosOp.filter((s) => s.status !== 'cancelado' && s.dataAgendada >= ini && s.dataAgendada <= fim)

  const atrasos: AtrasoInjustificado[] = []
  for (const s of doPeriodo) {
    const sit = situacaoDeAtraso(s, eventos, agora)
    if (!sit.atrasadoSemIniciar && !sit.iniciouComAtraso) continue
    const justificado = eventos.some((e) => e.servicoId === s.id && e.tipo === 'atraso_justificado')
    if (!justificado) atrasos.push({ servico: s, minutos: sit.minutos, iniciou: sit.iniciouComAtraso })
  }

  const comecou = agora.getTime() >= segunda.getTime()
  const fimDaSemana = new Date(domingo.getFullYear(), domingo.getMonth(), domingo.getDate(), 23, 59, 59, 999)
  const terminou = agora.getTime() > fimDaSemana.getTime()

  let status: StatusSemana
  if (!comecou) status = 'futura'
  else if (atrasos.length > 0) status = 'nao_elegivel'
  else if (doPeriodo.length === 0) status = 'sem_servico'
  else status = terminou ? 'elegivel' : 'em_andamento'

  return { segunda, domingo, status, qtdServicos: doPeriodo.length, atrasos }
}

export function calcularBonusOperador(
  operador: Operador,
  servicos: Servico[],
  eventos: EventoServico[],
  mes: Date,
  agora: Date,
): BonusOperador {
  const servicosOp = servicos.filter((s) => s.operador === operador.nome)
  const semanas = segundasDoMes(mes).map((seg) => calcularSemana(seg, servicosOp, eventos, agora))
  const semanasElegiveis = semanas.filter((s) => s.status === 'elegivel').length
  const semanasEmAndamento = semanas.filter((s) => s.status === 'em_andamento').length

  const chaveMes = `${mes.getFullYear()}-${String(mes.getMonth() + 1).padStart(2, '0')}`
  const doMes = servicosOp.filter((s) => s.status !== 'cancelado' && s.dataAgendada.startsWith(chaveMes))
  const reforcos = doMes.filter(ehReforco)
  const valorReforco = doMes.length === 0 ? 0 : bonusReforco(reforcos.length)
  const valorPontualidade = semanasElegiveis * BONUS_SEMANA

  const ultimoDia = new Date(mes.getFullYear(), mes.getMonth() + 1, 0, 23, 59, 59, 999)

  return {
    operador,
    semanas,
    semanasElegiveis,
    semanasEmAndamento,
    valorPontualidade,
    qtdServicosMes: doMes.length,
    reforcos,
    valorReforco,
    total: valorPontualidade + valorReforco,
    mesEncerrado: agora.getTime() > ultimoDia.getTime(),
  }
}
