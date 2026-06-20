import { Bell } from 'lucide-react'
import SectionCard from './SectionCard'
import SettingsField from './SettingsField'

/** Props : items, values, onChange(key, value), saving */
export default function NotificationsSection({ items, values, onChange, saving }) {
  if (!items?.length) return null

  return (
    <SectionCard icon={Bell} title="Notifications" description="Configuration des emails SMTP">
      {items.map((item) => (
        <SettingsField key={item.key} config={{ ...item, value: values[item.key] ?? item.value }} onChange={onChange} saving={saving} />
      ))}
    </SectionCard>
  )
}
