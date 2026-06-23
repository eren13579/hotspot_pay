import { useState } from 'react'
import { useSelector } from 'react-redux'
import { Palette } from 'lucide-react'
import { cn } from '../../utils/cn'
import SectionCard from './SectionCard'
import SettingsUploader from './SettingsUploader'

/** Props : items, values, onChange(key, value), saving */
export default function BrandingSection({ items, values, onChange, saving }) {
  const theme = useSelector((state) => state.ui.theme)
  const isLight = theme === 'light'
  const [focused, setFocused] = useState(false)

  if (!items?.length) return null

  const primaryColor = values['branding.primaryColor'] ?? '#2563EB'
  const logoUrl = values['branding.logoUrl'] ?? ''
  const faviconUrl = values['branding.faviconUrl'] ?? ''

  return (
    <SectionCard icon={Palette} title="Marque et présentation" description="Logo, favicon, couleurs">
      <SettingsUploader
        section="logo"
        currentUrl={logoUrl}
        onUploaded={(url) => onChange('branding.logoUrl', url)}
        label="Logo de l'application"
      />

      <SettingsUploader
        section="favicon"
        currentUrl={faviconUrl}
        onUploaded={(url) => onChange('branding.faviconUrl', url)}
        label="Favicon"
        accept="image/png,image/x-icon,image/svg+xml,image/gif"
      />

      {/* Couleur principale */}
      <div>
        <label className={cn('block text-xs font-medium mb-1.5', isLight ? 'text-slate-700' : 'text-slate-300')}>
          Couleur principale
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={primaryColor}
            onChange={(e) => onChange('branding.primaryColor', e.target.value)}
            className="w-11 h-11 rounded-xl cursor-pointer border-2 border-slate-700/50 bg-transparent p-0.5"
          />
          <input
            value={primaryColor}
            onChange={(e) => onChange('branding.primaryColor', e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={cn(
              'flex-1 px-3 py-2.5 rounded-xl text-xs font-medium outline-none transition-all duration-200',
              'border',
              isLight
                ? 'bg-slate-50 border-slate-200 text-slate-900'
                : 'bg-slate-800/40 border-slate-700/50 text-white',
              focused
                ? 'border-amber-500/60 shadow-lg shadow-amber-500/10'
                : 'hover:border-slate-600/50',
            )}
            placeholder="#2563EB"
          />
        </div>
      </div>
    </SectionCard>
  )
}
