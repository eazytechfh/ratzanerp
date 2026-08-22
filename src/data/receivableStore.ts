import { useEffect, useSyncExternalStore } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useServicos } from './servicoStore'
import { useClientes } from './clienteStore'
import type { ContaReceberItem } from '../types'

let overrides = new Set<string>()
let loaded = false
let loading: Promise<void> | null = null
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((l) => l())
}

async function loadOverrides() {
  if (loaded) return
  if (loading) return loading
  loading = (async () => {
    const { data, error } = await supabase.from('recebimentos_baixados').select('item_id')
    if (error) {
      console.error('[supabase] erro ao carregar recebimentos_baixados:', error.message)
      return
    }
    overrides = new Set((data as { item_id: string }[]).map((r) => r.item_id))
    loaded = true
    emit()
  })()
  return loading
}

export async function darBaixaContaReceber(id: string) {
  const { error } = await supabase.from('recebimentos_baixados').upsert({ item_id: id })
  if (error) {
    console.error(error)
    return
  }
  overrides = new Set(overrides).add(id)
  emit()
}

function useOverrides() {
  useEffect(() => {
    loadOverrides()
  }, [])
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => overrides,
  )
}

function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

export function useContasReceber(): ContaReceberItem[] {
  const servicos = useServicos()
  const clientes = useClientes()
  const overridesAtuais = useOverrides()

  const itens: ContaReceberItem[] = []

  servicos.forEach((s) => {
    if (!s.contabilizarReceita) return
    const id = `sv-${s.id}`
    itens.push({
      id,
      clienteId: s.clienteId,
      clienteNome: s.clienteNome,
      descricao: s.tipoServico,
      valor: s.valor,
      vencimento: s.dataAgendada,
      status: overridesAtuais.has(id) || s.status === 'concluido' ? 'pago' : 'pendente',
      origem: 'servico',
    })
  })

  const hoje = new Date()
  clientes.forEach((c) => {
    if (!c.recorrente || c.status === 'inativo') return
    const fim = new Date(c.contratoFim + 'T00:00:00')
    if (fim <= hoje) return
    const servicosCliente = servicos.filter((s) => s.clienteId === c.id && s.status === 'concluido')
    const ticketMedio =
      servicosCliente.length > 0
        ? servicosCliente.reduce((acc, s) => acc + s.valor, 0) / servicosCliente.length
        : 250

    for (let i = 1; i <= 12; i++) {
      const vencimento = new Date(hoje.getFullYear(), hoje.getMonth() + i, 5)
      if (vencimento > fim) break
      const id = `rec-${c.id}-${vencimento.getFullYear()}-${vencimento.getMonth() + 1}`
      itens.push({
        id,
        clienteId: c.id,
        clienteNome: c.nome,
        descricao: 'Mensalidade recorrente',
        valor: Math.round(ticketMedio),
        vencimento: fmtDate(vencimento),
        status: overridesAtuais.has(id) ? 'pago' : 'pendente',
        origem: 'recorrente',
      })
    }
  })

  return itens.sort((a, b) => (a.vencimento < b.vencimento ? -1 : 1))
}
