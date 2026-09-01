import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clientes from './pages/Clientes'
import ClienteDetalhe from './pages/ClienteDetalhe'
import Servicos from './pages/Servicos'
import ServicoDetalhe from './pages/ServicoDetalhe'
import Agenda from './pages/Agenda'
import Equipe from './pages/Equipe'
import Fornecedores from './pages/Fornecedores'
import Financeiro from './pages/Financeiro'
import Logs from './pages/Logs'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/clientes/:id" element={<ClienteDetalhe />} />
          <Route path="/servicos" element={<Servicos />} />
          <Route path="/servicos/:id" element={<ServicoDetalhe />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/equipe" element={<Equipe />} />
          <Route path="/fornecedores" element={<Fornecedores />} />
          <Route path="/financeiro" element={<Financeiro />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  )
}
