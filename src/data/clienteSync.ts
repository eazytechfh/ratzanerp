import type { Cliente, Endereco, Servico } from '../types'
import { atualizarServicosDoCliente } from './servicoStore'
import { atualizarCobrancasManuaisDoCliente } from './manualReceivableStore'
import { atualizarAlertasDoCliente } from './alertaStore'

// Serviços, cobranças manuais e alertas guardam uma CÓPIA do nome do cliente (e os serviços,
// do endereço) feita no momento do cadastro. Sem isto, editar o cliente não refletia na
// Agenda, no Financeiro etc. — ficava o nome/endereço antigo. Chamar depois de salvar o cliente.
//
// Regras:
// - Nome: corrigido em TODOS os registros do cliente (inclusive concluídos — é correção de cadastro).
// - Endereço: só nos serviços ainda abertos (agendado/em andamento) que usavam o endereço
//   principal antigo. Serviços concluídos mantêm o endereço de quando foram executados
//   (a OS e o certificado são documentos históricos).
// - Contratos não são alterados: o nome neles é o das partes no momento da assinatura.
//
// Retorna as mensagens de erro (vazio = tudo certo).
export async function propagarEdicaoCliente(
  antes: Cliente,
  depois: { nome: string; enderecos: Endereco[] },
): Promise<string[]> {
  const nomeMudou = depois.nome !== antes.nome

  const endAntes = antes.enderecos[0]
  const endDepois = depois.enderecos[0]
  const enderecoMudou =
    (endAntes?.endereco ?? '') !== (endDepois?.endereco ?? '') ||
    endAntes?.lat !== endDepois?.lat ||
    endAntes?.lng !== endDepois?.lng

  if (!nomeMudou && !enderecoMudou) return []

  const erros: string[] = []

  const rServicos = await atualizarServicosDoCliente(antes.id, (s) => {
    const mudanca: Partial<Servico> = {}
    if (nomeMudou) mudanca.clienteNome = depois.nome
    if (
      enderecoMudou &&
      s.status !== 'concluido' &&
      s.status !== 'cancelado' &&
      s.endereco === (endAntes?.endereco ?? '')
    ) {
      mudanca.endereco = endDepois?.endereco ?? ''
      mudanca.enderecoLat = endDepois?.lat
      mudanca.enderecoLng = endDepois?.lng
    }
    return Object.keys(mudanca).length > 0 ? mudanca : null
  })
  if (rServicos.error) erros.push(`serviços: ${rServicos.error}`)

  if (nomeMudou) {
    const rCobrancas = await atualizarCobrancasManuaisDoCliente(antes.id, () => ({ clienteNome: depois.nome }))
    if (rCobrancas.error) erros.push(`cobranças: ${rCobrancas.error}`)

    const rAlertas = await atualizarAlertasDoCliente(antes.id, () => ({ clienteNome: depois.nome }))
    if (rAlertas.error) erros.push(`alertas: ${rAlertas.error}`)
  }

  return erros
}
