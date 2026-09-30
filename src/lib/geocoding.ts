// Busca e geocodificação de endereços via Nominatim (OpenStreetMap) — gratuito, sem
// chave de API. Uso interno e de baixo volume: quem chama isto (EnderecosEditor) já
// limita a frequência das buscas (debounce) e o número de resultados. Se o volume de
// uso crescer muito, considere hospedar uma instância própria do Nominatim ou trocar
// por um provedor pago (ex.: Google Places), que também respondem no mesmo formato
// de SugestaoEndereco abaixo.

const ESTADOS_UF: Record<string, string> = {
  Acre: 'AC', Alagoas: 'AL', Amapá: 'AP', Amazonas: 'AM', Bahia: 'BA',
  Ceará: 'CE', 'Distrito Federal': 'DF', 'Espírito Santo': 'ES', Goiás: 'GO',
  Maranhão: 'MA', 'Mato Grosso': 'MT', 'Mato Grosso do Sul': 'MS', 'Minas Gerais': 'MG',
  Pará: 'PA', Paraíba: 'PB', Paraná: 'PR', Pernambuco: 'PE', Piauí: 'PI',
  'Rio de Janeiro': 'RJ', 'Rio Grande do Norte': 'RN', 'Rio Grande do Sul': 'RS',
  Rondônia: 'RO', Roraima: 'RR', 'Santa Catarina': 'SC', 'São Paulo': 'SP',
  Sergipe: 'SE', Tocantins: 'TO',
}

interface NominatimAddress {
  road?: string
  house_number?: string
  neighbourhood?: string
  suburb?: string
  city_district?: string
  city?: string
  town?: string
  village?: string
  municipality?: string
  state?: string
  postcode?: string
}

interface NominatimResult {
  display_name: string
  lat: string
  lon: string
  address?: NominatimAddress
}

export interface SugestaoEndereco {
  id: string
  /** Endereço completo devolvido pela busca, com bairro/cidade — usado para o operador
   *  diferenciar ruas de mesmo nome em bairros diferentes antes de escolher. */
  resumo: string
  endereco: string
  cidade?: string
  uf?: string
  cep?: string
  lat: number
  lng: number
}

function paraSugestao(r: NominatimResult): SugestaoEndereco {
  const a = r.address ?? {}
  const bairro = a.neighbourhood || a.suburb || a.city_district
  const rua = a.road || r.display_name.split(',')[0]
  let endereco = rua
  if (a.house_number) endereco += `, ${a.house_number}`
  if (bairro) endereco += ` - ${bairro}`

  return {
    id: `${r.lat},${r.lon}`,
    resumo: r.display_name,
    endereco,
    cidade: a.city || a.town || a.village || a.municipality,
    uf: a.state ? ESTADOS_UF[a.state] ?? a.state : undefined,
    cep: a.postcode,
    lat: Number(r.lat),
    lng: Number(r.lon),
  }
}

async function consultarNominatim(query: string, signal?: AbortSignal): Promise<SugestaoEndereco[]> {
  const q = query.trim()
  if (!q) return []
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=br&limit=5&accept-language=pt-BR&q=${encodeURIComponent(q)}`
  const resp = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  if (!resp.ok) return []
  const data = (await resp.json()) as NominatimResult[]
  return data.map(paraSugestao)
}

/** Busca-enquanto-digita: só dispara com texto minimamente útil, pra não gastar
 *  requisições com "Rua A" etc. Quem chama deve fazer debounce (ver EnderecosEditor). */
export async function buscarEnderecos(query: string, signal?: AbortSignal): Promise<SugestaoEndereco[]> {
  if (query.trim().length < 5) return []
  return consultarNominatim(query, signal)
}

/** Geocodificação avulsa (botão "Localizar no mapa" para um endereço já digitado). */
export async function geocodificarEndereco(query: string): Promise<SugestaoEndereco | null> {
  const resultados = await consultarNominatim(query)
  return resultados[0] ?? null
}
