import { CreditCard } from 'lucide-react'
import SectionCard from './SectionCard'
import SettingsField from './SettingsField'

/** Props : items, values, onChange(key, value), saving */
export default function PaymentsSection({ items, values, onChange, saving }) {
  if (!items?.length) return null

  return (
    <SectionCard icon={CreditCard} title="Paiements" description="Configuration des passerelles de paiement">
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
