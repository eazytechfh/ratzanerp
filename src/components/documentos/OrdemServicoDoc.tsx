import React from 'react'
import { OSHeader } from './RatzanHeader'
import { getCategoriaById } from '../../data/categoriaStore'
import type { Cliente, Servico } from '../../types'

interface Props {
  servico: Servico
  cliente?: Cliente
}

const FORMA_LABEL: Record<Servico['formaPagamento'], string> = {
  pix: 'Pix',
  transferencia: 'Transferência',
  debito: 'Débito',
  credito: 'Crédito',
  boleto_pj: 'Boleto PJ',
  garantia: 'Garantia',
  dinheiro: 'Dinheiro',
  incluso_no_contrato: 'Incluso no Contrato',
}

function fmtDataLonga(dataStr: string) {
  const d = new Date(dataStr + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { weekday: 'long', month: 'long', day: '2-digit', year: 'numeric' })
    .replace(/^\w/, (c) => c.toUpperCase())
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[240px_1fr] gap-1 sm:gap-4 py-2 border-b border-slate-100 last:border-0">
      <p className="text-sm font-bold text-ink-900">{label}</p>
      <div className="text-sm text-slate-700">{children}</div>
    </div>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium mr-1.5 mb-1">
      {children}
    </span>
  )
}

export default function OrdemServicoDoc({ servico, cliente }: Props) {
  const baixa = servico.baixa
  const dataServico = baixa?.dataServico ?? servico.dataAgendada
  const garantiaAte = baixa?.garantiaAte
  const horaInicio = baixa?.horaInicio ?? servico.horaAgendada
  const horaFim = baixa?.horaFim
  const pragas = (baixa?.pragas ?? servico.pragas).length > 0 ? (baixa?.pragas ?? servico.pragas) : ['-']
  const categoria = getCategoriaById(cliente?.categoriaId)?.nome

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 space-y-4 max-w-3xl mx-auto">
      <OSHeader titulo="ORDEM DE SERVIÇO" />

      <div>
        <Campo label="Data do Serviço:">{fmtDataLonga(dataServico)}</Campo>
        <Campo label="Garantia do Serviço:">{garantiaAte ? fmtDataLonga(garantiaAte) : '-'}</Campo>
        <Campo label="Horário:">{horaInicio}{horaFim ? ` - ${horaFim}` : ''}</Campo>
        <Campo label="Telefone">{cliente?.telefone ?? '-'}</Campo>
        <Campo label="Nome do Operador:">{servico.operador}</Campo>
        <Campo label="Nome do Cliente ou Estabelecimento:">{servico.clienteNome}</Campo>
        <Campo label="E-mail do Cliente:">{cliente?.email ?? '-'}</Campo>
        <Campo label="Endereço do Serviço:">{servico.endereco || '-'}</Campo>
        <Campo label="Bairro:">{cliente?.bairro ?? '-'}</Campo>
        <Campo label="Forma de Pagamento"><Badge>{FORMA_LABEL[servico.formaPagamento]}</Badge></Campo>
        <Campo label="Serviço (s) Contratado (s)"><Badge>{servico.tipoServico}</Badge></Campo>
        <Campo label="Qual praga?">{pragas.map((p) => <Badge key={p}>{p}</Badge>)}</Campo>
        <Campo label="Categoria">{categoria ? <Badge>{categoria}</Badge> : '-'}</Campo>
        <Campo label="Aplicação">
          <Badge>{baixa ? (baixa.aplicacao === 'reforco' ? 'Reforço' : '1º Aplicação') : '1º Aplicação'}</Badge>
        </Campo>
        <div className="py-2">
          <p className="text-sm font-bold text-ink-900 mb-1">Observações:</p>
          <p className="text-sm text-slate-600">{baixa?.observacoes || servico.observacoes || '-'}</p>
        </div>
        <Campo label="Nome do Atendente:">{servico.operador}</Campo>
        <div className="py-2">
          <p className="text-sm font-bold text-ink-900 mb-2">Assinatura do Responsável:</p>
          {baixa?.assinaturaCliente ? (
            <img src={baixa.assinaturaCliente} alt="Assinatura do cliente" className="h-20 border-b border-slate-300" />
          ) : (
            <p className="text-sm text-slate-400">Pendente — disponível após dar baixa no serviço.</p>
          )}
        </div>
      </div>
    </div>
  )
}
