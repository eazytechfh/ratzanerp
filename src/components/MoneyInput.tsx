import React from 'react'

interface Props {
  value: number
  onChange: (value: number) => void
  className?: string
}

function formatCentavos(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function MoneyInput({ value, onChange, className }: Props) {
  const cents = Math.round((value || 0) * 100)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '')
    const next = digits ? parseInt(digits, 10) : 0
    onChange(next / 100)
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      value={formatCentavos(cents)}
      onChange={handleChange}
      className={className}
    />
  )
}
