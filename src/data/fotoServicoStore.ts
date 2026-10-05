import { supabase } from '../lib/supabaseClient'

// Foto da fachada tirada ao iniciar o serviço. Fica numa tabela própria (imagem pesada, não
// deve vir junto com a lista de serviços) e só é guardada por 7 dias — depois disso deixa de
// aparecer no histórico e é apagada do banco. Só a imagem expira; o resto do histórico fica.
export const FOTO_RETENCAO_DIAS = 7

export interface FotoServico {
  id: string
  servicoId: string
  imagem: string
  criadaEm: string
}

function limiteRetencao() {
  return new Date(Date.now() - FOTO_RETENCAO_DIAS * 24 * 60 * 60 * 1000)
}

/** Data em que a foto deixa de estar disponível. */
export function fotoExpiraEm(criadaEm: string): Date {
  return new Date(new Date(criadaEm).getTime() + FOTO_RETENCAO_DIAS * 24 * 60 * 60 * 1000)
}

export async function salvarFotoServico(servicoId: string, imagem: string): Promise<{ error?: string }> {
  const { error } = await supabase.from('fotos_servico').insert({ servico_id: servicoId, imagem })
  if (error) {
    console.error('[fotos_servico] erro ao salvar foto:', error.message)
    return { error: error.message }
  }
  return {}
}

/** Foto mais recente do serviço que ainda está dentro dos 7 dias (ou null). */
export async function buscarFotoServico(servicoId: string): Promise<FotoServico | null> {
  const { data, error } = await supabase
    .from('fotos_servico')
    .select('id, servico_id, imagem, criada_em')
    .eq('servico_id', servicoId)
    .gte('criada_em', limiteRetencao().toISOString())
    .order('criada_em', { ascending: false })
    .limit(1)
  if (error || !data || data.length === 0) {
    if (error) console.error('[fotos_servico] erro ao buscar foto:', error.message)
    return null
  }
  const r = data[0] as { id: string; servico_id: string; imagem: string; criada_em: string }
  return { id: r.id, servicoId: r.servico_id, imagem: r.imagem, criadaEm: r.criada_em }
}

/** Apaga do banco as fotos com mais de 7 dias. Chamado ao abrir a Agenda. */
export async function purgarFotosExpiradas(): Promise<void> {
  const { error } = await supabase.from('fotos_servico').delete().lt('criada_em', limiteRetencao().toISOString())
  if (error) console.error('[fotos_servico] erro ao limpar fotos expiradas:', error.message)
}
