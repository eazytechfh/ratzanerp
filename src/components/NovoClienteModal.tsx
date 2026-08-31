import React, { useState } from 'react'
import { X } from 'lucide-react'
import type { Cliente, Endereco, TipoPessoa, OrigemServico } from '../types'
import { ORIGENS_SERVICO } from '../types'
import { addCliente } from '../data/clienteStore'
import { useCategorias } from '../data/categoriaStore'
import { addAlerta } from '../data/alertaStore'
import { registrarLog } from '../data/logStore'
import { useAuth } from '../context/AuthContext'
import EnderecosEditor from './EnderecosEditor'

interface Props {
  onClose: () => void
  onCreated: (cliente: Cliente) => void
}

function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

export default function NovoClienteModal({ onClose, onCreated }: Props) {
  const categorias = useCategorias()
  const { userEmail } = useAuth()
  const [tipo, setTipo] = useState<TipoPessoa>('PJ')
  const [nome, setNome] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [cpf, setCpf] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [bairro, setBairro] = useState('')
  const [contatoResponsavel, setContatoResponsavel] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [enderecos, setEnderecos] = useState<Endereco[]>([
    { id: 'end-novo-1', rotulo: 'Principal', endereco: '', cidade: 'Rio de Janeiro', uf: 'RJ', cep: '' },
  ])
  const [recorrente, setRecorrente] = useState(true)
  const [possuiPet, setPossuiPet] = useState(false)
  const [precisaEpi, setPrecisaEpi] = useState(false)
  const [origem, setOrigem] = useState<OrigemServico>('Indicação')
  const [contratoFim, setContratoFim] = useState('')
  const [reforcoSemestral, setReforcoSemestral] = useState(false)
  const [dataReforco, setDataReforco] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const errs: Record<string, string> = {}
    if (!nome.trim()) errs.nome = 'Nome é obrigatório'
    if (!email.trim()) errs.email = 'E-mail é obrigatório'
    if (!telefone.trim()) errs.telefone = 'Telefone é obrigatório'
    if (!contratoFim) errs.contratoFim = 'Data de fim do contrato é obrigatória'
    if (reforcoSemestral && !dataReforco) errs.dataReforco = 'Informe a data do próximo reforço'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const hojeStr = fmtDate(new Date())
    const fim = new Date(contratoFim)
    const hoje = new Date()
    const diffDays = Math.floor((fim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
    const status = diffDays < 0 ? 'vencido' : diffDays <= 30 ? 'vencendo' : 'ativo'

    const novo: Cliente = {
      id: `cli-${Date.now()}`,
      tipo,
      nome: nome.trim(),
      cnpj: tipo === 'PJ' ? cnpj.trim() : undefined,
      cpf: cpf.trim() || undefined,
      email: email.trim(),
      telefone: telefone.trim(),
      bairro: bairro.trim(),
      contatoResponsavel: tipo === 'PJ' ? contatoResponsavel.trim() || undefined : undefined,
      categoriaId: categoriaId || undefined,
      enderecos,
      status,
      dataCadastro: hojeStr,
      contratoInicio: hojeStr,
      contratoFim,
      recorrente,
      possuiPet,
      precisaEpi,
      origem,
    }

    const created = await addCliente(novo)
    if (!created) {
      setErrors({ nome: 'Não foi possível salvar o cliente. Tente novamente.' })
      return
    }
    registrarLog(userEmail ?? 'sistema', 'Cliente cadastrado', created.nome)

    if (reforcoSemestral && dataReforco) {
      await addAlerta({
        id: `alerta-${Date.now()}`,
        clienteId: created.id,
        clienteNome: created.nome,
        texto: 'Agendar aplicação de reforço semestral (plano anual)',
        prioridade: 'media',
        concluido: false,
        criadoPor: userEmail ?? 'sistema',
        criadoEm: new Date().toISOString(),
        dataVencimento: dataReforco,
        recorrente: true,
        frequencia: 'semestral',
      })
      registrarLog(userEmail ?? 'sistema', 'Alerta de reforço semestral criado', created.nome)
    }

    onCreated(created)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-soft w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-ink-900">Novo cliente</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="flex gap-2">
            {(['PJ', 'PF'] as TipoPessoa[]).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setTipo(t)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition ${
                  tipo === t
                    ? 'bg-brand-600 border-brand-600 text-white'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              {tipo === 'PJ' ? 'Razão social / Nome fantasia' : 'Nome completo'}
            </label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
            />
            {errors.nome && <p className="text-xs text-rose-600 mt-1">{errors.nome}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                CNPJ <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <input
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                placeholder="00.000.000/0001-00"
                disabled={tipo === 'PF'}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm disabled:bg-slate-50 disabled:text-slate-400"
              />
              {errors.cnpj && <p className="text-xs text-rose-600 mt-1">{errors.cnpj}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                CPF <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <input
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                placeholder="000.000.000-00"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
              />
              {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Telefone</label>
              <input
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(21) 90000-0000"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
              />
              {errors.telefone && <p className="text-xs text-rose-600 mt-1">{errors.telefone}</p>}
            </div>
          </div>

          {tipo === 'PJ' && (
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
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Origem</label>
            <select
              value={origem}
              onChange={(e) => setOrigem(e.target.value as OrigemServico)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm bg-white"
            >
              {ORIGENS_SERVICO.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          <EnderecosEditor enderecos={enderecos} onChange={setEnderecos} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
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
            <label className="flex items-center gap-2 pb-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={recorrente}
                onChange={(e) => setRecorrente(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-200"
              />
              Cliente recorrente
            </label>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={reforcoSemestral}
                onChange={(e) => {
                  setReforcoSemestral(e.target.checked)
                  if (!e.target.checked) setDataReforco('')
                }}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-200"
              />
              Plano anual com reforço a cada 6 meses
            </label>
            {reforcoSemestral && (
              <div className="mt-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Data do próximo reforço</label>
                <input
                  type="date"
                  value={dataReforco}
                  onChange={(e) => setDataReforco(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
                />
                {errors.dataReforco && <p className="text-xs text-rose-600 mt-1">{errors.dataReforco}</p>}
                <p className="text-xs text-slate-500 mt-1">
                  Cria um alerta recorrente semestral no cadastro do cliente para não esquecer de agendar o reforço.
                </p>
              </div>
            )}
          </div>

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
              Salvar cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
