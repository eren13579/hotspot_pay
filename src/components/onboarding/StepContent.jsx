import { motion, AnimatePresence } from 'framer-motion'
import { STEP_ICONS, STEPS } from './constants'
import { ProfileStep, NameLocationStep, IpPortStep, CredentialsStep, ReviewStep } from './StepForms'
import { cn } from '../../utils/cn'

/**
 * StepContent — Contenu animé de l'étape courante
 *
 * Props : step, form, update, ipError, showPwd, togglePwd, isLight
 */
export default function StepContent({ step, form, update, ipError, showPwd, togglePwd, isLight }) {
  const Icon = STEP_ICONS[step]

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="flex flex-col items-center text-center px-4 sm:px-8 w-full max-w-lg mx-auto max-h-full overflow-y-auto step-scroll"
      >
        {/* Icône */}
        <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-4 shrink-0">
          <Icon className="w-6 h-6 text-blue-400" />
        </div>

        {/* Titre */}
        <h2 className={cn('text-xl font-bold mb-1.5 shrink-0', isLight ? 'text-slate-800' : 'text-white')}>
          {STEPS[step].title}
        </h2>

        {/* Description */}
        <p className={cn('text-xs leading-relaxed mb-6 max-w-md shrink-0', isLight ? 'text-slate-400' : 'text-slate-400')}>
          {STEPS[step].desc}
        </p>

        {/* Contenu */}
        <div className="w-full shrink-0">
          {step === 0 && <ProfileStep form={form} update={update} isLight={isLight} />}
          {step === 1 && <NameLocationStep form={form} update={update} isLight={isLight} />}
          {step === 2 && <IpPortStep form={form} update={update} ipError={ipError} isLight={isLight} />}
          {step === 3 && <CredentialsStep form={form} update={update} showPwd={showPwd} togglePwd={togglePwd} isLight={isLight} />}
          {step === 4 && <ReviewStep form={form} isLight={isLight} />}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
