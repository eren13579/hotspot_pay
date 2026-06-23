import { Globe } from 'lucide-react'
import SectionCard from './SectionCard'
import SettingsField from './SettingsField'

/** Props : items, values, onChange(key, value), saving */
export default function GeneralSection({ items, values, onChange, saving }) {
  if (!items?.length) return null

  return (
    <SectionCard icon={Globe} title="Général" description="Informations générales de l'application">
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
