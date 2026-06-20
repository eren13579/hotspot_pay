import { Server } from 'lucide-react'
import SectionCard from './SectionCard'
import SettingsField from './SettingsField'

/** Props : items, values, onChange(key, value), saving */
export default function FastApiSection({ items, values, onChange, saving }) {
  if (!items?.length) return null

  return (
    <SectionCard icon={Server} title="FastAPI et routeurs" description="Connexion au microservice FastAPI">
      {items.map((item) => (
        <SettingsField key={item.key} config={{ ...item, value: values[item.key] ?? item.value }} onChange={onChange} saving={saving} />
      ))}
    </SectionCard>
  )
}
