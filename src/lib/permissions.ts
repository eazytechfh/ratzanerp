import type { UserRole } from '../types'

export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  '/dashboard': ['gerente_operacional', 'gerente_geral', 'administrador'],
  '/clientes': ['gerente_operacional', 'gerente_geral', 'administrador'],
  '/servicos': ['gerente_operacional', 'gerente_geral', 'administrador'],
  '/agenda': ['operador', 'gerente_operacional', 'gerente_geral', 'administrador'],
  '/equipe': ['gerente_operacional', 'gerente_geral', 'administrador'],
  '/financeiro': ['gerente_geral', 'administrador'],
  '/logs': ['administrador'],
}

export function defaultRouteForRole(role: UserRole): string {
  if (role === 'operador') return '/agenda'
  return '/dashboard'
}

export function canAccessRoute(role: UserRole, pathname: string): boolean {
  const base = '/' + (pathname.split('/')[1] ?? '')
  const permitido = ROUTE_PERMISSIONS[base]
  if (!permitido) return false
  return permitido.includes(role)
}

// Dentro do Financeiro, Integrações e Previsibilidade só para administrador
// (gerente_geral vê o resto do módulo financeiro).
export function podeVerAbaFinanceiro(role: UserRole, aba: string): boolean {
  if (aba === 'integracoes' || aba === 'previsibilidade') return role === 'administrador'
  return true
}
