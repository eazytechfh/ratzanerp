import React from 'react'
import { createRoot } from 'react-dom/client'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

// Renderiza um componente React fora da tela, tira um "print" em canvas
// e monta um PDF de uma página só a partir dele. Usado para gerar a OS e o
// Certificado de Garantia como anexo de e-mail, sem exigir ação do usuário.
export async function componentToPdfBase64(node: React.ReactElement): Promise<string> {
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.left = '-10000px'
  container.style.top = '0'
  container.style.width = '800px'
  container.style.background = '#ffffff'
  document.body.appendChild(container)

  const root = createRoot(container)
  root.render(node)

  try {
    // dá tempo pro React montar, imagens (assinatura) e fontes carregarem
    await new Promise((resolve) => setTimeout(resolve, 400))

    const canvas = await html2canvas(container, { scale: 2, backgroundColor: '#ffffff', useCORS: true })
    const imgData = canvas.toDataURL('image/jpeg', 0.92)

    const widthPx = canvas.width / 2
    const heightPx = canvas.height / 2
    const pdf = new jsPDF({ unit: 'px', format: [widthPx, heightPx] })
    pdf.addImage(imgData, 'JPEG', 0, 0, widthPx, heightPx)

    const dataUri = pdf.output('datauristring') as string
    return dataUri.split(',')[1]
  } finally {
    root.unmount()
    document.body.removeChild(container)
  }
}
