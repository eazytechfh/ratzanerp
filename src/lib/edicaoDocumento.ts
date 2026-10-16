import { registrarLog } from '../data/logStore'

// Compara o documento original com o editado e devolve "Campo: 'antes' → 'depois'" por alteração.
export function descreverAlteracoes<T extends object>(
  original: T,
  atual: T,
  rotulos: Record<keyof T, string>,
): string[] {
  const aspas = (v: unknown) => (String(v).trim() === '' ? '(vazio)' : `"${String(v)}"`)
  return (Object.keys(rotulos) as (keyof T)[])
    .filter((k) => original[k] !== atual[k])
    .map((k) => `${rotulos[k]}: ${aspas(original[k])} → ${aspas(atual[k])}`)
}

// Registra no Log quem editou a OS/Certificado, de qual serviço e o que mudou.
export function registrarEdicaoDocumento(
  usuario: string,
  documento: 'Ordem de Serviço' | 'Certificado de Garantia',
  servicoDescricao: string,
  alteracoes: string[],
) {
  if (alteracoes.length === 0) return
  registrarLog(usuario, `${documento} editada`, `${servicoDescricao} — ${alteracoes.join(' | ')}`)
}
