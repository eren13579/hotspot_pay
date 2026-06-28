import { useState, useMemo } from 'react'
import { CreditCard, Smartphone, Building2 } from 'lucide-react'
import { cn } from '../../utils/cn'
import SectionCard from './SectionCard'
import SettingsField from './SettingsField'

const PAYMENT_TABS = [
  { key: 'moneroo', label: 'Moneroo', icon: Smartphone },
  { key: 'campay',  label: 'Campay',  icon: Building2 },
]

/** Props : items, values, onChange(key, value), saving */
export default function PaymentsSection({ items, values, onChange, saving }) {
  const [activeTab, setActiveTab] = useState('moneroo')

  // Séparer les items par passerelle
  const { moneroo, campay } = useMemo(() => {
    const moneroo = []
    const campay = []
    for (const item of items ?? []) {
      if (item.key.startsWith('payments.moneroo.')) moneroo.push(item)
      else if (item.key.startsWith('payments.campay.')) campay.push(item)
    }
    return { moneroo, campay }
  }, [items])

  const currentItems = activeTab === 'moneroo' ? moneroo : campay
  const isEmpty = currentItems.length === 0

  if (!items?.length) return null

  return (
    <SectionCard icon={CreditCard} title="Paiements" description="Configuration des passerelles de paiement">
      {/* ── Onglets Moneroo / Campay ── */}
      <div className="flex gap-1.5 pb-2">
        {PAYMENT_TABS.map(({ key, label, icon: Icon }) => {
          const isActive = activeTab === key
          const itemCount = key === 'moneroo' ? moneroo.length : campay.length
          return (
            <button
              key={key}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(key)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 cursor-pointer',
                isActive
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25 shadow-sm shadow-blue-500/10'
                  : 'text-slate-400 border border-transparent hover:text-white hover:bg-slate-800/40',
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              <span className={cn(
                'text-[10px] ml-0.5 px-1 py-0.5 rounded',
                isActive ? 'bg-blue-500/20 text-blue-300' : 'text-slate-500',
              )}>
                {itemCount}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Contenu de l'onglet actif ── */}
      <div
        role="tabpanel"
        key={activeTab}
        className="space-y-4 pt-1"
      >
        {isEmpty ? (
          <p className="text-xs text-slate-500 italic text-center py-4">
            Aucun paramètre pour cette passerelle
          </p>
        ) : (
          currentItems.map((item) => (
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
          ))
        )}
      </div>
    </SectionCard>
  )
}
