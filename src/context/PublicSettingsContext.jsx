import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import useSystemSse from '../hooks/useSystemSse'

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
  whatsappNumber: '+237 6XX XXX XXX',
  docsEnabled: true,
  docsUrl: '/docs',
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

  // SSE temps réel — dès qu'un admin modifie les settings, tous les clients sont notifiés
  useSystemSse({
    settings_updated: () => fetchSettings(),
  })

  // Auto-refresh au retour sur l'onglet (changement d'onglet, alt+tab, etc.)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchSettings()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [fetchSettings])

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
