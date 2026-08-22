import type { Servico } from '../types'

/**
 * URLs a configurar posteriormente. Ao concluir um serviço, o payload deve ser
 * enviado para gerar e disparar a OS + certificado de garantia por WhatsApp/e-mail.
 * Ao reagendar, o payload deve avisar o cliente sobre a nova data.
 */

export function dispararWebhookConclusao(servico: Servico) {
  console.info('[webhook:conclusao] (URL a configurar)', servico)
}

export function dispararWebhookReagendamento(servico: Servico, opcao: string) {
  console.info('[webhook:reagendamento] (URL a configurar)', { servico, opcao })
}
