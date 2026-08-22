import React, { useMemo, useState } from 'react'
import { Search, History } from 'lucide-react'
import { useLogs } from '../data/logStore'

export default function Logs() {
  const logs = useLogs()
  const [busca, setBusca] = useState('')

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return logs
    return logs.filter(
      (l) => l.usuario.toLowerCase().includes(q) || l.acao.toLowerCase().includes(q) || l.detalhes.toLowerCase().includes(q),
    )
  }, [logs, busca])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink-900 flex items-center gap-2">
          <History size={22} className="text-brand-600" />
          Logs do sistema
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">Histórico de movimentações realizadas pelos usuários</p>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por usuário, ação ou detalhe..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm bg-white shadow-card"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-slate-100">
              <th className="px-4 py-3 font-medium">Data/Hora</th>
              <th className="px-4 py-3 font-medium">Usuário</th>
              <th className="px-4 py-3 font-medium">Ação</th>
              <th className="px-4 py-3 font-medium">Detalhes</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((l) => (
              <tr key={l.id} className="border-b border-slate-50 last:border-0">
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{new Date(l.data).toLocaleString('pt-BR')}</td>
                <td className="px-4 py-3 text-slate-700">{l.usuario}</td>
                <td className="px-4 py-3 font-medium text-ink-900">{l.acao}</td>
                <td className="px-4 py-3 text-slate-600">{l.detalhes}</td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-400">Nenhum registro encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
