import React, { useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Building2, User, Mail, Phone, MapPin, Calendar, Repeat, PawPrint, HardHat, Pencil, Wrench, FileText, Bell, CheckCircle2,
} from 'lucide-react'
import { useClientes } from '../data/clienteStore'
import { getCategoriaById } from '../data/categoriaStore'
import { useServicos } from '../data/servicoStore'
import { useContratos } from '../data/contratoStore'
import { useAlertas, concluirAlerta } from '../data/alertaStore'
import { ClienteStatusBadge, ServicoStatusBadge } from '../components/StatusBadge'
import EditarClienteModal from '../components/EditarClienteModal'
import NovoServicoModal from '../components/NovoServicoModal'
import NovoContratoModal from '../components/NovoContratoModal'
import ContratoViewModal from '../components/ContratoViewModal'
import IncluirAlertaModal from '../components/IncluirAlertaModal'
import type { Contrato } from '../types'

export default function ClienteDetalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const clientes = useClientes()
  const servicos = useServicos()
  const contratos = useContratos()
  const alertas = useAlertas()
  const cliente = clientes.find((c) => c.id === id)
  const [editOpen, setEditOpen] = useState(false)
  const [novoServicoOpen, setNovoServicoOpen] = useState(false)
  const [novoContratoOpen, setNovoContratoOpen] = useState(false)
  const [novoAlertaOpen, setNovoAlertaOpen] = useState(false)
  const [contratoVisualizando, setContratoVisualizando] = useState<Contrato | null>(null)

  const historico = useMemo(() => {
    if (!cliente) return []
    return servicos
      .filter((s) => s.clienteId === cliente.id)
      .sort((a, b) => (a.dataAgendada < b.dataAgendada ? 1 : -1))
  }, [cliente, servicos])

  const contratosCliente = useMemo(() => {
    if (!cliente) return []
    return contratos
      .filter((c) => c.clienteId === cliente.id)
      .sort((a, b) => (a.criadoEm < b.criadoEm ? 1 : -1))
  }, [cliente, contratos])

  const alertasCliente = useMemo(() => {
    if (!cliente) return []
    return alertas
      .filter((a) => a.clienteId === cliente.id)
      .sort((a, b) => (a.criadoEm < b.criadoEm ? 1 : -1))
  }, [cliente, alertas])

  if (!cliente) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500 mb-4">Cliente não encontrado.</p>
        <Link to="/clientes" className="text-brand-600 font-medium">Voltar para clientes</Link>
      </div>
    )
  }

  const totalGasto = historico
    .filter((s) => s.status === 'concluido')
    .reduce((acc, s) => acc + s.valor, 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/clientes')}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-ink-900 transition"
        >
          <ArrowLeft size={16} />
          Voltar para clientes
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setNovoServicoOpen(true)}
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-card transition"
          >
            <Wrench size={16} />
            Criar serviço
          </button>
          <button
            onClick={() => setNovoAlertaOpen(true)}
            className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-ink-900 text-sm font-semibold px-4 py-2 rounded-lg shadow-card transition"
          >
            <Bell size={16} />
            Incluir alerta
          </button>
          <button
            onClick={() => setNovoContratoOpen(true)}
            className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-ink-900 text-sm font-semibold px-4 py-2 rounded-lg shadow-card transition"
          >
            <FileText size={16} />
            Gerar contrato
          </button>
          <button
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-ink-900 text-sm font-semibold px-4 py-2 rounded-lg shadow-card transition"
          >
            <Pencil size={16} />
            Editar cliente
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${cliente.tipo === 'PJ' ? 'bg-ink-800/10 text-ink-800' : 'bg-brand-50 text-brand-600'}`}>
              {cliente.tipo === 'PJ' ? <Building2 size={26} /> : <User size={26} />}
            </div>
            <div>
              <h1 className="text-xl font-bold text-ink-900">{cliente.nome}</h1>
              <p className="text-sm text-slate-500">{cliente.tipo === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'} · {cliente.cnpj || cliente.cpf || 'Sem documento'}</p>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <ClienteStatusBadge status={cliente.status} />
                {cliente.recorrente && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
                    <Repeat size={12} /> Recorrente
                  </span>
                )}
                {cliente.possuiPet && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                    <PawPrint size={12} /> Possui pet
                  </span>
                )}
                {cliente.precisaEpi && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700 border border-violet-200">
                    <HardHat size={12} /> Precisa de EPI
                  </span>
                )}
                {getCategoriaById(cliente.categoriaId) && (
                  <span
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border"
                    style={{
                      color: getCategoriaById(cliente.categoriaId)!.cor,
                      borderColor: getCategoriaById(cliente.categoriaId)!.cor + '40',
                      backgroundColor: getCategoriaById(cliente.categoriaId)!.cor + '10',
                    }}
                  >
                    {getCategoriaById(cliente.categoriaId)!.nome}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs text-slate-400">Total investido</p>
            <p className="text-2xl font-bold text-ink-900">
              {totalGasto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
          <InfoItem icon={Mail} label="E-mail" value={cliente.email} />
          <InfoItem icon={Phone} label="Telefone" value={cliente.telefone} />
          <InfoItem icon={MapPin} label="Bairro" value={cliente.bairro || '-'} />
          <InfoItem
            icon={Calendar}
            label="Contrato"
            value={`${new Date(cliente.contratoInicio + 'T00:00:00').toLocaleDateString('pt-BR')} até ${new Date(cliente.contratoFim + 'T00:00:00').toLocaleDateString('pt-BR')}`}
          />
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100">
          <p className="text-xs font-medium text-slate-400 mb-3 flex items-center gap-1.5">
            <MapPin size={14} /> Endereços ({cliente.enderecos.length})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cliente.enderecos.map((end) => (
              <div key={end.id} className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs font-semibold text-brand-600 mb-0.5">{end.rotulo}</p>
                <p className="text-sm text-slate-700">{end.endereco}</p>
                <p className="text-xs text-slate-400">{end.cidade}/{end.uf} · {end.cep}</p>
              </div>
            ))}
            {cliente.enderecos.length === 0 && (
              <p className="text-sm text-slate-400">Nenhum endereço cadastrado.</p>
            )}
          </div>
        </div>
      </div>

      {alertasCliente.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-card">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-ink-900 flex items-center gap-2">
              <Bell size={16} className="text-brand-600" /> Alertas / Tarefas
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{alertasCliente.filter((a) => !a.concluido).length} pendente(s)</p>
          </div>
          <div className="divide-y divide-slate-50">
            {alertasCliente.map((a) => (
              <div key={a.id} className="px-6 py-3 flex items-center gap-3">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    a.prioridade === 'alta' ? 'bg-rose-500' : a.prioridade === 'media' ? 'bg-amber-500' : 'bg-slate-400'
                  }`}
                />
                <p className={`flex-1 text-sm ${a.concluido ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{a.texto}</p>
                <span className="text-xs text-slate-400 shrink-0">
                  {new Date(a.dataVencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                  {a.recorrente && ' ↻'}
                </span>
                {!a.concluido && (
                  <button
                    onClick={() => concluirAlerta(a.id)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 shrink-0"
                  >
                    <CheckCircle2 size={14} /> Concluir
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-card">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-ink-900">Histórico de serviços</h2>
          <p className="text-xs text-slate-400 mt-0.5">{historico.length} serviço(s) registrado(s)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="px-6 py-3 font-medium">Data</th>
                <th className="px-6 py-3 font-medium">Serviço</th>
                <th className="px-6 py-3 font-medium hidden sm:table-cell">Operador</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {historico.map((s) => (
                <tr key={s.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-6 py-3 text-slate-600 whitespace-nowrap">
                    {new Date(s.dataAgendada + 'T00:00:00').toLocaleDateString('pt-BR')} <span className="text-slate-400">{s.horaAgendada}</span>
                  </td>
                  <td className="px-6 py-3 font-medium text-ink-900">{s.tipoServico}</td>
                  <td className="px-6 py-3 hidden sm:table-cell text-slate-600">{s.operador}</td>
                  <td className="px-6 py-3"><ServicoStatusBadge status={s.status} /></td>
                  <td className="px-6 py-3 text-right text-slate-700">
                    {s.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                </tr>
              ))}
              {historico.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                    Nenhum serviço registrado para este cliente ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-card">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-ink-900">Contratos</h2>
          <p className="text-xs text-slate-400 mt-0.5">{contratosCliente.length} contrato(s) gerado(s)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="px-6 py-3 font-medium">Gerado em</th>
                <th className="px-6 py-3 font-medium">Vigência</th>
                <th className="px-6 py-3 font-medium hidden sm:table-cell">Serviços abrangidos</th>
                <th className="px-6 py-3 font-medium text-right">Valor total</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {contratosCliente.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setContratoVisualizando(c)}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer transition"
                >
                  <td className="px-6 py-3 text-slate-600 whitespace-nowrap">{new Date(c.criadoEm + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-3 text-slate-600 whitespace-nowrap">
                    {new Date(c.dataInicio + 'T00:00:00').toLocaleDateString('pt-BR')} - {new Date(c.dataFim + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-3 hidden sm:table-cell text-slate-600 truncate max-w-xs">{c.servicosAbrangidos}</td>
                  <td className="px-6 py-3 text-right text-slate-700">{c.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                  <td className="px-6 py-3 text-brand-600 text-xs font-semibold">Ver contrato</td>
                </tr>
              ))}
              {contratosCliente.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                    Nenhum contrato gerado para este cliente ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editOpen && <EditarClienteModal cliente={cliente} onClose={() => setEditOpen(false)} />}
      {novoServicoOpen && (
        <NovoServicoModal clienteIdInicial={cliente.id} onClose={() => setNovoServicoOpen(false)} />
      )}
      {novoContratoOpen && (
        <NovoContratoModal
          cliente={cliente}
          onClose={() => setNovoContratoOpen(false)}
          onCreated={(contrato) => setContratoVisualizando(contrato)}
        />
      )}
      {contratoVisualizando && (
        <ContratoViewModal contrato={contratoVisualizando} onClose={() => setContratoVisualizando(null)} />
      )}
      {novoAlertaOpen && <IncluirAlertaModal cliente={cliente} onClose={() => setNovoAlertaOpen(false)} />}
    </div>
  )
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={16} className="text-slate-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm text-slate-700 truncate">{value}</p>
      </div>
    </div>
  )
}
