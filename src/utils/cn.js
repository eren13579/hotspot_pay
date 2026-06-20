/**
 * Utilitaire pour fusionner des classes Tailwind (remplace clsx + twMerge)
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
