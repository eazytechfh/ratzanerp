// Comprime a foto tirada no celular antes de guardar: reduz para no máximo `ladoMax` px no maior
// lado e salva como JPEG. Uma foto de câmera (3–8 MB) vira ~80–150 KB — suficiente para
// reconhecer a fachada e leve para o banco.
export async function comprimirImagem(arquivo: File, ladoMax = 1024, qualidade = 0.7): Promise<string> {
  const url = URL.createObjectURL(arquivo)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('Não foi possível ler a imagem.'))
      el.src = url
    })
    const escala = Math.min(1, ladoMax / Math.max(img.width, img.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.width * escala)
    canvas.height = Math.round(img.height * escala)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Não foi possível processar a imagem.')
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', qualidade)
  } finally {
    URL.revokeObjectURL(url)
  }
}
