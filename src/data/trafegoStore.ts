import { useServicos } from './servicoStore'
import { useClientes } from './clienteStore'
import type { StatusServico } from '../types'

export const RESPONSAVEL_TRAFEGO = 'Dudu'
export const PERCENTUAL_COMISSAO_TRAFEGO = 0.1

export interface LeadTrafego {
  servicoId: string
  clienteId: string
  clienteNome: string
  dataServico: string
  tipoServico: string
  valorServico: number
  parcelas: number
  comissaoTotal: number
  comissaoParcela: number
  status: StatusServico
}

export function useLeadsTrafego(): LeadTrafego[] {
  const servicos = useServicos()
  const clientes = useClientes()

  return servicos
    .filter((s) => s.tipoAtendimento === 'novo' && s.status !== 'cancelado')
    .map((s) => {
      const cliente = clientes.find((c) => c.id === s.clienteId)
      if (cliente?.origem !== 'Tráfego Pago') return null
      const parcelas = s.parcelas && s.parcelas > 1 ? s.parcelas : 1
      const comissaoTotal = s.valor * PERCENTUAL_COMISSAO_TRAFEGO
      return {
        servicoId: s.id,
        clienteId: s.clienteId,
        clienteNome: s.clienteNome,
        dataServico: s.dataAgendada,
        tipoServico: s.tipoServico,
        valorServico: s.valor,
        parcelas,
        comissaoTotal,
        comissaoParcela: comissaoTotal / parcelas,
        status: s.status,
      } satisfies LeadTrafego
    })
    .filter((x): x is LeadTrafego => x !== null)
    .sort((a, b) => (a.dataServico < b.dataServico ? 1 : -1))
}
