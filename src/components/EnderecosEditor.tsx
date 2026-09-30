import React, { useEffect, useRef, useState } from 'react'
import { Plus, Trash2, MapPin, Loader2, X } from 'lucide-react'
import type { Endereco } from '../types'
import { buscarEnderecos, geocodificarEndereco, type SugestaoEndereco } from '../lib/geocoding'
import EnderecoMapa from './EnderecoMapa'

interface Props {
  enderecos: Endereco[]
  onChange: (enderecos: Endereco[]) => void
}

let localCounter = 0
function newId() {
  localCounter += 1
  return `end-novo-${Date.now()}-${localCounter}`
}

export default function EnderecosEditor({ enderecos, onChange }: Props) {
  function updateEndereco(id: string, patch: Partial<Endereco>) {
    onChange(enderecos.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  }

  function add() {
    onChange([
      ...enderecos,
      { id: newId(), rotulo: 'Novo endereço', endereco: '', cidade: 'Rio de Janeiro', uf: 'RJ', cep: '' },
    ])
  }

  function remove(id: string) {
    onChange(enderecos.filter((e) => e.id !== id))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700">Endereços</label>
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
        >
          <Plus size={14} /> Adicionar endereço
        </button>
      </div>

      {enderecos.map((end) => (
        <EnderecoCampo
          key={end.id}
          endereco={end}
          podeRemover={enderecos.length > 1}
          onChange={(patch) => updateEndereco(end.id, patch)}
          onRemove={() => remove(end.id)}
        />
      ))}
      {enderecos.length === 0 && (
        <p className="text-xs text-slate-400">Nenhum endereço adicionado.</p>
      )}
    </div>
  )
}

interface CampoProps {
  endereco: Endereco
  podeRemover: boolean
  onChange: (patch: Partial<Endereco>) => void
  onRemove: () => void
}

function EnderecoCampo({ endereco, podeRemover, onChange, onRemove }: CampoProps) {
  const [sugestoes, setSugestoes] = useState<SugestaoEndereco[]>([])
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const [localizando, setLocalizando] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      abortRef.current?.abort()
    }
  }, [])

  function handleEnderecoTexto(value: string) {
    // Editar o texto manualmente invalida um pino já confirmado — evita deixar um
    // pino "preso" num endereço diferente do que está escrito no campo.
    onChange({ endereco: value, lat: undefined, lng: undefined })

    if (debounceRef.current) clearTimeout(debounceRef.current)
    abortRef.current?.abort()

    if (value.trim().length < 5) {
      setSugestoes([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController()
      abortRef.current = controller
      setBuscando(true)
      try {
        const resultados = await buscarEnderecos(value, controller.signal)
        setSugestoes(resultados)
        setMostrarSugestoes(true)
      } catch {
        // busca cancelada (nova digitação) ou falha de rede — o operador ainda pode
        // digitar o endereço à mão normalmente.
      } finally {
        setBuscando(false)
      }
    }, 600)
  }

  function selecionarSugestao(s: SugestaoEndereco) {
    onChange({
      endereco: s.endereco,
      cidade: s.cidade ?? endereco.cidade,
      uf: s.uf ?? endereco.uf,
      cep: s.cep ?? endereco.cep,
      lat: s.lat,
      lng: s.lng,
    })
    setSugestoes([])
    setMostrarSugestoes(false)
  }

  async function localizarNoMapa() {
    const consulta = [endereco.endereco, endereco.cidade, endereco.uf].filter(Boolean).join(', ')
    if (!consulta.trim()) return
    setLocalizando(true)
    try {
      const resultado = await geocodificarEndereco(consulta)
      if (resultado) {
        onChange({ lat: resultado.lat, lng: resultado.lng })
      } else {
        alert('Não encontramos esse endereço no mapa. Confira o texto ou arraste o pino manualmente depois de ajustar.')
      }
    } finally {
      setLocalizando(false)
    }
  }

  const temPino = endereco.lat != null && endereco.lng != null

  return (
    <div className="rounded-lg border border-slate-200 p-3 space-y-2 bg-slate-50/60">
      <div className="flex items-center gap-2">
        <input
          value={endereco.rotulo}
          onChange={(e) => onChange({ rotulo: e.target.value })}
          placeholder="Rótulo (ex: Principal, Filial)"
          className="flex-1 px-2.5 py-1.5 rounded-md border border-slate-300 text-xs font-medium focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
        />
        {podeRemover && (
          <button
            type="button"
            onClick={onRemove}
            className="text-slate-400 hover:text-rose-600 shrink-0"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div className="relative">
        <input
          value={endereco.endereco}
          onChange={(e) => handleEnderecoTexto(e.target.value)}
          onFocus={() => sugestoes.length > 0 && setMostrarSugestoes(true)}
          onBlur={() => setTimeout(() => setMostrarSugestoes(false), 150)}
          placeholder="Rua, número, bairro"
          autoComplete="off"
          className="w-full px-2.5 py-1.5 pr-8 rounded-md border border-slate-300 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
        />
        {buscando && (
          <Loader2 size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />
        )}
        {mostrarSugestoes && sugestoes.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-soft max-h-56 overflow-y-auto">
            {sugestoes.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selecionarSugestao(s)}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-brand-50 flex items-start gap-1.5"
                >
                  <MapPin size={13} className="text-brand-600 shrink-0 mt-0.5" />
                  {s.resumo}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <input
          value={endereco.cidade}
          onChange={(e) => onChange({ cidade: e.target.value })}
          placeholder="Cidade"
          className="px-2.5 py-1.5 rounded-md border border-slate-300 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
        />
        <input
          value={endereco.uf}
          onChange={(e) => onChange({ uf: e.target.value.toUpperCase() })}
          placeholder="UF"
          maxLength={2}
          className="px-2.5 py-1.5 rounded-md border border-slate-300 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
        />
        <input
          value={endereco.cep}
          onChange={(e) => onChange({ cep: e.target.value })}
          placeholder="CEP"
          className="px-2.5 py-1.5 rounded-md border border-slate-300 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none"
        />
      </div>

      {temPino ? (
        <div className="space-y-1.5">
          <EnderecoMapa
            lat={endereco.lat!}
            lng={endereco.lng!}
            draggable
            onMove={(lat, lng) => onChange({ lat, lng })}
          />
          <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
            <span>Pino confirmado — arraste para ajustar a posição exata</span>
            <button
              type="button"
              onClick={() => onChange({ lat: undefined, lng: undefined })}
              className="text-slate-400 hover:text-rose-600 inline-flex items-center gap-0.5 shrink-0"
            >
              <X size={11} /> Remover pino
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={localizarNoMapa}
          disabled={localizando || !endereco.endereco.trim()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {localizando ? <Loader2 size={13} className="animate-spin" /> : <MapPin size={13} />}
          {localizando ? 'Localizando...' : 'Localizar no mapa'}
        </button>
      )}
    </div>
  )
}
