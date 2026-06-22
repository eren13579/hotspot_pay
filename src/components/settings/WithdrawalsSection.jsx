import { Download } from 'lucide-react'
import SectionCard from './SectionCard'
import SettingsField from './SettingsField'

/** Props : items, values, onChange(key, value), saving */
export default function WithdrawalsSection({ items, values, onChange, saving }) {
  if (!items?.length) return null

  return (
    <SectionCard icon={Download} title="Retraits" description="Configuration des retraits (frais, montants, méthodes)">
      {items.map((item) => (
        <SettingsField key={item.key} config={{ ...item, value: values[item.key] ?? item.value }} onChange={onChange} saving={saving} />
      ))}
    </SectionCard>
  )
}
