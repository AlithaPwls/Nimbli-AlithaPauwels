import { Routes, Route } from 'react-router-dom'
import { Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import DashboardKind from './pages/DashboardKind.jsx'
import DashboardOuder from './pages/DashboardOuder.jsx'
import DashboardKine from './pages/DashboardKine.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard/kind" element={
        <ProtectedRoute>
          <DashboardKind />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/ouder" element={
        <ProtectedRoute>
          <DashboardOuder />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/kine" element={
        <ProtectedRoute>
          <DashboardKine />
        </ProtectedRoute>
      } />
    </Routes>
  )
}