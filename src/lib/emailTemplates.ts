// Modelo padrão de e-mail enviado ao cliente com a OS/Certificado em anexo.
// HTML com estilos inline e layout em tabela — necessário para renderizar
// consistente nos clientes de e-mail (Gmail, Outlook etc.), que ignoram <style>.

export function montarEmailOsCertificado(nome: string): string {
  const primeiroNome = nome.trim().split(' ')[0] || nome

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
        <tr>
          <td style="background:#ab171a;padding:24px 32px;">
            <span style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">RATZAN</span>
            <div style="font-size:12px;color:#ffffff;opacity:0.85;margin-top:2px;">Controle de Pragas</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#062233;">Olá, <strong>${primeiroNome}</strong>,</p>
            <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#062233;">
              Segue em anexo a nossa <strong>Ordem de Serviço</strong> e o <strong>Certificado de Garantia</strong>.
              Qualquer dúvida, favor retornar para o e-mail
              <a href="mailto:contato@ratzan.com.br" style="color:#ab171a;text-decoration:none;">contato@ratzan.com.br</a>.
            </p>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#062233;">
              Agradecemos por confiar na Ratzan para a proteção da sua residência/estabelecimento comercial.
            </p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
              <tr>
                <td style="padding:20px 24px;text-align:center;">
                  <p style="margin:0 0 14px;font-size:14px;line-height:1.5;color:#334155;">
                    💬 Se conseguir um tempinho, avaliar nosso trabalho/atendimento no Google seria muito
                    importante para entendermos se estamos no caminho certo:
                  </p>
                  <a href="https://g.page/r/CXy9F82ai8rDEAE/review"
                     style="display:inline-block;background:#ab171a;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 24px;border-radius:8px;">
                    ⭐ Avaliar no Google
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#062233;padding:20px 32px;">
            <p style="margin:0;font-size:12px;color:#ffffff;opacity:0.7;">
              Ratzan Controle de Pragas · contato@ratzan.com.br · www.ratzan.com.br
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`.trim()
}
