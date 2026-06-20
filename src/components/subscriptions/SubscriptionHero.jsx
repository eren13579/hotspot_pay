import { Crown, Check, Clock, Calendar, ArrowUpRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'
import { formatXAF, formatDate } from '../../utils/format'
import { getStatusInfo, PLAN_LEVEL } from './constants'
import UsageBars from './UsageBars'

export default function SubscriptionHero({
  mySub, plans, currentPlanName, usage, planLevel, isAdmin,
  isLight, textPrimary, textSecondary, textMuted, onUpgrade,
}) {
  if (!mySub) return null

  const statusInfo = getStatusInfo(mySub.status)
  const StatusIcon = statusInfo?.icon || Check

  const currentPlanAdv = plans.find(x => x.key === currentPlanName)?.advantages || {}

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'rounded-2xl border overflow-hidden relative',
        isLight
          ? 'bg-linear-to-br from-blue-50 to-white border-blue-200'
          : 'bg-linear-to-br from-blue-500/8 to-slate-900 border-blue-500/20',
      )}
      role="region"
      aria-label="Abonnement actuel"
    >
      {/* Subtile décoratif */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5" aria-hidden="true">
        <Crown className="w-full h-full" />
      </div>

      <div className="p-5 relative">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Infos plan */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className={cn(
              'w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-2',
              isLight ? 'bg-blue-100 text-blue-600 border-blue-200' : 'bg-blue-500/15 text-blue-400 border-blue-500/25',
            )}>
              <Crown className="w-7 h-7" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className={cn('text-lg font-bold', textPrimary)}>
                  {plans.find(t => t.key === currentPlanName)?.label || currentPlanName}
                </h2>
                <span className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border',
                  statusInfo.bg,
                )}>
                  <span className={cn('w-1.5 h-1.5 rounded-full', statusInfo.dot)} />
                  <StatusIcon className="w-3 h-3" />
                  {statusInfo.label}
                </span>
              </div>

              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {mySub.daysRemaining != null && mySub.status === 'ACTIVE' && (
                  <div className={cn(
                    'flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full',
                    mySub.daysRemaining <= 7
                      ? 'bg-red-500/10 text-red-400'
                      : mySub.daysRemaining <= 30
                        ? 'bg-yellow-500/10 text-yellow-400'
                        : 'bg-emerald-500/10 text-emerald-400',
                  )}>
                    <Clock className="w-3 h-3" />
                    {mySub.daysRemaining} jour{mySub.daysRemaining !== 1 ? 's' : ''} restant{mySub.daysRemaining !== 1 ? 's' : ''}
                  </div>
                )}
                {mySub.startsAt && (
                  <span className={cn('text-[11px]', textSecondary)}>
                    <Calendar className="inline w-3 h-3 mr-1 align-middle" />
                    Depuis le {formatDate(mySub.startsAt)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Montant + expiration */}
          <div className="text-left sm:text-right shrink-0">
            <p className={cn('text-2xl font-black tracking-tight', textPrimary)}>
              {formatXAF(mySub.amount || 0)}
            </p>
            {mySub.expiresAt && (
              <p className={cn('text-[11px] mt-0.5', textSecondary)}>
                Expire le {formatDate(mySub.expiresAt)}
              </p>
            )}
          </div>
        </div>

        {/* Barres d'utilisation */}
        <UsageBars
          usage={usage}
          currentPlanAdv={currentPlanAdv}
          plans={plans}
          currentPlanName={currentPlanName}
          isLight={isLight}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
        />

        {/* Upgrade prompt pour non-premium */}
        {!isAdmin && planLevel < 2 && (
          <div className={cn(
            'mt-4 pt-4 border-t flex items-center justify-between',
            isLight ? 'border-blue-200' : 'border-blue-500/15',
          )}>
            <p className={cn('text-[11px]', textSecondary)}>
              {planLevel === 0
                ? 'Passez à PRO pour débloquer plus de fonctionnalités'
                : 'Passez à PREMIUM pour des hotspots illimités'}
            </p>
            <button
              onClick={() => onUpgrade(planLevel === 0 ? 'PRO' : 'PREMIUM')}
              aria-label={`Passer à ${planLevel === 0 ? 'PRO' : 'PREMIUM'}`}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
                isLight ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-amber-500 text-white hover:bg-amber-600',
              )}>
              Passer à {planLevel === 0 ? 'PRO' : 'PREMIUM'}
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
