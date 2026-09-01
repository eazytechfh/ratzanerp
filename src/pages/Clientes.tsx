import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Search, Building2, User, ChevronRight, Tag } from 'lucide-react'
import { useClientes } from '../data/clienteStore'
import { useCategorias, getCategoriaById } from '../data/categoriaStore'
import { ClienteStatusBadge } from '../components/StatusBadge'
import NovoClienteModal from '../components/NovoClienteModal'
import CategoriasModal from '../components/CategoriasModal'
import type { StatusCliente, SegmentoCliente } from '../types'
import { SEGMENTOS_CLIENTE } from '../types'

type FiltroStatus = 'todos' | StatusCliente

const FILTROS: { key: FiltroStatus; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'ativo', label: 'Ativos' },
  { key: 'vencendo', label: 'Vencendo' },
  { key: 'vencido', label: 'Vencidos' },
  { key: 'inativo', label: 'Inativos' },
]

function isStatusCliente(value: string | null): value is StatusCliente {
  return value === 'ativo' || value === 'inativo' || value === 'vencendo' || value === 'vencido'
}

export default function Clientes() {
  const clientes = useClientes()
  useCategorias()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [filtro, setFiltro] = useState<FiltroStatus>('todos')
  const [filtroSegmento, setFiltroSegmento] = useState<SegmentoCliente | 'todos'>('todos')
  const [busca, setBusca] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [categoriasOpen, setCategoriasOpen] = useState(false)

  useEffect(() => {
    const statusParam = searchParams.get('status')
    if (isStatusCliente(statusParam)) setFiltro(statusParam)
  }, [searchParams])

  const filtrados = useMemo(() => {
    return clientes.filter((c) => {
      const matchStatus = filtro === 'todos' || c.status === filtro
      const matchSegmento = filtroSegmento === 'todos' || c.segmento === filtroSegmento
      const q = busca.trim().toLowerCase()
      const matchBusca =
        !q ||
        c.nome.toLowerCase().includes(q) ||
        (c.cnpj ?? '').toLowerCase().includes(q) ||
        (c.cpf ?? '').toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      return matchStatus && matchSegmento && matchBusca
    })
  }, [clientes, filtro, filtroSegmento, busca])

  const counts = useMemo(() => {
    const c: Record<FiltroStatus, number> = { todos: clientes.length, ativo: 0, vencendo: 0, vencido: 0, inativo: 0 }
    clientes.forEach((cli) => {
      c[cli.status] += 1
    })
    return c
  }, [clientes])

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Clientes</h1>
          <p className="text-slate-500 text-sm mt-0.5">{clientes.length} clientes cadastrados na base</p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <button
            onClick={() => setCategoriasOpen(true)}
            className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-ink-900 text-sm font-semibold px-4 py-2.5 rounded-lg shadow-card transition"
          >
            <Tag size={18} />
            Categorias
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-card transition"
          >
            <Plus size={18} />
            Novo cliente
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-card">
        <div className="p-4 flex flex-col sm:flex-row gap-3 border-b border-slate-100">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, CNPJ, CPF ou e-mail..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {FILTROS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFiltro(f.key)}
                className={`shrink-0 px-3.5 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                  filtro === f.key
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label} <span className="opacity-70">({counts[f.key]})</span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 pb-4 flex gap-1.5 overflow-x-auto">
          <button
            onClick={() => setFiltroSegmento('todos')}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              filtroSegmento === 'todos' ? 'bg-ink-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos os segmentos
          </button>
          {SEGMENTOS_CLIENTE.map((s) => (
            <button
              key={s}
              onClick={() => setFiltroSegmento(s)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                filtroSegmento === s ? 'bg-ink-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Documento</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Contato</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Contrato até</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Categoria</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/clientes/${c.id}`)}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer transition"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${c.tipo === 'PJ' ? 'bg-ink-800/10 text-ink-800' : 'bg-brand-50 text-brand-600'}`}>
                        {c.tipo === 'PJ' ? <Building2 size={16} /> : <User size={16} />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-ink-900 truncate max-w-[220px]">{c.nome}</p>
                        <p className="text-xs text-slate-400">
                          {c.tipo === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                          {c.segmento ? ` · ${c.segmento}` : ''}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-slate-600">{c.cnpj || c.cpf || '-'}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <p className="text-slate-600">{c.telefone}</p>
                    <p className="text-xs text-slate-400">{c.email}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-slate-600">
                    {new Date(c.contratoFim + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {getCategoriaById(c.categoriaId) && (
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border"
                        style={{
                          color: getCategoriaById(c.categoriaId)!.cor,
                          borderColor: getCategoriaById(c.categoriaId)!.cor + '40',
                          backgroundColor: getCategoriaById(c.categoriaId)!.cor + '10',
                        }}
                      >
                        {getCategoriaById(c.categoriaId)!.nome}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ClienteStatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    <ChevronRight size={18} />
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    Nenhum cliente encontrado com esses filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <NovoClienteModal
          onClose={() => setModalOpen(false)}
          onCreated={(cliente) => navigate(`/clientes/${cliente.id}`)}
        />
      )}
      {categoriasOpen && <CategoriasModal onClose={() => setCategoriasOpen(false)} />}
    </div>
  )
}
