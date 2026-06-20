import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/axios'

const PublicSettingsContext = createContext(null)

const DEFAULTS = {
  logoUrl: '',
  primaryColor: '#3B82F6',
  faviconUrl: '',
  appName: 'HotspotPay',
  supportEmail: 'support@hotspotpay.cm',
  maintenanceMode: false,
  registrationEnabled: true,
  aboutEnabled: true,
  aboutTitle: '',
  aboutSubtitle: '',
  aboutDescription: '',
  aboutPhotos: [],
}

export function PublicSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await api.get('/public/settings')
      if (data?.success && data?.data) {
        setSettings({ ...DEFAULTS, ...data.data })
      }
    } catch (err) {
      console.warn('Impossible de charger les settings publics :', err.message)
      setError(err.message)
      // On garde les defaults silencieusement
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  return (
    <PublicSettingsContext.Provider value={{ settings, loading, error, refetch: fetchSettings }}>
      {children}
    </PublicSettingsContext.Provider>
  )
}

export function usePublicSettings() {
  const ctx = useContext(PublicSettingsContext)
  if (!ctx) throw new Error('usePublicSettings must be used within PublicSettingsProvider')
  return ctx
}
