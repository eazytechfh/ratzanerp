import { componentToPdfBase64 } from './componentToPdf'
import { montarEmailOsCertificado } from './emailTemplates'
import { enviarEmailCliente } from '../data/emailClient'
import OrdemServicoDoc from '../components/documentos/OrdemServicoDoc'
import CertificadoGarantiaDoc from '../components/documentos/CertificadoGarantiaDoc'
import type { Cliente, Servico } from '../types'

// Gera a OS (e o Certificado, quando emitido) em PDF e envia por e-mail ao cliente.
// Usado na baixa do serviço e no botão "Reenviar e-mail" do detalhe do serviço.
// `emailDestino` permite enviar para um e-mail diferente do cadastrado.
export async function enviarDocumentosPorEmail(servico: Servico, cliente: Cliente, emailDestino?: string) {
  const destino = (emailDestino ?? cliente?.email ?? '').trim()
  if (!destino) return

  const anexos: { nome: string; base64: string }[] = []

  const osBase64 = await componentToPdfBase64(<OrdemServicoDoc servico={servico} cliente={cliente} />)
  anexos.push({ nome: `OS-${servico.clienteNome}.pdf`, base64: osBase64 })

  const comCertificado = servico.baixa?.emitirCertificado !== false
  if (comCertificado) {
    const certBase64 = await componentToPdfBase64(<CertificadoGarantiaDoc servico={servico} cliente={cliente} />)
    anexos.push({ nome: `Certificado-Garantia-${servico.clienteNome}.pdf`, base64: certBase64 })
  }

  return enviarEmailCliente({
    clienteEmail: destino,
    clienteNome: cliente.nome,
    assunto: `Ordem de Serviço — ${servico.tipoServico} — Ratzan`,
    mensagemHtml: montarEmailOsCertificado(cliente.nome, comCertificado),
    anexos,
  })
}
