import { LifeBuoy } from 'lucide-react'
import SectionCard from './SectionCard'
import SettingsField from './SettingsField'

/** Props : items, values, onChange(key, value), saving */
export default function SupportSection({ items, values, onChange, saving }) {
  if (!items?.length) return null

  return (
    <SectionCard icon={LifeBuoy} title="Support" description="Coordonnées de contact et documentation affichées sur la page Aide & Support">
      {items.map((item) => (
        <SettingsField
          key={item.key}
          config={{ ...item, value: values[item.key] ?? item.value }}
          onChange={onChange}
          saving={saving}
        />
      ))}
    </SectionCard>
  )
}
