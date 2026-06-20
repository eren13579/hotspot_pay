import { useMemo } from 'react'
import { motion } from 'framer-motion'

/**
 * Particles — Particules flottantes décoratives
 * Props : count, isLight
 */
export function Particles({ count = 10, isLight }) {
  const particles = useMemo(() =>
    Array.from({ length: count }).map(() => ({
      size: Math.random() * 2.5 + 1,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      y: -(15 + Math.random() * 25),
      duration: 4 + Math.random() * 6,
      delay: Math.random() * 4,
    })),
    [count],
  )
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: p.size, height: p.size,
            left: p.left, top: p.top,
            backgroundColor: isLight ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.3)',
          }}
          animate={{ y: [0, p.y], opacity: [0.15, 0.5, 0.15] }}
          transition={{ duration: p.duration, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
        />
      ))}
    </div>
  )
}

/**
 * GlowingOrbs — Lueurs décoratives en fond
 * Props : isLight
 */
export function GlowingOrbs({ isLight }) {
  if (isLight) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/4 rounded-full blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-orange-500/4 rounded-full blur-[120px]" />
      </div>
    )
  }
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-orange-500/10 rounded-full blur-[120px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 bg-blue-600/5 rounded-full blur-[150px]" />
    </div>
  )
}
