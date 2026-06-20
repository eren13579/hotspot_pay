import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import { cn } from '../../utils/cn'

const PRESETS = [
  { key: 'today', label: "Aujourd'hui" },
  { key: '7d', label: '7 jours' },
  { key: '30d', label: '30 jours' },
  { key: '90d', label: '90 jours' },
  { key: 'year', label: 'Cette année' },
  { key: 'custom', label: 'Personnalisé' },
]

export default function PeriodFilter({ theme, value, onChange, allowedKeys }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const filteredPresets = allowedKeys
    ? PRESETS.filter((p) => allowedKeys.includes(p.key))
    : PRESETS

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Si la période active n'est pas autorisée, on réinitialise
  const safeValue = allowedKeys && !allowedKeys.includes(value.period)
    ? { ...value, period: allowedKeys[0], startDate: '', endDate: '' }
    : value

  // Propager la valeur corrigée
  if (safeValue !== value) {
    onChange(safeValue)
  }

  const currentLabel = filteredPresets.find((p) => p.key === safeValue.period)?.label || safeValue.period

  const handlePreset = (key) => {
    if (key !== 'custom') {
      onChange({ ...safeValue, period: key, startDate: '', endDate: '' })
    } else {
      onChange({ ...safeValue, period: key })
    }
    if (key !== 'custom') setOpen(false)
  }

  const isLight = theme === 'light'

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-2 h-9 px-3.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap',
          isLight
            ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 bg-white'
            : 'text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/50 bg-slate-900',
        )}
      >
        <Calendar className="w-3.5 h-3.5 shrink-0" />
        <span>{currentLabel}</span>
        <ChevronDown className={cn('w-3 h-3 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            className={cn(
              'absolute right-0 top-full mt-1.5 z-40 min-w-52 rounded-2xl border shadow-2xl overflow-hidden',
              isLight ? 'bg-white border-slate-200 shadow-slate-200/50' : 'bg-slate-900 border-slate-700/50 shadow-black/50',
            )}
          >
            <div className="p-1.5">
              {filteredPresets.map((preset) => {
                const active = safeValue.period === preset.key
                return (
                  <button
                    key={preset.key}
                    onClick={() => handlePreset(preset.key)}
                    className={cn(
                      'flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-medium transition-all text-left',
                      active
                        ? isLight
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-blue-500/10 text-blue-400'
                        : isLight
                          ? 'text-slate-600 hover:bg-slate-100'
                          : 'text-slate-400 hover:bg-slate-800/50',
                    )}
                  >
                    <span
                      className={cn(
                        'w-1.5 h-1.5 rounded-full shrink-0',
                        active ? 'bg-blue-500' : isLight ? 'bg-slate-300' : 'bg-slate-600',
                      )}
                    />
                    {preset.label}
                  </button>
                )
              })}
            </div>

            {safeValue.period === 'custom' && (
              <div className={cn('px-4 pb-4 pt-1 border-t space-y-3', isLight ? 'border-slate-200' : 'border-slate-700/50')}>
                <div className="space-y-1.5">
                  <label className={cn('text-[10px] font-bold uppercase tracking-wider', isLight ? 'text-slate-500' : 'text-slate-500')}>
                    Date début
                  </label>
                  <input
                    type="date"
                    value={safeValue.startDate}
                    onChange={(e) => onChange({ ...safeValue, startDate: e.target.value })}
                    className={cn(
                      'w-full h-9 px-3 rounded-xl text-xs outline-none transition-all',
                      isLight
                        ? 'bg-slate-50 border border-slate-200 text-slate-900 focus:border-blue-400'
                        : 'bg-slate-800/50 border border-slate-700/50 text-white focus:border-blue-500/50',
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={cn('text-[10px] font-bold uppercase tracking-wider', isLight ? 'text-slate-500' : 'text-slate-500')}>
                    Date fin
                  </label>
                  <input
                    type="date"
                    value={safeValue.endDate}
                    onChange={(e) => onChange({ ...safeValue, endDate: e.target.value })}
                    className={cn(
                      'w-full h-9 px-3 rounded-xl text-xs outline-none transition-all',
                      isLight
                        ? 'bg-slate-50 border border-slate-200 text-slate-900 focus:border-blue-400'
                        : 'bg-slate-800/50 border border-slate-700/50 text-white focus:border-blue-500/50',
                    )}
                  />
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
