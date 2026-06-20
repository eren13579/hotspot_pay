import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

// Redirection : Profil → /dashboard/profile
// Paramètres système → /dashboard/admin/settings
export default function SettingsPage() {
  const { role } = useSelector((state) => state.auth)
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN'

  return <Navigate to={isAdmin ? '/dashboard/admin/settings' : '/dashboard/profile'} replace />
}
