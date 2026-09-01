import { createSupabaseStore } from './createSupabaseStore'
import type { Fornecedor } from '../types'

interface FornecedorRow {
  id: string
  nome: string
  tipo_prestacao_servico: string
  cnpj: string | null
  cpf: string | null
  email: string | null
  telefone: string | null
  endereco: string | null
  observacoes: string | null
}

function fromRow(r: FornecedorRow): Fornecedor {
  return {
    id: r.id,
    nome: r.nome,
    tipoPrestacaoServico: r.tipo_prestacao_servico ?? '',
    cnpj: r.cnpj ?? undefined,
    cpf: r.cpf ?? undefined,
    email: r.email ?? undefined,
    telefone: r.telefone ?? undefined,
    endereco: r.endereco ?? undefined,
    observacoes: r.observacoes ?? undefined,
  }
}

function toRow(f: Fornecedor): FornecedorRow {
  return {
    id: f.id,
    nome: f.nome,
    tipo_prestacao_servico: f.tipoPrestacaoServico,
    cnpj: f.cnpj ?? null,
    cpf: f.cpf ?? null,
    email: f.email ?? null,
    telefone: f.telefone ?? null,
    endereco: f.endereco ?? null,
    observacoes: f.observacoes ?? null,
  }
}

const store = createSupabaseStore<Fornecedor, FornecedorRow>({
  table: 'fornecedores',
  fromRow,
  toRow,
  orderBy: { column: 'nome', ascending: true },
})

export function useFornecedores(): Fornecedor[] {
  return store.useAll()
}

export function getFornecedorById(id?: string): Fornecedor | undefined {
  if (!id) return undefined
  return store.getById(id)
}

export async function addFornecedor(fornecedor: Fornecedor) {
  const { error, created } = await store.add(fornecedor)
  if (error) console.error(error)
  return created
}

export async function updateFornecedor(id: string, changes: Partial<Fornecedor>) {
  const { error } = await store.update(id, changes)
  if (error) console.error(error)
}

export async function removeFornecedor(id: string) {
  const { error } = await store.remove(id)
  if (error) console.error(error)
}
