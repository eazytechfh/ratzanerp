import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { canAccessRoute, defaultRouteForRole } from '../lib/permissions'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, perfil } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated || !perfil) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (!canAccessRoute(perfil.role, location.pathname)) {
    return <Navigate to={defaultRouteForRole(perfil.role)} replace />
  }

  return <>{children}</>
}
