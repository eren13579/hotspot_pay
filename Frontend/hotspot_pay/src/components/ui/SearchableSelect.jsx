import { useState, useRef, useEffect, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { ChevronDown, X, Search } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Sélectionner...',
  disabled = false,
  error = false,
  icon: IconEl,
}) {
  const theme = useSelector((state) => state.ui.theme)
  const isLight = theme === 'light'
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const inputRef = useRef(null)
  const containerRef = useRef(null)

  const selected = options.find((o) => o.value === value)

  const filtered = useMemo(() => {
    if (!search) return options
    const q = search.toLowerCase()
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q),
    )
  }, [options, search])

  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  const handleSelect = (opt) => {
    onChange(opt.value)
    setOpen(false)
    setSearch('')
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange('')
    setSearch('')
  }

  const selectBase = cn(
    'w-full h-12 text-sm outline-none transition-all duration-200 rounded-xl cursor-pointer flex items-center',
    IconEl ? 'pl-11 pr-10' : 'pl-4 pr-10',
    isLight
      ? 'bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20'
      : 'bg-slate-800/60 border border-slate-700/60 text-white placeholder:text-slate-500 focus-within:border-blue-500/60 focus-within:ring-2 focus-within:ring-blue-500/15',
    disabled && 'opacity-50 cursor-not-allowed',
    error && 'border-red-400',
  )

  const dropdownCls = cn(
    'absolute left-0 right-0 top-full mt-1 z-50 max-h-60 overflow-y-auto rounded-xl border shadow-2xl',
    isLight
      ? 'bg-white border-slate-200'
      : 'bg-slate-800 border-slate-700',
  )

  const inputSearchCls = cn(
    'w-full h-10 px-4 text-sm outline-none bg-transparent',
    isLight ? 'text-slate-900 placeholder:text-slate-400' : 'text-white placeholder:text-slate-500',
  )

  return (
    <div className="relative" ref={containerRef}>
      <div
        className={selectBase}
        onClick={() => { if (!disabled) setOpen(!open) }}
      >
        {IconEl && (
          <div className={cn(
            'absolute left-0 top-0 bottom-0 w-11 flex items-center justify-center pointer-events-none',
            isLight ? 'text-slate-400' : 'text-slate-500',
          )}>
            {IconEl}
          </div>
        )}
        <span className={cn(
          'flex-1 truncate',
          !selected && (isLight ? 'text-slate-400' : 'text-slate-500'),
        )}>
          {selected ? selected.label : placeholder}
        </span>
        <div className="flex items-center gap-1">
          {value && (
            <button
              onClick={handleClear}
              className={cn(
                'p-0.5 rounded transition-colors',
                isLight ? 'hover:bg-slate-200 text-slate-400' : 'hover:bg-slate-700 text-slate-500',
              )}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={cn(
            'w-4 h-4 transition-transform',
            open && 'rotate-180',
            isLight ? 'text-slate-400' : 'text-slate-500',
          )} />
        </div>
      </div>

      {open && (
        <div className={dropdownCls}>
          <div className={cn(
            'sticky top-0 border-b flex items-center',
            isLight ? 'border-slate-200 bg-white' : 'border-slate-700 bg-slate-800',
          )}>
            <Search className={cn(
              'w-4 h-4 ml-4 shrink-0',
              isLight ? 'text-slate-400' : 'text-slate-500',
            )} />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className={inputSearchCls}
            />
          </div>
          {filtered.length === 0 ? (
            <div className={cn(
              'px-4 py-8 text-center text-sm',
              isLight ? 'text-slate-400' : 'text-slate-500',
            )}>
              Aucun résultat
            </div>
          ) : (
            filtered.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt)}
                className={cn(
                  'w-full text-left px-4 py-2.5 text-sm transition-colors',
                  opt.value === value
                    ? isLight ? 'bg-blue-50 text-blue-700 font-medium' : 'bg-blue-500/10 text-blue-400 font-medium'
                    : isLight ? 'text-slate-700 hover:bg-slate-50' : 'text-slate-300 hover:bg-slate-700/50',
                )}
              >
                {opt.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
