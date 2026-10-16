import React, { useEffect, useRef, useState } from 'react'
import { Pencil, RotateCcw, CheckCheck } from 'lucide-react'
import { OSHeader } from './RatzanHeader'
import { getCategoriaById } from '../../data/categoriaStore'
import type { Cliente, Servico } from '../../types'
import { useAuth } from '../../context/AuthContext'
import { descreverAlteracoes, registrarEdicaoDocumento } from '../../lib/edicaoDocumento'

const ROTULOS: Record<keyof Dados, string> = {
  dataServico: 'Data do serviço',
  garantiaAte: 'Garantia até',
  horaInicio: 'Hora início',
  horaFim: 'Hora fim',
  telefone: 'Telefone',
  operador: 'Operador',
  clienteNome: 'Nome do cliente',
  email: 'E-mail',
  endereco: 'Endereço',
  bairro: 'Bairro',
  valor: 'Valor',
  formaPagamento: 'Forma de pagamento',
  tipoServico: 'Serviço contratado',
  pragas: 'Pragas',
  categoria: 'Categoria',
  aplicacao: 'Aplicação',
  observacoes: 'Observações',
  atendente: 'Atendente',
}

interface Props {
  servico: Servico
  cliente?: Cliente
  // Gerentes e administrador podem ajustar a OS antes de baixar/enviar.
  // A edição vale só para esta tela (e para o PDF/impressão) — não altera o serviço salvo.
  podeEditar?: boolean
}

interface Dados {
  dataServico: string
  garantiaAte: string
  horaInicio: string
  horaFim: string
  telefone: string
  operador: string
  clienteNome: string
  email: string
  endereco: string
  bairro: string
  valor: string
  formaPagamento: string
  tipoServico: string
  pragas: string
  categoria: string
  aplicacao: string
  observacoes: string
  atendente: string
}

const inputCls = 'w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500'

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
  if (!dataStr) return '-'
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

export default function OrdemServicoDoc({ servico, cliente, podeEditar }: Props) {
  const baixa = servico.baixa
  const categoria = getCategoriaById(cliente?.categoriaId)?.nome
  const original: Dados = {
    dataServico: baixa?.dataServico ?? servico.dataAgendada,
    garantiaAte: baixa?.garantiaAte ?? '',
    // Horário em que o serviço foi iniciado de fato; o agendado só entra se nunca foi iniciado.
    horaInicio: baixa?.horaInicio ?? servico.horaInicioReal ?? servico.horaAgendada,
    horaFim: baixa?.horaFim ?? '',
    telefone: cliente?.telefone ?? '',
    operador: servico.operador,
    clienteNome: servico.clienteNome,
    email: cliente?.email ?? '',
    endereco: servico.endereco || '',
    bairro: cliente?.bairro ?? '',
    valor: String(servico.valor),
    formaPagamento: `${FORMA_LABEL[servico.formaPagamento]}${servico.parcelas ? ` · ${servico.parcelas}x` : ''}`,
    tipoServico: servico.tipoServico,
    pragas: (baixa?.pragas ?? servico.pragas).join(', '),
    categoria: categoria ?? '',
    aplicacao: baixa ? (baixa.aplicacao === 'reforco' ? 'Reforço' : '1º Aplicação') : '1º Aplicação',
    observacoes: baixa?.observacoes || servico.observacoes || '',
    atendente: servico.operador,
  }
  const [dados, setDados] = useState<Dados>(original)
  const [editando, setEditando] = useState(false)
  const [alterado, setAlterado] = useState(false)
  const { userEmail, perfil } = useAuth()
  // Última versão já registrada no Log, para não repetir a mesma edição.
  const registrado = useRef<Dados>(original)
  const dadosRef = useRef(dados)
  dadosRef.current = dados

  const registrarAlteracoes = () => {
    const alteracoes = descreverAlteracoes(registrado.current, dadosRef.current, ROTULOS)
    if (alteracoes.length === 0) return
    registrarEdicaoDocumento(perfil?.nome ?? userEmail ?? 'sistema', 'Ordem de Serviço', `${servico.tipoServico} — ${servico.clienteNome}`, alteracoes)
    registrado.current = dadosRef.current
  }
  const registrarRef = useRef(registrarAlteracoes)
  registrarRef.current = registrarAlteracoes

  // Imprimir/salvar PDF com a edição ainda aberta também conta como uso do documento editado.
  useEffect(() => {
    const handler = () => registrarRef.current()
    window.addEventListener('beforeprint', handler)
    return () => window.removeEventListener('beforeprint', handler)
  }, [])

  // Trocou de serviço: volta à OS original.
  useEffect(() => {
    setDados(original)
    registrado.current = original
    setEditando(false)
    setAlterado(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servico.id])

  const set = (k: keyof Dados, v: string) => { setDados((d) => ({ ...d, [k]: v })); setAlterado(true) }
  const restaurar = () => { setDados(original); registrado.current = original; setAlterado(false); setEditando(false) }
  const inp = (k: keyof Dados, type = 'text') => (
    <input type={type} value={dados[k]} onChange={(e) => set(k, e.target.value)} className={inputCls} />
  )

  const listaPragas = dados.pragas.split(',').map((p) => p.trim()).filter(Boolean)
  const valorNum = Number(dados.valor.replace(',', '.'))
  const valorTxt = dados.valor.trim() !== '' && !Number.isNaN(valorNum)
    ? valorNum.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : dados.valor || '-'
  const horario = `${dados.horaInicio}${dados.horaFim ? ` - ${dados.horaFim}` : ''}`

  return (
    <div className="space-y-3 max-w-3xl mx-auto print:max-w-none print:mx-0">
      {podeEditar && (
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          {editando ? (
            <button onClick={() => { setEditando(false); registrarAlteracoes() }} className="inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-3.5 py-2 rounded-lg transition">
              <CheckCheck size={15} /> Concluir edição
            </button>
          ) : (
            <button onClick={() => setEditando(true)} className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-ink-900 text-sm font-semibold px-3.5 py-2 rounded-lg shadow-card transition">
              <Pencil size={15} /> Editar ordem de serviço
            </button>
          )}
          {alterado && (
            <button onClick={restaurar} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-ink-900 px-2 py-2 transition">
              <RotateCcw size={14} /> Restaurar original
            </button>
          )}
          <p className="text-xs text-slate-400 basis-full sm:basis-auto">
            A edição vale só para esta OS: depois use "Imprimir / Salvar PDF" e envie manualmente. Os dados do serviço não são alterados.
          </p>
        </div>
      )}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 space-y-4 print:rounded-none print:border-0 print:shadow-none">
        <OSHeader titulo="ORDEM DE SERVIÇO" />

        <div>
          <Campo label="Data do Serviço:">{editando ? inp('dataServico', 'date') : fmtDataLonga(dados.dataServico)}</Campo>
          <Campo label="Garantia do Serviço:">{editando ? inp('garantiaAte', 'date') : fmtDataLonga(dados.garantiaAte)}</Campo>
          <Campo label="Horário:">
            {editando ? (
              <div className="flex items-center gap-2">{inp('horaInicio', 'time')}<span className="text-slate-400">-</span>{inp('horaFim', 'time')}</div>
            ) : horario}
          </Campo>
          <Campo label="Telefone">{editando ? inp('telefone') : dados.telefone || '-'}</Campo>
          <Campo label="Nome do Operador:">{editando ? inp('operador') : dados.operador}</Campo>
          <Campo label="Nome do Cliente ou Estabelecimento:">{editando ? inp('clienteNome') : dados.clienteNome}</Campo>
          <Campo label="E-mail do Cliente:">{editando ? inp('email') : dados.email || '-'}</Campo>
          <Campo label="Endereço do Serviço:">{editando ? inp('endereco') : dados.endereco || '-'}</Campo>
          <Campo label="Bairro:">{editando ? inp('bairro') : dados.bairro || '-'}</Campo>
          <Campo label="Valor do Serviço">
            {editando ? inp('valor') : <span className="text-base font-bold text-brand-700">{valorTxt}</span>}
          </Campo>
          <Campo label="Forma de Pagamento">{editando ? inp('formaPagamento') : <Badge>{dados.formaPagamento}</Badge>}</Campo>
          <Campo label="Serviço (s) Contratado (s)">{editando ? inp('tipoServico') : <Badge>{dados.tipoServico}</Badge>}</Campo>
          <Campo label="Qual praga?">
            {editando ? inp('pragas') : (listaPragas.length > 0 ? listaPragas : ['-']).map((p) => <Badge key={p}>{p}</Badge>)}
          </Campo>
          <Campo label="Categoria">{editando ? inp('categoria') : dados.categoria ? <Badge>{dados.categoria}</Badge> : '-'}</Campo>
          <Campo label="Aplicação">{editando ? inp('aplicacao') : <Badge>{dados.aplicacao}</Badge>}</Campo>
          <div className="py-2">
            <p className="text-sm font-bold text-ink-900 mb-1">Observações:</p>
            {editando ? (
              <textarea value={dados.observacoes} onChange={(e) => set('observacoes', e.target.value)} rows={3} className={inputCls} />
            ) : (
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{dados.observacoes || '-'}</p>
            )}
          </div>
          <Campo label="Nome do Atendente:">{editando ? inp('atendente') : dados.atendente}</Campo>
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
    </div>
  )
}
