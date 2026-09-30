import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

// O Vite resolve os ícones padrão do Leaflet como URLs relativas quebradas (o CSS do
// Leaflet espera os arquivos ao lado do bundle) — aponta explicitamente para os
// arquivos importados, que o Vite processa e serve corretamente.
const iconePadrao = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

interface Props {
  lat: number
  lng: number
  /** Permite arrastar o pino para ajustar a posição exata (cadastro). Sem isso, o
   *  mapa é só uma prévia de leitura (ex: detalhe do cliente). */
  draggable?: boolean
  onMove?: (lat: number, lng: number) => void
  height?: number
}

export default function EnderecoMapa({ lat, lng, draggable = false, onMove, height = 180 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current).setView([lat, lng], 17)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map)
    const marker = L.marker([lat, lng], { draggable, icon: iconePadrao }).addTo(map)
    if (draggable && onMove) {
      marker.on('dragend', () => {
        const pos = marker.getLatLng()
        onMove(pos.lat, pos.lng)
      })
    }
    mapRef.current = map
    markerRef.current = marker

    // O mapa às vezes nasce dentro de um modal ainda animando/escondido — sem tamanho
    // correto naquele instante, o Leaflet renderiza os blocos de tile deslocados.
    const t = setTimeout(() => map.invalidateSize(), 150)

    return () => {
      clearTimeout(t)
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
    // Só inicializa uma vez; mudanças de lat/lng são tratadas no efeito abaixo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return
    markerRef.current.setLatLng([lat, lng])
    mapRef.current.setView([lat, lng], mapRef.current.getZoom())
  }, [lat, lng])

  return <div ref={containerRef} style={{ height }} className="w-full rounded-lg overflow-hidden border border-slate-200" />
}
