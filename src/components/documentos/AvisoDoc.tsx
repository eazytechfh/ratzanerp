import React from 'react'
import { Bug } from 'lucide-react'
import type { Servico } from '../../types'

interface Props {
  servico: Servico
}

const DIAS_SEMANA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

function fmtAviso(dataStr: string, horaStr: string) {
  const d = new Date(dataStr + 'T00:00:00')
  const dia = String(d.getDate()).padStart(2, '0')
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const semana = DIAS_SEMANA[d.getDay()]
  const [h, m] = horaStr.split(':')
  const hora = m && m !== '00' ? `${Number(h)}h${m}` : `${Number(h)}h`
  return `${dia}/${mes} - ${semana} às ${hora}`
}

export default function AvisoDoc({ servico }: Props) {
  const dataHora = fmtAviso(servico.dataAgendada, servico.horaAgendada)

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden max-w-2xl mx-auto">
      <div className="bg-brand-600 px-6 py-6 text-center">
        <p className="text-white text-4xl font-black tracking-tight leading-none">AVISO</p>
        <p className="text-white text-lg font-bold mt-1">de DESINSETIZAÇÃO</p>
        <p className="text-white text-sm font-bold tracking-wide">DESRATIZAÇÃO</p>
      </div>

      <div className="p-6 space-y-4">
        <div>
          <h2 className="text-brand-700 font-extrabold text-lg">O SEU CONDOMÍNIO SERÁ DESINSETIZADO</h2>
          <p className="text-sm text-slate-600 mt-1">Aconselhamos o tratamento da sua casa, para maior eficácia do tratamento.</p>
          <p className="text-sm font-semibold text-ink-900 mt-2">No dia e horário agendado:</p>
        </div>

        <div className="border-2 border-slate-300 rounded-lg py-3 text-center">
          <p className="text-xl font-extrabold text-ink-900">{dataHora}</p>
        </div>

        <ul className="space-y-1.5 text-sm text-slate-700">
          <li className="flex gap-2"><span className="text-brand-600">○</span> Evitar a circulação de pessoas e animais de estimação na hora da aplicação.</li>
          <li className="flex gap-2"><span className="text-brand-600">○</span> Aguardar 30 dias para o desaparecimento total dos insetos.</li>
          <li className="flex gap-2"><span className="text-brand-600">○</span> Evitar circular com seu pet ou se for alérgico ou tiver problemas respiratórios, por um período de 2h após aplicação.</li>
        </ul>
      </div>

      <div className="bg-black px-6 py-2.5">
        <p className="text-white font-extrabold text-lg tracking-tight">DESCONTO EXCLUSIVO PARA MORADORES:</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2">
        <div className="bg-amber-400 p-5">
          <p className="font-extrabold text-ink-900 text-lg">RESIDENCIAL</p>
          <p className="text-xs font-semibold text-ink-900 mb-2">Em até 3x (cartão s/juros)</p>
          <p className="text-sm font-bold text-ink-900">1) Barata + Formiga ou apenas Rato</p>
          <p className="text-sm text-ink-900">Apenas: <strong>R$ 249,90</strong> · Garantia de 3 meses</p>
          <p className="text-sm font-bold text-ink-900 mt-2">2) Cupim prevenção</p>
          <p className="text-sm text-ink-900">Apenas: <strong>R$ 599,90</strong> · Garantia de 3 anos</p>
          <p className="text-xs text-slate-700">Combate: Solicitar Orçamento</p>
        </div>
        <div className="bg-amber-400 p-5 sm:border-l border-amber-500">
          <p className="font-extrabold text-ink-900 text-lg">ESTABELECIMENTOS COMERCIAIS</p>
          <p className="text-sm font-bold text-ink-900 mt-2">3) Planos mensais e trimestrais:</p>
          <p className="text-sm text-ink-900">Todas as pragas e Limpeza de Reservatórios</p>
          <p className="text-sm text-ink-900">Solicite uma Vistoria</p>
        </div>
      </div>

      <div className="bg-brand-600 px-6 py-2.5 text-center">
        <p className="text-white font-bold text-sm">DESINSETIZAÇÃO SEM CHEIRO, SEM SUJEIRA E SEM SAIR DE CASA!</p>
      </div>

      <div className="bg-black px-6 py-5">
        <p className="text-white text-center font-extrabold mb-3">DOENÇAS CAUSADAS POR PRAGAS</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-200">
          <div><p className="font-bold text-brand-400">BARATAS</p><p>Provocam diarréia, Hepatite, Febre Tifoide, Asma, Tuberculose</p></div>
          <div><p className="font-bold text-brand-400">FORMIGAS</p><p>Provocam choque anafilático, transportam vírus, bactérias e fungos.</p></div>
          <div><p className="font-bold text-brand-400">PULGAS</p><p>Provocam diarréia, Hepatite, Febre Tifoide, Asma, Tuberculose</p></div>
          <div><p className="font-bold text-brand-400">CUPINS</p><p>Destroem todo o seu patrimônio</p></div>
          <div><p className="font-bold text-brand-400">RATOS</p><p>Provocam a leptospirose, peste bulbônica, tifo...</p></div>
        </div>
      </div>

      <div className="bg-brand-600 px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <div className="text-white text-sm">
          <p className="font-semibold">Fale conosco:</p>
          <p>☏ 21 98117-4376</p>
          <p>www.ratzan.com.br</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
            <Bug size={20} className="text-brand-600" />
          </div>
          <span className="text-white text-2xl font-extrabold tracking-tight">RATZAN</span>
        </div>
      </div>
    </div>
  )
}
