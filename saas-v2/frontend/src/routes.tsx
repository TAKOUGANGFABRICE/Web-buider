import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '../store/auth-store'
import Layout from '../components/Layout'
import Login from '../pages/Login'
import Register from '../pages/Register'
import Dashboard from '../pages/Dashboard'
import Editor from '../pages/Editor'
import Templates from '../pages/Templates'
import Billing from '../pages/Billing'
import Media from '../pages/Media'
import Analytics from '../pages/Analytics'
import Settings from '../pages/Settings'

export function AppRoutes() {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/editor/:id?" element={<Editor />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/media" element={<Media />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

