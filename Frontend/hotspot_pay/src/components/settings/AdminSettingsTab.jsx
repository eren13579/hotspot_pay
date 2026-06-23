import { useState, useEffect, useCallback } from 'react'
import { Save, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { adminSettingsApi } from '../../api/endpoints'
import { cn } from '../../utils/cn'
import GeneralSection from './GeneralSection'
import BrandingSection from './BrandingSection'
import AboutSection from './AboutSection'
import PaymentsSection from './PaymentsSection'
import FastApiSection from './FastApiSection'
import PortalSection from './PortalSection'
import SecuritySection from './SecuritySection'
import NotificationsSection from './NotificationsSection'

const SECTION_MAP = {
  general: GeneralSection,
  branding: BrandingSection,
  about: AboutSection,
  payments: PaymentsSection,
  fastapi: FastApiSection,
  portal: PortalSection,
  security: SecuritySection,
  notifications: NotificationsSection,
}

/** Props : isLight */
export default function AdminSettingsTab({ isLight }) {
  const [sections, setSections] = useState([])
  const [values, setValues] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const textSecondary = isLight ? 'text-slate-500' : 'text-slate-400'

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data } = await adminSettingsApi.get()
      const settings = data?.data
      if (settings?.sections) {
        setSections(settings.sections)
        const flat = {}
        settings.sections.forEach((section) => {
          section.items.forEach((item) => {
            flat[item.key] = item.value ?? ''
          })
        })
        setValues(flat)
      }
    } catch (err) {
      setError(err.message || 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSettings() }, [fetchSettings])

  const handleChange = useCallback((key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = { settings: Object.entries(values).map(([key, value]) => ({ key, value })) }
      const { data } = await adminSettingsApi.update(payload)
      if (data?.success) {
        toast.success('Paramètres système mis à jour')
        // Refresh to get masked secrets back
        await fetchSettings()
      } else {
        toast.error(data?.message || 'Erreur lors de la sauvegarde')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Erreur réseau')
    } finally {
      setSaving(false)
    }
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className={cn('rounded-2xl p-6 space-y-4 animate-pulse', isLight ? 'bg-white border border-slate-200' : 'bg-slate-900/50 border border-slate-800')}>
            <div className="h-5 w-40 rounded-lg bg-slate-800" />
            <div className="h-10 rounded-xl bg-slate-800" />
            <div className="h-10 rounded-xl bg-slate-800" />
          </div>
        ))}
      </div>
    )
  }

  // ── Error ──
  if (error) {
    return (
      <div className={cn('rounded-2xl p-6 text-center', isLight ? 'bg-white border border-slate-200' : 'bg-slate-900/50 border border-slate-800')}>
        <p className="text-sm text-red-400 mb-3">Erreur : {error}</p>
        <button onClick={fetchSettings}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors cursor-pointer">
          <RefreshCw className="w-3.5 h-3.5" /> Réessayer
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header + Save */}
      <div className="flex items-center justify-between">
        <p className={cn('text-xs', textSecondary)}>
          {sections.reduce((acc, s) => acc + s.items.length, 0)} paramètres · {sections.length} sections
        </p>
        <button onClick={handleSave} disabled={saving}
          className={cn('flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50',
            isLight ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600')}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Sauvegarde...' : 'Tout enregistrer'}
        </button>
      </div>

      {/* Sections */}
      {sections.map((section) => {
        const SectionComponent = SECTION_MAP[section.key]
        if (!SectionComponent) {
          // Fallback for unknown sections
          return null
        }
        return (
          <motion.div key={section.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <SectionComponent
              isLight={isLight}
              items={section.items}
              values={values}
              onChange={handleChange}
              saving={saving}
            />
          </motion.div>
        )
      })}
    </div>
  )
}
