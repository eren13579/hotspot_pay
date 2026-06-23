import { Wifi } from 'lucide-react'
import SectionCard from './SectionCard'
import SettingsField from './SettingsField'

/** Props : items, values, onChange(key, value), saving */
export default function PortalSection({ items, values, onChange, saving }) {
  if (!items?.length) return null

  return (
    <SectionCard icon={Wifi} title="Portail captif" description="Configuration du portail client">
      {items.map((item) => (
        <SettingsField key={item.key} config={{ ...item, value: values[item.key] ?? item.value }} onChange={onChange} saving={saving} />
      ))}
    </SectionCard>
  )
}
