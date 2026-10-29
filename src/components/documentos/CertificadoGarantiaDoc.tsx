import React, { useEffect, useRef, useState } from 'react'
import { Check, Pencil, RotateCcw, CheckCheck } from 'lucide-react'
import { CertificadoHeader } from './RatzanHeader'
import type { Cliente, Servico } from '../../types'
import { descreverAlteracoes, registrarEdicaoDocumento } from '../../lib/edicaoDocumento'

const ROTULOS: Record<keyof Dados, string> = {
  clienteNome: 'Nome do cliente',
  endereco: 'Endereço',
  bairro: 'Bairro',
  tipoServico: 'Serviço contratado',
  dataServico: 'Data do serviço',
  garantiaAte: 'Garantia até',
  horaInicio: 'Hora início',
  horaFim: 'Hora fim',
  pragas: 'Pragas',
}

interface Props {
  servico: Servico
  cliente?: Cliente
  // Gerentes e administrador podem ajustar o certificado antes de baixar/enviar.
  // A edição vale só para esta tela (e para o PDF/impressão) — não altera o serviço salvo.
  podeEditar?: boolean
  // Quem edita (para o Log). Vem de fora porque este componente também é desenhado fora da
  // árvore do app (PDF do e-mail), onde não existe contexto de login — não pode usar useAuth.
  usuarioLog?: string
}

interface Dados {
  clienteNome: string
  endereco: string
  bairro: string
  tipoServico: string
  dataServico: string
  garantiaAte: string
  horaInicio: string
  horaFim: string
  pragas: string
}

const inputCls = 'w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500'

function fmtData(dataStr?: string) {
  if (!dataStr) return '-'
  return new Date(dataStr + 'T00:00:00').toLocaleDateString('pt-BR')
}

function Campo({ label, value, edit }: { label: string; value: React.ReactNode; edit?: React.ReactNode }) {
  return (
    <div className="mb-3">
      <p className="text-xs font-bold text-ink-900">{label}</p>
      {edit ? <div className="mt-0.5">{edit}</div> : <p className="text-sm text-slate-700 mt-0.5">{value}</p>}
    </div>
  )
}

function ChecklistLinha({ label, itens }: { label: string; itens: string[] }) {
  return (
    <div className="mb-3">
      <p className="text-xs font-bold text-ink-900 mb-1">{label}</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {itens.map((item) => (
          <span key={item} className="inline-flex items-center gap-1 text-sm text-slate-700">
            <span className="w-4 h-4 rounded-sm bg-brand-600 text-white flex items-center justify-center shrink-0">
              <Check size={12} />
            </span>
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function CertificadoGarantiaDoc({ servico, cliente, podeEditar, usuarioLog }: Props) {
  const baixa = servico.baixa
  const original: Dados = {
    clienteNome: servico.clienteNome,
    endereco: servico.endereco || '',
    bairro: cliente?.bairro ?? '',
    tipoServico: servico.tipoServico,
    dataServico: baixa?.dataServico ?? servico.dataAgendada,
    garantiaAte: baixa?.garantiaAte ?? '',
    horaInicio: baixa?.horaInicio ?? servico.horaInicioReal ?? servico.horaAgendada,
    horaFim: baixa?.horaFim ?? '',
    pragas: (baixa?.pragas ?? servico.pragas).join(', '),
  }
  const [dados, setDados] = useState<Dados>(original)
  const [editando, setEditando] = useState(false)
  const [alterado, setAlterado] = useState(false)
  // Última versão já registrada no Log, para não repetir a mesma edição.
  const registrado = useRef<Dados>(original)
  const dadosRef = useRef(dados)
  dadosRef.current = dados

  const registrarAlteracoes = () => {
    const alteracoes = descreverAlteracoes(registrado.current, dadosRef.current, ROTULOS)
    if (alteracoes.length === 0) return
    registrarEdicaoDocumento(usuarioLog ?? 'sistema', 'Certificado de Garantia', `${servico.tipoServico} — ${servico.clienteNome}`, alteracoes)
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

  // Trocou de serviço: volta ao certificado original.
  useEffect(() => {
    setDados(original)
    registrado.current = original
    setEditando(false)
    setAlterado(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [servico.id])

  const set = (k: keyof Dados, v: string) => { setDados((d) => ({ ...d, [k]: v })); setAlterado(true) }
  const restaurar = () => { setDados(original); registrado.current = original; setAlterado(false); setEditando(false) }

  const listaPragas = dados.pragas.split(',').map((p) => p.trim()).filter(Boolean)
  const horario = `${dados.horaInicio}${dados.horaFim ? ` - ${dados.horaFim}` : ''}`
  const txt = (k: keyof Dados, type = 'text') => (
    <input type={type} value={dados[k]} onChange={(e) => set(k, e.target.value)} className={inputCls} />
  )

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
              <Pencil size={15} /> Editar certificado
            </button>
          )}
          {alterado && (
            <button onClick={restaurar} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-ink-900 px-2 py-2 transition">
              <RotateCcw size={14} /> Restaurar original
            </button>
          )}
          <p className="text-xs text-slate-400 basis-full sm:basis-auto">
            A edição vale só para este certificado: depois use "Imprimir / Salvar PDF" e envie manualmente. Os dados do serviço não são alterados.
          </p>
        </div>
      )}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 space-y-4 print:rounded-none print:border-0 print:shadow-none">
      <CertificadoHeader />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
        <div>
          <Campo label="Nome do Cliente ou Estabelecimento:" value={dados.clienteNome} edit={editando && txt('clienteNome')} />
          <Campo label="Endereço do Serviço:" value={dados.endereco || '-'} edit={editando && txt('endereco')} />
          <Campo label="Bairro:" value={dados.bairro || '-'} edit={editando && txt('bairro')} />
          {editando ? (
            <Campo label="Serviço Contratado:" value="" edit={txt('tipoServico')} />
          ) : (
            <ChecklistLinha label="Serviço Contratado:" itens={[dados.tipoServico]} />
          )}
        </div>
        <div>
          <Campo label="Data do Serviço:" value={fmtData(dados.dataServico)} edit={editando && txt('dataServico', 'date')} />
          <Campo label="Garantia do Serviço:" value={fmtData(dados.garantiaAte)} edit={editando && txt('garantiaAte', 'date')} />
          <Campo
            label="Horário:"
            value={horario}
            edit={editando && (
              <div className="flex items-center gap-2">
                {txt('horaInicio', 'time')}<span className="text-slate-400">-</span>{txt('horaFim', 'time')}
              </div>
            )}
          />
          {editando ? (
            <Campo label="Praga (separe por vírgula):" value="" edit={txt('pragas')} />
          ) : (
            <ChecklistLinha label="Praga:" itens={listaPragas.length > 0 ? listaPragas : ['-']} />
          )}
        </div>
      </div>

      {!baixa && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Certificado em pré-visualização — os dados finais são confirmados ao dar baixa no serviço.
        </p>
      )}

      <div className="pt-6 flex flex-col sm:flex-row sm:flex-wrap sm:items-end sm:justify-between gap-6 border-t border-slate-100">
        <div className="text-xs text-slate-500 leading-relaxed">
          <p className="font-semibold text-ink-900 mb-1">Telefones de utilização pública e emergência:</p>
          <p>- Centro de informações toxicológicas: DDG 08006435252 (24h)</p>
          <p>- Defesa Civil: (21) 3232-2371</p>
          <p>- Ibama: (21) 3077-4252</p>
          <p>- Bombeiros: 193 / Polícia Militar: 190 / SAMU: 192</p>
        </div>
        <div className="text-center shrink-0">
          <div className="border border-slate-300 rounded px-4 py-2 text-[10px] text-slate-500 mb-1">
            43.238.618/0001-05
          </div>
          <p className="text-xs text-slate-500 leading-tight">
            RATZAN CONTROLE DE PRAGAS LTDA<br />
            R. Conselheiro Lampreia, 191<br />
            Cosme Velho · Cep 22241-230<br />
            Rio de Janeiro - RJ
          </p>
          <p className="text-xs font-semibold text-ink-900 mt-2">Ratzan Controle de Pragas</p>
        </div>
      </div>
      </div>
    </div>
  )
}
