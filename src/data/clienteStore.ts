import { createSupabaseStore } from './createSupabaseStore'
import type { Cliente } from '../types'

interface ClienteRow {
  id: string
  tipo: string
  nome: string
  cpf: string | null
  cnpj: string | null
  email: string
  telefone: string
  bairro: string
  categoria_id: string | null
  enderecos: Cliente['enderecos']
  status: string
  data_cadastro: string
  contrato_inicio: string
  contrato_fim: string
  recorrente: boolean
  possui_pet: boolean
  precisa_epi: boolean
  origem: string
  observacoes: string | null
}

function fromRow(r: ClienteRow): Cliente {
  return {
    id: r.id,
    tipo: r.tipo as Cliente['tipo'],
    nome: r.nome,
    cpf: r.cpf ?? undefined,
    cnpj: r.cnpj ?? undefined,
    email: r.email,
    telefone: r.telefone,
    bairro: r.bairro,
    categoriaId: r.categoria_id ?? undefined,
    enderecos: r.enderecos ?? [],
    status: r.status as Cliente['status'],
    dataCadastro: r.data_cadastro,
    contratoInicio: r.contrato_inicio,
    contratoFim: r.contrato_fim,
    recorrente: r.recorrente,
    possuiPet: r.possui_pet,
    precisaEpi: r.precisa_epi,
    origem: r.origem as Cliente['origem'],
    observacoes: r.observacoes ?? undefined,
  }
}

function toRow(c: Cliente): ClienteRow {
  return {
    id: c.id,
    tipo: c.tipo,
    nome: c.nome,
    cpf: c.cpf ?? null,
    cnpj: c.cnpj ?? null,
    email: c.email,
    telefone: c.telefone,
    bairro: c.bairro,
    categoria_id: c.categoriaId ?? null,
    enderecos: c.enderecos,
    status: c.status,
    data_cadastro: c.dataCadastro,
    contrato_inicio: c.contratoInicio,
    contrato_fim: c.contratoFim,
    recorrente: c.recorrente,
    possui_pet: c.possuiPet,
    precisa_epi: c.precisaEpi,
    origem: c.origem,
    observacoes: c.observacoes ?? null,
  }
}

const store = createSupabaseStore<Cliente, ClienteRow>({
  table: 'clientes',
  fromRow,
  toRow,
  orderBy: { column: 'created_at', ascending: false },
})

export function useClientes(): Cliente[] {
  return store.useAll()
}

export function getClienteById(id: string): Cliente | undefined {
  return store.getById(id)
}

export async function addCliente(cliente: Cliente) {
  const { error, created } = await store.add(cliente)
  if (error) console.error(error)
  return created
}

export async function updateCliente(id: string, changes: Partial<Cliente>) {
  const { error } = await store.update(id, changes)
  if (error) console.error(error)
}
