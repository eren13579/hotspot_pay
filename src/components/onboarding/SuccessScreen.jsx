import { motion } from 'framer-motion'
import { Check, ChevronRight } from 'lucide-react'
import { cn } from '../../utils/cn'
import { Particles, GlowingOrbs } from './BackgroundEffects'

/**
 * SuccessScreen — Écran de célébration après création du hotspot
 *
 * Props : form, isLight, onFinish
 */
export default function SuccessScreen({ form, isLight, onFinish }) {
  return (
    <div className={cn(
      'h-screen w-full flex items-center justify-center overflow-hidden relative select-none',
      isLight ? 'bg-slate-50' : 'bg-slate-950',
    )}>
      <GlowingOrbs isLight={isLight} />
      <Particles count={12} isLight={isLight} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center text-center px-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 flex items-center justify-center mb-6"
        >
          <Check className="w-10 h-10 text-emerald-400" />
        </motion.div>
        <h2 className={cn('text-2xl font-bold mb-2', isLight ? 'text-slate-800' : 'text-white')}>Hotspot créé !</h2>
        <p className={cn('text-sm mb-8 max-w-sm', isLight ? 'text-slate-400' : 'text-slate-400')}>
          Félicitations <span className={cn('font-semibold', isLight ? 'text-slate-800' : 'text-white')}>{form.fullName}</span> !<br />
          Votre hotspot <span className={cn('font-semibold', isLight ? 'text-slate-800' : 'text-white')}>{form.hotspotName}</span> est prêt.
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onFinish}
          className="h-11 px-8 rounded-xl bg-linear-to-r from-blue-600 to-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-shadow flex items-center gap-2"
        >
          Aller au tableau de bord
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </motion.div>
    </div>
  )
}
