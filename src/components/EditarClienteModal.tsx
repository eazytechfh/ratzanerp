import React, { useState } from 'react'
import { X } from 'lucide-react'
import type { Cliente, Endereco, StatusCliente, SegmentoCliente } from '../types'
import { SEGMENTOS_CLIENTE } from '../types'
import { updateCliente } from '../data/clienteStore'
import { useCategorias } from '../data/categoriaStore'
import { registrarLog } from '../data/logStore'
import { useAuth } from '../context/AuthContext'
import EnderecosEditor from './EnderecosEditor'

interface Props {
  cliente: Cliente
  onClose: () => void
}

const STATUS_OPTIONS: { value: StatusCliente; label: string }[] = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'vencendo', label: 'Vencendo' },
  { value: 'vencido', label: 'Vencido' },
  { value: 'inativo', label: 'Inativo' },
]

export default function EditarClienteModal({ cliente, onClose }: Props) {
  const categorias = useCategorias()
  const { userEmail } = useAuth()
  const [nome, setNome] = useState(cliente.nome)
  const [telefone, setTelefone] = useState(cliente.telefone)
  const [bairro, setBairro] = useState(cliente.bairro)
  const [contatoResponsavel, setContatoResponsavel] = useState(cliente.contatoResponsavel ?? '')
  const [categoriaId, setCategoriaId] = useState(cliente.categoriaId ?? '')
  const [status, setStatus] = useState<StatusCliente>(cliente.status)
  const [contratoInicio, setContratoInicio] = useState(cliente.contratoInicio)
  const [contratoFim, setContratoFim] = useState(cliente.contratoFim)
  const [enderecos, setEnderecos] = useState<Endereco[]>(cliente.enderecos)
  const [segmento, setSegmento] = useState<SegmentoCliente | ''>(cliente.segmento ?? '')
  const [possuiPet, setPossuiPet] = useState(cliente.possuiPet)
  const [precisaEpi, setPrecisaEpi] = useState(cliente.precisaEpi)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const errs: Record<string, string> = {}
    if (!nome.trim()) errs.nome = 'Nome é obrigatório'
    if (!telefone.trim()) errs.telefone = 'Telefone é obrigatório'
    if (!contratoInicio) errs.contratoInicio = 'Informe o início do contrato'
    if (!contratoFim) errs.contratoFim = 'Informe o fim do contrato'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    updateCliente(cliente.id, {
      nome: nome.trim(),
      telefone: telefone.trim(),
      bairro: bairro.trim(),
      contatoResponsavel: cliente.tipo === 'PJ' ? contatoResponsavel.trim() || undefined : undefined,
      categoriaId: categoriaId || undefined,
      status,
      contratoInicio,
      contratoFim,
      enderecos,
      possuiPet,
      precisaEpi,
      segmento: segmento || undefined,
    })
    registrarLog(userEmail ?? 'sistema', 'Cliente editado', nome.trim())
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-soft w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-ink-900">Editar cliente</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
            />
            {errors.nome && <p className="text-xs text-rose-600 mt-1">{errors.nome}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Telefone</label>
              <input
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
              />
              {errors.telefone && <p className="text-xs text-rose-600 mt-1">{errors.telefone}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusCliente)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm bg-white"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Início do contrato</label>
              <input
                type="date"
                value={contratoInicio}
                onChange={(e) => setContratoInicio(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
              />
              {errors.contratoInicio && <p className="text-xs text-rose-600 mt-1">{errors.contratoInicio}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Fim do contrato</label>
              <input
                type="date"
                value={contratoFim}
                onChange={(e) => setContratoFim(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
              />
              {errors.contratoFim && <p className="text-xs text-rose-600 mt-1">{errors.contratoFim}</p>}
            </div>
          </div>

          {cliente.tipo === 'PJ' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Contato do responsável</label>
              <input
                value={contatoResponsavel}
                onChange={(e) => setContatoResponsavel(e.target.value)}
                placeholder="Nome e telefone/e-mail do responsável"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Bairro</label>
              <input
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Categoria</label>
              <select
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm bg-white"
              >
                <option value="">Sem categoria</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Segmento <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SEGMENTOS_CLIENTE.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSegmento((prev) => (prev === s ? '' : s))}
                  className={`py-2 rounded-lg text-sm font-semibold border transition ${
                    segmento === s
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <EnderecosEditor enderecos={enderecos} onChange={setEnderecos} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-700 border border-slate-200 rounded-lg px-3 py-2.5">
              <input
                type="checkbox"
                checked={possuiPet}
                onChange={(e) => setPossuiPet(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-200"
              />
              Possui pet no local
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 border border-slate-200 rounded-lg px-3 py-2.5">
              <input
                type="checkbox"
                checked={precisaEpi}
                onChange={(e) => setPrecisaEpi(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-200"
              />
              Precisa de EPI para o atendimento
            </label>
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
              Salvar alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
