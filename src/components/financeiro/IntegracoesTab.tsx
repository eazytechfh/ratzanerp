import React, { useEffect, useState } from 'react'
import { Plug, ExternalLink, CheckCircle2, Terminal } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

type Ambiente = 'sandbox' | 'producao'

export default function IntegracoesTab() {
  const [ambiente, setAmbiente] = useState<Ambiente>('sandbox')
  const [salvo, setSalvo] = useState(false)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    supabase
      .from('integracoes_config')
      .select('valor')
      .eq('chave', 'asaas')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.valor?.ambiente) setAmbiente(data.valor.ambiente)
        setCarregando(false)
      })
  }, [])

  async function handleSalvarAmbiente(novo: Ambiente) {
    setAmbiente(novo)
    await supabase.from('integracoes_config').upsert({ chave: 'asaas', valor: { ambiente: novo } })
    setSalvo(true)
    setTimeout(() => setSalvo(false), 2500)
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <Plug size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-ink-900">Asaas</h2>
            <p className="text-xs text-slate-400">Emissão de boleto e nota fiscal, direto da aba Contas a Receber</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-4">
          Por segurança, o token do Asaas não fica salvo no navegador — ele mora como <em>secret</em> de uma Edge
          Function do Supabase (<code className="text-xs bg-slate-100 px-1 py-0.5 rounded">asaas-proxy</code>), que
          é quem de fato conversa com a API do Asaas. O app só chama essa function.
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Ambiente</label>
          <div className="flex gap-2">
            {(['sandbox', 'producao'] as Ambiente[]).map((a) => (
              <button
                key={a}
                type="button"
                disabled={carregando}
                onClick={() => handleSalvarAmbiente(a)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition ${
                  ambiente === a ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {a === 'sandbox' ? 'Sandbox (testes)' : 'Produção'}
              </button>
            ))}
          </div>
          {salvo && <p className="text-xs text-emerald-600 flex items-center gap-1 mt-2"><CheckCircle2 size={13} /> Ambiente salvo.</p>}
          <p className="text-xs text-slate-400 mt-2">
            Isso só define qual sandbox/produção a function deve usar. É preciso também configurar o secret
            <code className="mx-1 bg-slate-100 px-1 py-0.5 rounded">ASAAS_AMBIENTE</code>na function com o mesmo valor.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-4 space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
            <Terminal size={13} /> Deploy da Edge Function (rodar uma vez)
          </p>
          <pre className="text-xs bg-ink-900 text-white rounded-md p-3 overflow-x-auto leading-relaxed">
{`npm install -g supabase
supabase login
supabase link --project-ref cqxfajrasbvezbknhcbm
supabase secrets set ASAAS_API_KEY=seu_token_aqui
supabase secrets set ASAAS_AMBIENTE=sandbox
supabase functions deploy asaas-proxy --no-verify-jwt`}
          </pre>
          <p className="text-xs text-slate-500">
            O arquivo da function já está em <code className="bg-slate-100 px-1 py-0.5 rounded">supabase/functions/asaas-proxy/index.ts</code>.
            Depois do deploy, os botões "Emitir boleto" e "Emitir NF" na aba Contas a Receber passam a funcionar de verdade.
          </p>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 mt-4">
          <p className="text-xs font-semibold text-amber-800 mb-1">Emitir boleto já está pronto ✅</p>
          <p className="text-xs text-amber-800">
            Emitir NF depende de configuração fiscal prévia no próprio Asaas (município, serviço, regime tributário
            e série da NF), em <strong>Configurações → Notas Fiscais</strong> no painel deles. Enquanto isso não
            estiver preenchido lá, o botão "Emitir NF" retorna o erro explicando o que falta configurar.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <ExternalLink size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-ink-900">Google Calendar</h2>
            <p className="text-xs text-slate-400">Sincronização bidirecional com a Agenda</p>
          </div>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Quando ativada, cada serviço criado no sistema será enviado ao Google Calendar automaticamente, e eventos
          criados diretamente no Google Calendar aparecerão na Agenda do sistema.
        </p>
        <button disabled className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-200 text-slate-400 cursor-not-allowed">
          Conectar ao Google Calendar (em breve)
        </button>
      </div>
    </div>
  )
}
