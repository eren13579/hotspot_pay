import { cn } from '../../utils/cn'

export default function LoadingSkeleton({ isLight }) {
  const bg = isLight ? 'bg-slate-200' : 'bg-slate-800'
  const cardBg = isLight ? 'bg-white border border-slate-200' : 'bg-slate-900/40 border border-slate-800'
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-4 animate-pulse">
        <div className={cn('w-11 h-11 rounded-2xl', bg)} />
        <div className="space-y-1.5">
          <div className={cn('h-5 w-40 rounded-lg', bg)} />
          <div className={cn('h-3.5 w-28 rounded-lg', bg)} />
        </div>
      </div>

      {/* Current plan skeleton */}
      <div className={cn('rounded-2xl p-5 animate-pulse', cardBg)}>
        <div className="flex items-center gap-4">
          <div className={cn('w-14 h-14 rounded-2xl', bg)} />
          <div className="space-y-2 flex-1">
            <div className={cn('h-5 w-32 rounded-lg', bg)} />
            <div className={cn('h-4 w-48 rounded-lg', bg)} />
          </div>
          <div className="space-y-2 text-right">
            <div className={cn('h-6 w-24 rounded-lg ml-auto', bg)} />
            <div className={cn('h-3.5 w-20 rounded-lg ml-auto', bg)} />
          </div>
        </div>
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className={cn('rounded-2xl p-5 space-y-4 animate-pulse', cardBg)}>
            <div className="flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-xl', bg)} />
              <div className="space-y-1.5 flex-1">
                <div className={cn('h-4 w-20 rounded-lg', bg)} />
                <div className={cn('h-3 w-32 rounded-lg', bg)} />
              </div>
            </div>
            <div className={cn('h-8 w-28 rounded-lg', bg)} />
            <div className="space-y-2">
              {[1, 2, 3, 4].map(j => <div key={j} className={cn('h-3.5 w-full rounded-lg', bg)} />)}
            </div>
            <div className={cn('h-9 w-full rounded-xl', bg)} />
          </div>
        ))}
      </div>
    </div>
  )
}
