import { Routes, Route } from 'react-router-dom'
import { Navigate } from 'react-router-dom'
import Login from './pages/loginflow/Login.jsx'
import LoginWithCode from './pages/loginflow/LoginWithCode.tsx'
import RegisterOuder from './pages/loginflow/RegisterOuder.tsx'
import RegisterKinePractice from './pages/loginflow/RegisterKinePractice.tsx'
import DashboardKind from './pages/kind/DashboardKind.jsx'
import DashboardOuder from './pages/ouder/DashboardOuder.jsx'
import DashboardKine from './pages/kine/DashboardKine.jsx'
import KineOefeningen from './pages/kine/KineOefeningen.jsx'
import KineInstellingen from './pages/kine/KineInstellingen.jsx'
import KineLayout from './components/kine/KineLayout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<LoginWithCode />} />
      <Route path="/register/ouder" element={<RegisterOuder />} />
      <Route path="/register/kine" element={<RegisterKinePractice />} />
      <Route path="/loginwithcode" element={<Navigate to="/register" replace />} />
      <Route path="/choose-password" element={<Navigate to="/register" replace />} />
      <Route path="/dashboard/kind" element={
        <ProtectedRoute allowedRole="child">
          <DashboardKind />
        </ProtectedRoute>
      } />
      <Route path="/dashboard/ouder" element={
        <ProtectedRoute allowedRole="parent">
          <DashboardOuder />
        </ProtectedRoute>
      } />
      <Route
        path="/dashboard/kine"
        element={
          <ProtectedRoute allowedRole="kine">
            <KineLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardKine />} />
        <Route path="oefeningen" element={<KineOefeningen />} />
        <Route path="instellingen" element={<KineInstellingen />} />
      </Route>
    </Routes>
  )
}
