import { useState } from 'react'
import { Crown, Check, X, ChevronDown, RefreshCw, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { cn } from '../../utils/cn'
import { formatXAF } from '../../utils/format'
import { OPERATORS } from './constants'

export default function UpgradeModal({
  open, step, setStep, onClose,
  targetPlan, plans, duration, setDuration,
  operator, setOperator, phone, setPhone,
  submitting, onSubmit, isLight, textPrimary, textSecondary, textMuted,
}) {
  if (!open) return null

  const tier = plans.find(t => t.key === targetPlan)
  const Icon = tier?.icon || Crown
  const totalPrice = (() => {
    if (!tier) return 0
    return duration === 12 ? tier.yearlyPrice : tier.monthlyPrice * duration
  })()

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={() => { if (!submitting) setStep(0); onClose() }}
        role="dialog"
        aria-modal="true"
        aria-label="Souscription à un plan"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 24 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden',
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700/50',
          )}
        >
          {/* En-tête */}
          <div className={cn(
            'flex items-center justify-between px-6 py-4 border-b',
            isLight ? 'border-slate-200' : 'border-slate-700/50',
          )}>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep(Math.max(1, step - 1))}
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer',
                  isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-slate-800 text-slate-400',
                )}
                disabled={step === 1}
                aria-label="Retour"
              >
                {step > 1 && <ChevronDown className="w-4 h-4 rotate-90" />}
              </button>
              <h2 className={cn('text-sm font-bold', textPrimary)}>
                {step === 1 && 'Choisir une durée'}
                {step === 2 && 'Mode de paiement'}
                {step === 3 && 'Confirmation'}
              </h2>
            </div>
            <button onClick={() => { onClose(); setStep(1) }}
              className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer',
                isLight ? 'text-slate-400 hover:bg-slate-100' : 'text-slate-500 hover:bg-slate-800',
                submitting && 'opacity-50 pointer-events-none',
              )}
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Indicateur d'étape */}
          <div className="flex items-center gap-1 px-6 pt-4">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex-1 flex items-center gap-1">
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all',
                  s < step
                    ? 'bg-emerald-500 text-white'
                    : s === step
                      ? 'bg-blue-500 text-white'
                      : isLight ? 'bg-slate-200 text-slate-400' : 'bg-slate-800 text-slate-600',
                )}>
                  {s < step ? <Check className="w-3 h-3" /> : s}
                </div>
                {s < 3 && <div className={cn(
                  'flex-1 h-0.5 rounded-full',
                  s < step ? 'bg-emerald-500' : isLight ? 'bg-slate-200' : 'bg-slate-800',
                )} />}
              </div>
            ))}
          </div>

          {/* Corps */}
          <div className="p-6">
            {/* Étape 1 : Durée */}
            {step === 1 && (
              <div className="space-y-4">
                <div className={cn(
                  'p-4 rounded-xl border flex items-center gap-3',
                  isLight ? 'bg-blue-50 border-blue-200' : 'bg-blue-500/5 border-blue-500/20',
                )}>
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center',
                    isLight ? 'bg-blue-100 text-blue-600' : 'bg-blue-500/15 text-blue-400',
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={cn('text-sm font-bold', textPrimary)}>{tier?.label || targetPlan}</p>
                    <p className={cn('text-[11px]', textSecondary)}>{formatXAF(tier?.monthlyPrice || 0)}/mois</p>
                  </div>
                </div>

                <div>
                  <label className={cn('block text-xs font-medium mb-2', textSecondary)}>Durée d'abonnement</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setDuration(1)}
                      className={cn(
                        'py-3 rounded-xl text-xs font-semibold transition-all border cursor-pointer text-center',
                        duration === 1
                          ? 'bg-blue-500 text-white border-blue-500'
                          : isLight
                            ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            : 'bg-slate-800/50 text-slate-300 border-slate-700 hover:bg-slate-700',
                      )}>
                      <div>Mensuel</div>
                      <div className={cn('text-[10px] font-normal opacity-70', duration === 1 ? 'text-blue-200' : '')}>
                        {formatXAF(tier?.monthlyPrice || 0)}
                      </div>
                    </button>
                    <button onClick={() => setDuration(12)}
                      className={cn(
                        'py-3 rounded-xl text-xs font-semibold transition-all border cursor-pointer text-center relative',
                        duration === 12
                          ? 'bg-blue-500 text-white border-blue-500'
                          : isLight
                            ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            : 'bg-slate-800/50 text-slate-300 border-slate-700 hover:bg-slate-700',
                      )}>
                      <div>Annuel</div>
                      <div className={cn('text-[10px] font-normal opacity-70', duration === 12 ? 'text-blue-200' : '')}>
                        {formatXAF(tier?.yearlyPrice || 0)}
                      </div>
                      <span className="absolute -top-2 -right-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-emerald-500 text-white">
                        -20%
                      </span>
                    </button>
                  </div>
                </div>

                <button onClick={() => setStep(2)}
                  className={cn(
                    'w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                    isLight ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600',
                  )}>
                  Continuer
                </button>
              </div>
            )}

            {/* Étape 2 : Paiement */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className={cn('block text-xs font-medium mb-2', textSecondary)}>Opérateur</label>
                  <div className="grid grid-cols-2 gap-2">
                    {OPERATORS.map(o => (
                      <button key={o.value} onClick={() => setOperator(o.value)}
                        className={cn(
                          'py-3 rounded-xl text-xs font-semibold transition-all border cursor-pointer text-center',
                          operator === o.value
                            ? 'bg-blue-500 text-white border-blue-500'
                            : isLight
                              ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              : 'bg-slate-800/50 text-slate-300 border-slate-700 hover:bg-slate-700',
                        )}>
                        <o.icon className="w-4 h-4 mx-auto mb-1" />
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={cn('block text-xs font-medium mb-1.5', textSecondary)}>
                    Numéro de téléphone <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+237 6XX XXX XXX"
                    aria-label="Numéro de téléphone pour le paiement"
                    className={cn(
                      'w-full px-4 py-2.5 rounded-xl text-sm font-medium outline-none transition-all border',
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-400'
                        : 'bg-slate-800/50 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500',
                    )}
                  />
                  <p className={cn('text-[10px] mt-1.5', textMuted)}>
                    Vous recevrez une demande de paiement sur ce numéro
                  </p>
                </div>

                <button
                  onClick={() => setStep(3)}
                  disabled={!phone}
                  className={cn(
                    'w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                    isLight ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600',
                  )}>
                  Vérifier et confirmer
                </button>
              </div>
            )}

            {/* Étape 3 : Confirmation */}
            {step === 3 && (
              <div className="space-y-4">
                <div className={cn(
                  'p-4 rounded-xl border',
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/30 border-slate-700/50',
                )}>
                  <div className="flex items-center justify-between mb-3 pb-3 border-b">
                    <span className={cn('text-[11px] font-medium', textSecondary)}>Plan</span>
                    <span className={cn('text-xs font-bold', textPrimary)}>{tier?.label || targetPlan}</span>
                  </div>
                  <div className="flex items-center justify-between mb-3 pb-3 border-b">
                    <span className={cn('text-[11px] font-medium', textSecondary)}>Durée</span>
                    <span className={cn('text-xs font-bold', textPrimary)}>
                      {duration === 1 ? 'Mensuel' : 'Annuel (12 mois)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-3 pb-3 border-b">
                    <span className={cn('text-[11px] font-medium', textSecondary)}>Opérateur</span>
                    <span className={cn('text-xs font-bold', textPrimary)}>
                      {OPERATORS.find(o => o.value === operator)?.label || operator}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-3 pb-3 border-b">
                    <span className={cn('text-[11px] font-medium', textSecondary)}>Téléphone</span>
                    <span className={cn('text-xs font-bold font-mono', textPrimary)}>{phone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={cn('text-xs font-medium', textPrimary)}>Total à payer</span>
                    <span className={cn('text-lg font-black', textPrimary)}>
                      {formatXAF(totalPrice)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={onSubmit}
                  disabled={submitting}
                  className={cn(
                    'w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
                    isLight ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600',
                  )}
                  aria-label="Confirmer et payer"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Confirmer et payer
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
