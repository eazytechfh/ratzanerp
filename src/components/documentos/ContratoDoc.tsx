import React from 'react'
import type { Contrato } from '../../types'

interface Props {
  contrato: Contrato
}

function fmtData(dataStr?: string) {
  if (!dataStr) return '-'
  return new Date(dataStr + 'T00:00:00').toLocaleDateString('pt-BR')
}

function fmtMoeda(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

function Clausula({ numero, titulo, children }: { numero: string; titulo: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-sm font-bold text-ink-900">CLÁUSULA {numero} – {titulo}</h3>
      <div className="text-sm text-slate-700 leading-relaxed space-y-1">{children}</div>
    </div>
  )
}

export default function ContratoDoc({ contrato }: Props) {
  const assinatura = new Date(contrato.dataAssinatura + 'T00:00:00')

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-8 max-w-3xl mx-auto space-y-5">
      <div className="text-center border-b border-slate-100 pb-4">
        <p className="text-brand-600 text-3xl font-extrabold tracking-tight">RATZAN</p>
        <p className="text-xs text-slate-500 mt-1">RATZAN - CONTROLE DE PRAGAS &nbsp;CNPJ: 43.238.618/0001-05 | ☏ +55 (21) 98117-4376</p>
      </div>

      <h2 className="text-center text-base font-bold text-ink-900 underline underline-offset-4">
        CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE CONTROLE DE PRAGAS
      </h2>

      <p className="text-sm text-slate-700 leading-relaxed">
        Pelo presente instrumento particular, de um lado, como <strong>CONTRATADA</strong>:<br />
        <strong>RATZAN CONTROLE DE PRAGAS LTDA</strong>, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº <strong>43.238.618/0001-05</strong>,
        com sede na Rua Conselheiro Lampreia, nº 191, Rio de Janeiro/RJ, neste ato representada por seu representante legal, doravante denominada <strong>CONTRATADA</strong>;
      </p>
      <p className="text-sm text-slate-700 leading-relaxed">
        E, de outro lado, como <strong>CONTRATANTE</strong>:<br />
        <strong>{contrato.contratanteNome.toUpperCase()}</strong>, pessoa jurídica/física de direito privado, inscrita no CNPJ/CPF sob o nº <strong>{contrato.contratanteDocumento || '-'}</strong>,
        com sede/endereço em {contrato.contratanteEndereco || '-'}, endereço eletrônico: <strong>{contrato.contratanteEmail || '-'}</strong>, doravante denominado <strong>CONTRATANTE</strong>;
      </p>
      <p className="text-sm text-slate-700">Têm entre si justo e contratado o seguinte:</p>

      <Clausula numero="PRIMEIRA" titulo="OBJETO">
        <p>
          1. O presente contrato tem por objeto a prestação de <strong>serviços de controle de pragas urbanas</strong>, abrangendo: <strong>{contrato.servicosAbrangidos}</strong>.
          {contrato.reajustePercentual > 0 && <> Com um <strong>reajuste de {contrato.reajustePercentual}%</strong> em relação ao contrato anterior.</>}
        </p>
        <p>1.2. A periodicidade dos serviços será <strong>{contrato.periodicidade.toLowerCase()}</strong>.</p>
        {contrato.reforcoProgramado && (
          <p>1.3. Reforço programado: <strong>{contrato.reforcoProgramado}</strong>.</p>
        )}
      </Clausula>

      <Clausula numero="SEGUNDA" titulo="VALOR E FORMA DE PAGAMENTO">
        <p>
          2.1. Pela prestação dos serviços ora contratados, o CONTRATANTE pagará à CONTRATADA o valor de <strong>{fmtMoeda(contrato.valorTotal)}</strong>.
        </p>
        <p>
          2.2. O pagamento será efetuado mediante <strong>{contrato.formaPagamento}</strong>
          {contrato.parcelado ? (
            <>, em <strong>{contrato.qtdParcelas} parcelas</strong> mensais e sucessivas no valor de <strong>{fmtMoeda(contrato.valorParcela ?? 0)}</strong> cada
              {contrato.vencimentos && <>, com vencimento em <strong>{contrato.vencimentos}</strong></>}.
            </>
          ) : (
            <>, em pagamento único.</>
          )}
        </p>
      </Clausula>

      <Clausula numero="TERCEIRA" titulo="GARANTIA">
        <p>3.1. A CONTRATADA garante a eficácia dos serviços prestados, limitada às áreas tratadas, conforme critérios técnicos e condições estabelecidas neste contrato.</p>
        <p>3.2. Persistindo sinais de reinfestação nos locais tratados dentro do período de cobertura, o CONTRATANTE poderá solicitar atendimento de reforço, sem custo adicional.</p>
      </Clausula>

      <Clausula numero="QUARTA" titulo="ORIENTAÇÕES E RESPONSABILIDADES">
        <p>4.1. O CONTRATANTE se compromete a seguir as orientações pré e pós-aplicação fornecidas pela CONTRATADA, visando a segurança dos ocupantes e a efetividade do serviço.</p>
        <p>4.2. A CONTRATADA não se responsabiliza por falhas na eficácia do serviço em razão do não cumprimento das orientações repassadas ao CONTRATANTE.</p>
      </Clausula>

      <Clausula numero="QUINTA" titulo="VIGÊNCIA, CANCELAMENTO E AVISO PRÉVIO">
        <p>
          5.1. O presente contrato terá vigência com início em <strong>{fmtData(contrato.dataInicio)}</strong> e término em <strong>{fmtData(contrato.dataFim)}</strong>, podendo ser renovado por acordo entre as partes.
        </p>
        <p>5.2. O contrato poderá ser rescindido por qualquer das partes sem multa ou juros, desde que haja aviso prévio de 30 (trinta) dias.</p>
      </Clausula>

      <Clausula numero="SEXTA" titulo="RESPONSABILIDADE CIVIL">
        <p>6.1. A CONTRATADA se responsabiliza pelo uso correto dos produtos e pela aplicação conforme normas da Vigilância Sanitária, assumindo responsabilidade técnica pelos serviços prestados.</p>
      </Clausula>

      <Clausula numero="SÉTIMA" titulo="FORO">
        <p>7.1. Para dirimir quaisquer dúvidas ou controvérsias oriundas deste contrato, as partes elegem o foro da Comarca do Rio de Janeiro/RJ, renunciando a qualquer outro por mais privilegiado que seja.</p>
      </Clausula>

      <p className="text-sm text-slate-700 pt-2 border-t border-slate-100">
        E, por estarem justos e contratados, assinam o presente instrumento em duas vias de igual teor e forma, para um só efeito legal.
      </p>
      <p className="text-sm text-slate-700">
        Rio de Janeiro, {assinatura.getDate()} de {MESES[assinatura.getMonth()]} de {assinatura.getFullYear()}.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
        <div className="text-sm text-slate-700 space-y-1">
          <p className="font-bold text-ink-900">CONTRATANTE:</p>
          <p>{contrato.contratanteNome}</p>
          <p>CNPJ/CPF: {contrato.contratanteDocumento || '-'}</p>
          <p>Responsável: {contrato.responsavelContratante || '_'.repeat(28)}</p>
          <p className="pt-6">Assinatura: {'_'.repeat(28)}</p>
        </div>
        <div className="text-sm text-slate-700 space-y-1">
          <p className="font-bold text-ink-900">CONTRATADA:</p>
          <p>RATZAN CONTROLE DE PRAGAS LTDA</p>
          <p>CNPJ: 43.238.618/0001-05</p>
          <p>Representante legal: {contrato.representanteRatzan}</p>
          <p className="pt-6">Assinatura: {'_'.repeat(28)}</p>
        </div>
      </div>
    </div>
  )
}
