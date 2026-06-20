import { useSelector } from 'react-redux'
import { cn } from '../../utils/cn'

/**
 * Carte de section avec design glassmorphique PRO MAX
 * Lit le thème depuis Redux automatiquement
 */
export default function SectionCard({ icon: Icon, title, description, children, className }) {
  const theme = useSelector((state) => state.ui.theme)
  const isLight = theme === 'light'

  return (
    <div
      className={cn(
        'relative rounded-2xl border transition-all duration-300 overflow-hidden',
        isLight
          ? 'bg-white border-slate-200 shadow-sm shadow-slate-200/50 hover:shadow-md hover:shadow-slate-200/50'
          : 'bg-slate-900/40 border-slate-800/60 backdrop-blur-xl shadow-xl shadow-black/20 hover:border-slate-700/80',
        className,
      )}
    >
      {/* Barre décorative */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 to-amber-600 opacity-60" />

      <div className="p-5 space-y-4">
        {(title || Icon) && (
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800/30">
            {Icon && (
              <div className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center',
                isLight ? 'bg-blue-50' : 'bg-blue-500/10 border border-blue-500/20',
              )}>
                <Icon className={cn('w-4 h-4', isLight ? 'text-blue-600' : 'text-blue-400')} />
              </div>
            )}
            <div>
              {title && (
                <h3 className={cn('text-sm font-bold', isLight ? 'text-slate-900' : 'text-white')}>{title}</h3>
              )}
              {description && (
                <p className={cn('text-[10px]', isLight ? 'text-slate-500' : 'text-slate-500')}>{description}</p>
              )}
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
