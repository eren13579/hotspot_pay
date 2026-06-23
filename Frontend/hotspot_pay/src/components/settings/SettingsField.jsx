import { useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { Eye, EyeOff, Info, Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'

/**
 * Champ intelligent pour les paramètres système
 * Lit le thème depuis Redux automatiquement
 * Design PRO MAX : animations, glassmorphisme
 */
export default function SettingsField({ config, onChange, saving }) {
  const theme = useSelector((state) => state.ui.theme)
  const isLight = theme === 'light'
  const [showSecret, setShowSecret] = useState(false)
  const [focused, setFocused] = useState(false)

  const inputCls = cn(
    'w-full px-3 py-2.5 rounded-xl text-xs font-medium outline-none transition-all duration-200',
    'border placeholder:text-slate-600',
    isLight
      ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
      : 'bg-slate-800/40 border-slate-700/50 text-white',
    focused
      ? isLight ? 'border-amber-400 shadow-lg shadow-amber-500/5' : 'border-amber-500/60 shadow-lg shadow-amber-500/10'
      : isLight ? 'hover:border-slate-300' : 'hover:border-slate-600/50',
  )

  const labelCls = cn('block text-xs font-medium mb-1.5', isLight ? 'text-slate-700' : 'text-slate-300')
  const descCls = cn('text-[10px] mt-1.5 flex items-start gap-1', isLight ? 'text-slate-400' : 'text-slate-500')

  const handleChange = useCallback((e) => {
    onChange(config.key, e.target.value)
  }, [config.key, onChange])

  if (config.type === 'switch') {
    const checked = config.value === 'true'
    return (
      <label className="flex items-center justify-between gap-3 cursor-pointer group py-1">
        <div className="flex-1 min-w-0">
          <p className={cn('text-xs font-medium transition-colors', isLight ? 'text-slate-700 group-hover:text-slate-900' : 'text-slate-300 group-hover:text-white')}>
            {config.label}
          </p>
          {config.description && (
            <p className={cn('text-[10px] mt-0.5', isLight ? 'text-slate-400' : 'text-slate-500')}>{config.description}</p>
          )}
        </div>
        <div className="relative shrink-0">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(config.key, e.target.checked ? 'true' : 'false')}
            className="sr-only peer"
          />
          <div className={cn(
            'w-10 h-5.5 rounded-full transition-all duration-200',
            'peer-checked:bg-gradient-to-r peer-checked:from-amber-500 peer-checked:to-amber-400',
            'bg-slate-600/50',
            'after:content-[""] after:absolute after:top-0.5 after:start-0.5 after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all after:duration-200',
            'peer-checked:after:translate-x-[18px]',
            'peer-checked:shadow-lg peer-checked:shadow-amber-500/20',
          )} />
        </div>
      </label>
    )
  }

  if (config.type === 'password' || config.type === 'secret') {
    const isMasked = config.value === '********'
    return (
      <div>
        <label className={labelCls}>{config.label}</label>
        <div className="relative">
          <input
            value={config.value ?? ''}
            onChange={handleChange}
            type={showSecret ? 'text' : 'password'}
            placeholder={isMasked ? 'Conserver la valeur actuelle' : ''}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className={cn(inputCls, 'pr-10')}
          />
          <button
            type="button"
            onClick={() => setShowSecret(!showSecret)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-all cursor-pointer"
            tabIndex={-1}
          >
            {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
        {config.description && (
          <p className={descCls}><Info className="w-3 h-3 mt-0.5 shrink-0" />{config.description}</p>
        )}
      </div>
    )
  }

  return (
    <div>
      <label className={labelCls}>{config.label}</label>
      <input
        value={config.value ?? ''}
        onChange={handleChange}
        type={config.type === 'number' ? 'number' : 'text'}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={inputCls}
        placeholder={config.description || ''}
      />
      {config.description && (
        <p className={descCls}>{config.description}</p>
      )}
    </div>
  )
}
