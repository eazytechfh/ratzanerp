import React, { useMemo, useState } from 'react'
import { Plus, Search, Phone, MapPin, Briefcase, Pencil, Trash2, UserRound, Users, KeyRound } from 'lucide-react'
import { useOperadores, removeOperador } from '../data/operadorStore'
import { useServicos } from '../data/servicoStore'
import { useUsuarios, recarregarUsuarios } from '../data/perfilStore'
import { excluirUsuario } from '../data/usuarioClient'
import { useAuth } from '../context/AuthContext'
import { USER_ROLE_LABELS } from '../types'
import OperadorModal from '../components/OperadorModal'
import NovoUsuarioModal from '../components/NovoUsuarioModal'
import EditarUsuarioModal from '../components/EditarUsuarioModal'
import type { Operador, Perfil } from '../types'

type SubAba = 'operadores' | 'usuarios'

export default function Equipe() {
  const operadores = useOperadores()
  const servicos = useServicos()
  const usuarios = useUsuarios()
  const { perfil } = useAuth()
  const [subAba, setSubAba] = useState<SubAba>('operadores')
  const [busca, setBusca] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Operador | null>(null)
  const [novoUsuarioOpen, setNovoUsuarioOpen] = useState(false)
  const [editandoUsuario, setEditandoUsuario] = useState<Perfil | null>(null)
  const [excluindoId, setExcluindoId] = useState<string | null>(null)

  function podeEditarUsuario(u: Perfil) {
    if (perfil?.role === 'administrador') return true
    if (perfil?.role === 'gerente_geral') return u.role === 'operador'
    return false
  }

  async function handleExcluirUsuario(u: Perfil) {
    if (!window.confirm(`Excluir o acesso de ${u.nome} (${u.email})? Esta ação não pode ser desfeita.`)) return
    setExcluindoId(u.id)
    const resultado = await excluirUsuario(u.id)
    setExcluindoId(null)
    if (resultado.error) {
      alert(resultado.error)
      return
    }
    await recarregarUsuarios()
  }

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return operadores
    return operadores.filter(
      (o) =>
        o.nome.toLowerCase().includes(q) ||
        (o.cargo ?? '').toLowerCase().includes(q) ||
        (o.telefone ?? '').toLowerCase().includes(q),
    )
  }, [operadores, busca])

  function servicosConcluidos(nome: string) {
    return servicos.filter((s) => s.operador === nome && s.status === 'concluido').length
  }

  function handleRemover(id: string) {
    removeOperador(id)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Equipe</h1>
          <p className="text-slate-500 text-sm mt-0.5">{operadores.length} operadores · {usuarios.length} usuário(s) com login</p>
        </div>
        {subAba === 'operadores' ? (
          <button
            onClick={() => {
              setEditando(null)
              setModalOpen(true)
            }}
            className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-card transition self-start"
          >
            <Plus size={18} />
            Novo operador
          </button>
        ) : (
          perfil?.role === 'administrador' && (
            <button
              onClick={() => setNovoUsuarioOpen(true)}
              className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg shadow-card transition self-start"
            >
              <KeyRound size={18} />
              Novo usuário
            </button>
          )
        )}
      </div>

      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setSubAba('operadores')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${
            subAba === 'operadores' ? 'bg-white text-ink-900 shadow-sm' : 'text-slate-500 hover:text-ink-900'
          }`}
        >
          <UserRound size={15} /> Operadores
        </button>
        <button
          onClick={() => setSubAba('usuarios')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition ${
            subAba === 'usuarios' ? 'bg-white text-ink-900 shadow-sm' : 'text-slate-500 hover:text-ink-900'
          }`}
        >
          <Users size={15} /> Usuários e acessos
        </button>
      </div>

      {subAba === 'operadores' && (
        <>
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, cargo ou telefone..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm bg-white shadow-card"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtrados.map((op) => (
              <div key={op.id} className="bg-white rounded-xl border border-slate-200 shadow-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                      <UserRound size={22} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-ink-900 truncate">{op.nome}</p>
                      <p className="text-xs text-slate-400">{op.cargo || 'Sem cargo definido'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditando(op)
                        setModalOpen(true)
                      }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-ink-900 hover:bg-slate-50"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleRemover(op.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone size={14} className="text-slate-400 shrink-0" />
                    <span>{op.telefone || '-'}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5" />
                    <span className="truncate">{op.endereco || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Briefcase size={14} className="text-slate-400 shrink-0" />
                    <span>{servicosConcluidos(op.nome)} serviços concluídos</span>
                  </div>
                </div>
              </div>
            ))}
            {filtrados.length === 0 && (
              <div className="col-span-full text-center py-10 text-slate-400 bg-white rounded-xl border border-slate-200">
                Nenhum operador encontrado.
              </div>
            )}
          </div>
        </>
      )}

      {subAba === 'usuarios' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
          {perfil?.role !== 'administrador' && (
            <div className="px-5 py-3 bg-amber-50 border-b border-amber-200 text-xs text-amber-800">
              Somente administradores podem criar novos logins.
            </div>
          )}
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">E-mail</th>
                <th className="px-4 py-3 font-medium">Papel</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Vinculado a</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3 font-medium text-ink-900">{u.nome}</td>
                  <td className="px-4 py-3 hidden sm:table-cell text-slate-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border bg-slate-50 text-slate-700 border-slate-200">
                      {USER_ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-slate-600">
                    {operadores.find((o) => o.id === u.operadorId)?.nome ?? '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      {podeEditarUsuario(u) && (
                        <button
                          onClick={() => setEditandoUsuario(u)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-ink-900 hover:bg-slate-50"
                          title="Editar usuário"
                        >
                          <Pencil size={15} />
                        </button>
                      )}
                      {perfil?.role === 'administrador' && (
                        <button
                          onClick={() => handleExcluirUsuario(u)}
                          disabled={excluindoId === u.id}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                          title="Excluir usuário"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400">Nenhum usuário cadastrado ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <OperadorModal
          operador={editando ?? undefined}
          onClose={() => {
            setModalOpen(false)
            setEditando(null)
          }}
        />
      )}
      {novoUsuarioOpen && (
        <NovoUsuarioModal operadores={operadores} onClose={() => setNovoUsuarioOpen(false)} />
      )}
      {editandoUsuario && (
        <EditarUsuarioModal
          usuario={editandoUsuario}
          operadores={operadores}
          podeAlterarPapel={perfil?.role === 'administrador'}
          onClose={() => setEditandoUsuario(null)}
        />
      )}
    </div>
  )
}
