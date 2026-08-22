import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Perfil } from '../types'

interface AuthState {
  isAuthenticated: boolean
  loading: boolean
  userEmail: string | null
  perfil: Perfil | null
  login: (email: string, senha: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthState | undefined>(undefined)

interface PerfilRow {
  id: string
  nome: string
  email: string
  role: Perfil['role']
  operador_id: string | null
}

function fromRow(r: PerfilRow): Perfil {
  return { id: r.id, nome: r.nome, email: r.email, role: r.role, operadorId: r.operador_id ?? undefined }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)

  async function carregarPerfil(userId: string, fallbackEmail: string | null) {
    const { data, error } = await supabase.from('perfis').select('*').eq('id', userId).maybeSingle()
    if (error || !data) {
      console.error('[auth] erro ao carregar perfil:', error?.message)
      setPerfil(null)
      return
    }
    setPerfil(fromRow(data as PerfilRow))
    setUserEmail((data as PerfilRow).email ?? fallbackEmail)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserEmail(session.user.email ?? null)
        carregarPerfil(session.user.id, session.user.email ?? null).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserEmail(session.user.email ?? null)
        carregarPerfil(session.user.id, session.user.email ?? null)
      } else {
        setUserEmail(null)
        setPerfil(null)
      }
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  async function login(email: string, senha: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
    if (error || !data.user) {
      return { ok: false, error: 'E-mail ou senha inválidos.' }
    }
    await carregarPerfil(data.user.id, data.user.email ?? null)
    return { ok: true }
  }

  function logout() {
    supabase.auth.signOut()
    setUserEmail(null)
    setPerfil(null)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!perfil, loading, userEmail, perfil, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
