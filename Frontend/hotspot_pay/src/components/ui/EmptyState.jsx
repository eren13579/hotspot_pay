import { motion } from 'framer-motion'
import { Wifi, X, RefreshCw, Search, Plus } from 'lucide-react'
import { cn } from '../../utils/cn'

/**
 * EmptyState — Aucun contenu avec CTA optionnel
 *
 * Propose une invitation à agir plutôt qu'un simple constat vide.
 *
 * Props :
 *  - icon     : composant lucide-react (défaut: Wifi)
 *  - title    : string (requis)
 *  - message  : string (requis)
 *  - action   : { label: string, onClick: fn, variant?: 'primary'|'secondary', icon?: lucide } | null
 *  - isLight  : boolean
 */
export default function EmptyState({ icon: Icon = Wifi, title, message, action, isLight }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className={cn(
        'w-20 h-20 rounded-3xl flex items-center justify-center mb-6',
        isLight ? 'bg-blue-50' : 'bg-blue-500/10',
      )}>
        <Icon className={cn('w-10 h-10', isLight ? 'text-blue-500' : 'text-blue-400')} />
      </div>
      <h2 className={cn('text-2xl font-bold mb-3', isLight ? 'text-slate-900' : 'text-white')}>{title}</h2>
      <p className={cn('text-sm mb-8 max-w-md leading-relaxed', isLight ? 'text-slate-500' : 'text-slate-400')}>{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className={cn(
            'flex items-center gap-2 h-11 px-6 rounded-xl text-sm font-semibold transition-all cursor-pointer active:scale-[0.97]',
            action.variant === 'secondary'
              ? isLight
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              : 'bg-linear-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40',
          )}
        >
          {action.icon || <Plus className="w-4 h-4" />}
          {action.label}
        </button>
      )}
    </div>
  )
}

/**
 * ErrorState — Erreur avec explication et bouton réessayer
 *
 * Donne un contexte clair sur ce qui n'a pas fonctionné et comment reprendre.
 *
 * Props :
 *  - error    : string (requis) — message décrivant le problème
 *  - onRetry  : fn (requis)
 *  - isLight  : boolean
 *  - icon     : composant lucide-react (défaut: X)
 *  - title    : string (défaut: "Impossible de charger les données")
 *  - hint     : string (optionnel) — conseil de contournement
 */
export function ErrorState({ error, onRetry, isLight, icon: Icon = X, title = 'Impossible de charger les données', hint }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className={cn(
        'w-16 h-16 rounded-2xl flex items-center justify-center mb-4',
        isLight ? 'bg-red-50' : 'bg-red-500/10',
      )}>
        <Icon className={cn('w-8 h-8', isLight ? 'text-red-500' : 'text-red-400')} />
      </div>
      <h3 className={cn('text-lg font-bold mb-2', isLight ? 'text-slate-900' : 'text-white')}>{title}</h3>
      <p className={cn('text-sm mb-2 max-w-xs', isLight ? 'text-slate-500' : 'text-slate-400')}>{error}</p>
      {hint && (
        <p className={cn('text-[11px] max-w-xs mb-6', isLight ? 'text-slate-400' : 'text-slate-500')}>{hint}</p>
      )}
      {!hint && <div className="mb-6" />}
      <button
        onClick={onRetry}
        className="flex items-center gap-2 h-10 px-5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/25 cursor-pointer active:scale-[0.97]"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Réessayer
      </button>
    </div>
  )
}

/**
 * LoadingSkeleton — Animation de chargement avec blocs gris
 *
 * Props :
 *  - rows     : number (défaut: 5) — lignes de skeleton
 *  - isLight  : boolean
 *  - type     : 'table' | 'card' | 'form' | 'detail'
 */
export function LoadingSkeleton({ rows = 5, isLight, type = 'table' }) {
  const cardBg = isLight ? 'bg-white border border-slate-200' : 'bg-slate-900/50 border border-slate-800'
  const skeleton = 'bg-slate-800 rounded'

  const tableRows = Array.from({ length: rows }).map((_, i) => (
    <div key={i} className="flex items-center gap-4">
      <div className={`w-8 h-8 rounded-lg ${skeleton}`} />
      <div className={`flex-1 h-4 ${skeleton}`} />
      <div className={`w-24 h-4 ${skeleton}`} />
      <div className={`w-20 h-4 ${skeleton}`} />
    </div>
  ))

  if (type === 'card') {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className={`h-8 w-36 ${skeleton} rounded-lg`} />
          <div className={`h-9 w-44 ${skeleton} rounded-xl`} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className={`rounded-2xl p-4 ${cardBg}`}>
              <div className={`h-3 w-16 ${skeleton} mb-3`} />
              <div className={`h-7 w-24 ${skeleton} mb-2`} />
              <div className={`h-3 w-12 ${skeleton}`} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (type === 'form') {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl ${skeleton}`} />
          <div className="space-y-2">
            <div className={`h-6 w-56 ${skeleton} rounded-lg`} />
            <div className={`h-4 w-40 ${skeleton} rounded-lg`} />
          </div>
        </div>
        <div className={`rounded-2xl overflow-hidden ${cardBg}`}>
          <div className="p-6 space-y-5">
            <div className={`h-12 ${skeleton} rounded-xl`} />
            <div className={`h-12 ${skeleton} rounded-xl`} />
            <div className={`h-32 ${skeleton} rounded-xl`} />
            <div className={`h-10 w-40 ${skeleton} rounded-xl`} />
          </div>
        </div>
      </div>
    )
  }

  if (type === 'detail') {
    return (
      <div className="space-y-6 animate-pulse">
        <div className={`h-8 w-48 ${skeleton} rounded-lg`} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`lg:col-span-2 rounded-2xl p-6 h-64 ${cardBg}`} />
          <div className={`rounded-2xl p-6 h-64 ${cardBg}`} />
        </div>
      </div>
    )
  }

  // Table (default)
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className={`h-8 w-48 ${skeleton} rounded-lg`} />
        <div className="flex gap-2">
          <div className={`h-9 w-36 ${skeleton} rounded-xl`} />
          <div className={`h-9 w-24 ${skeleton} rounded-xl`} />
        </div>
      </div>
      <div className={`rounded-2xl overflow-hidden ${cardBg}`}>
        <div className="p-6 space-y-4">{tableRows}</div>
      </div>
    </div>
  )
}

/**
 * NoSearchResults — Aucun résultat pour une recherche
 *
 * Suggère d'élargir ou de modifier la recherche.
 *
 * Props : query (string), isLight (boolean)
 */
export function NoSearchResults({ query, isLight }) {
  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'
  return (
    <div className={`flex flex-col items-center px-6 py-16 text-center ${textMuted}`}>
      <Search className="w-8 h-8 mb-3 opacity-40" />
      <p className="font-semibold text-sm mb-1">Aucun résultat</p>
      {query ? (
        <>
          <p className="text-xs mb-2">Aucun élément ne correspond à &quot;<strong>{query}</strong>&quot;</p>
          <p className="text-[10px]">Essayez un autre mot-clé ou vérifiez l'orthographe</p>
        </>
      ) : (
        <p className="text-xs">Utilisez la barre de recherche pour filtrer la liste</p>
      )}
    </div>
  )
}
