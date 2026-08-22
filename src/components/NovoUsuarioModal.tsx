import React, { useState } from 'react'
import { X, UserPlus } from 'lucide-react'
import type { UserRole, Operador } from '../types'
import { USER_ROLES, USER_ROLE_LABELS } from '../types'
import { criarUsuario } from '../data/usuarioClient'
import { recarregarUsuarios } from '../data/perfilStore'

interface Props {
  operadores: Operador[]
  onClose: () => void
}

export default function NovoUsuarioModal({ operadores, onClose }: Props) {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [role, setRole] = useState<UserRole>('operador')
  const [operadorId, setOperadorId] = useState('')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    if (!nome.trim() || !email.trim() || !senha) {
      setErro('Preencha nome, e-mail e senha.')
      return
    }
    if (senha.length < 6) {
      setErro('A senha precisa ter pelo menos 6 caracteres.')
      return
    }

    setSalvando(true)
    const resultado = await criarUsuario({
      nome: nome.trim(),
      email: email.trim(),
      senha,
      role,
      operadorId: role === 'operador' ? operadorId || undefined : undefined,
    })
    setSalvando(false)

    if (resultado.error) {
      setErro(resultado.error)
      return
    }

    await recarregarUsuarios()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-soft w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-ink-900 flex items-center gap-2">
            <UserPlus size={18} className="text-brand-600" />
            Novo usuário
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">E-mail (login)</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Senha provisória</label>
            <input type="text" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="mín. 6 caracteres" className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Papel no sistema</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500 bg-white"
            >
              {USER_ROLES.map((r) => (
                <option key={r} value={r}>{USER_ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>

          {role === 'operador' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Vincular ao operador (equipe)</label>
              <select
                value={operadorId}
                onChange={(e) => setOperadorId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm outline-none focus:border-brand-500 bg-white"
              >
                <option value="">Selecione...</option>
                {operadores.map((o) => (
                  <option key={o.id} value={o.id}>{o.nome}</option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1">Define quais serviços aparecem na agenda desse login.</p>
            </div>
          )}

          {erro && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{erro}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">Cancelar</button>
            <button type="submit" disabled={salvando} className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-card disabled:opacity-60">
              {salvando ? 'Criando...' : 'Criar usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
