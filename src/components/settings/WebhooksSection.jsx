import { Webhook } from 'lucide-react'
import SectionCard from './SectionCard'
import SettingsField from './SettingsField'

/** Props : items, values, onChange(key, value), saving */
export default function WebhooksSection({ items, values, onChange, saving }) {
  if (!items?.length) return null

  return (
    <SectionCard icon={Webhook} title="Webhooks" description="Configuration des webhooks pour les opérateurs de paiement">
      {items.map((item) => (
        <SettingsField
          key={item.key}
          config={{ ...item, value: values[item.key] ?? item.value }}
          onChange={(k, v) => {
            // Les secrets en password : si masqués, on garde l'ancienne valeur
            if (item.type === 'password' && v === '********') return
            onChange(k, v)
          }}
          saving={saving}
        />
      ))}
    </SectionCard>
  )
}
