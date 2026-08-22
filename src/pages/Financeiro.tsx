import React, { useMemo, useState } from 'react'
import { LayoutDashboard, Target, ArrowDownCircle, ArrowUpCircle, Repeat, Rocket, Plug, LineChart } from 'lucide-react'
import FinanceiroDashboard from '../components/financeiro/FinanceiroDashboard'
import MetaTab from '../components/financeiro/MetaTab'
import ContasPagarTab from '../components/financeiro/ContasPagarTab'
import ContasReceberTab from '../components/financeiro/ContasReceberTab'
import FluxoCaixaTab from '../components/financeiro/FluxoCaixaTab'
import LeadsTrafegoTab from '../components/financeiro/LeadsTrafegoTab'
import IntegracoesTab from '../components/financeiro/IntegracoesTab'
import PrevisibilidadeTab from '../components/financeiro/PrevisibilidadeTab'
import { useAuth } from '../context/AuthContext'
import { podeVerAbaFinanceiro } from '../lib/permissions'

type Aba = 'dashboard' | 'previsibilidade' | 'meta' | 'pagar' | 'receber' | 'fluxo' | 'trafego' | 'integracoes'

const ABAS: { key: Aba; label: string; icon: React.ElementType }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'previsibilidade', label: 'Previsibilidade', icon: LineChart },
  { key: 'meta', label: 'Meta', icon: Target },
  { key: 'pagar', label: 'Contas a Pagar', icon: ArrowDownCircle },
  { key: 'receber', label: 'Contas a Receber', icon: ArrowUpCircle },
  { key: 'fluxo', label: 'Fluxo de Caixa', icon: Repeat },
  { key: 'trafego', label: 'Leads de Tráfego', icon: Rocket },
  { key: 'integracoes', label: 'Integrações', icon: Plug },
]

export default function Financeiro() {
  const [aba, setAba] = useState<Aba>('dashboard')
  const { perfil } = useAuth()
  const abasVisiveis = useMemo(
    () => ABAS.filter((a) => !perfil || podeVerAbaFinanceiro(perfil.role, a.key)),
    [perfil],
  )

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Financeiro</h1>
        <p className="text-slate-500 text-sm mt-0.5">Visão financeira completa da operação</p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        {abasVisiveis.map((a) => (
          <button
            key={a.key}
            onClick={() => setAba(a.key)}
            className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-t-lg text-sm font-medium transition border-b-2 ${
              aba === a.key
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-ink-900'
            }`}
          >
            <a.icon size={16} />
            {a.label}
          </button>
        ))}
      </div>

      {aba === 'dashboard' && <FinanceiroDashboard />}
      {aba === 'previsibilidade' && <PrevisibilidadeTab />}
      {aba === 'meta' && <MetaTab />}
      {aba === 'pagar' && <ContasPagarTab />}
      {aba === 'receber' && <ContasReceberTab />}
      {aba === 'fluxo' && <FluxoCaixaTab />}
      {aba === 'trafego' && <LeadsTrafegoTab />}
      {aba === 'integracoes' && <IntegracoesTab />}
    </div>
  )
}
