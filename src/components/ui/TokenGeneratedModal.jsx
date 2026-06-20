import { useState } from 'react'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, X, Copy, Check, Download, Globe,
  Smartphone, Server, ArrowRight, ExternalLink, AlertTriangle, Eye, EyeOff,
} from 'lucide-react'
import { cn } from '../../utils/cn'

export default function TokenGeneratedModal({ open, onClose, tokenData, hotspotName, onDownloadScript }) {
  const theme = useSelector((state) => state.ui.theme)
  const isLight = theme === 'light'
  const [copiedToken, setCopiedToken] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedPollUrl, setCopiedPollUrl] = useState(false)
  const [showUrls, setShowUrls] = useState(false)

  if (!tokenData) return null

  const routerToken = tokenData.router_token || tokenData.token || ''
  const portalLink = tokenData.portal_url || tokenData.portalUrl || ''
  const pollingUrl = tokenData.polling_url || ''
  const scriptDownloadUrl = tokenData.script_download_url || ''

  const copyToClipboard = async (text, setter) => {
    try {
      await navigator.clipboard.writeText(text)
      setter(true)
      setTimeout(() => setter(false), 2000)
    } catch { /* ignore */ }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.25 }}
            className={cn(
              'relative w-full max-w-lg rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden',
              isLight ? 'bg-white border border-slate-200' : 'bg-slate-900 border border-slate-800',
            )}
          >
            {/* Close */}
            <button
              onClick={onClose}
              className={cn('absolute top-4 right-4 z-10 p-2 rounded-xl transition-all',
                isLight ? 'hover:bg-slate-100 text-slate-400 hover:text-slate-600' : 'hover:bg-slate-800 text-slate-500 hover:text-slate-300'
              )}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className={cn('relative px-7 pt-7 pb-5 border-b', isLight ? 'border-slate-100' : 'border-slate-800')}>
              <div className="flex items-center gap-4">
                <div className={cn(
                  'w-14 h-14 rounded-2xl flex items-center justify-center shrink-0',
                  isLight ? 'bg-gradient-to-br from-emerald-50 to-teal-50' : 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10',
                )}>
                  <Shield className={cn('w-7 h-7', isLight ? 'text-emerald-600' : 'text-emerald-400')} />
                </div>
                <div className="min-w-0">
                  <h2 className={cn('text-lg font-bold tracking-tight', isLight ? 'text-slate-900' : 'text-white')}>
                    Token généré avec succès
                  </h2>
                  <p className={cn('text-sm mt-0.5', isLight ? 'text-slate-500' : 'text-slate-400')}>
                    {hotspotName || 'Hotspot'} — Configuration requise
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-7 py-5 space-y-5 overflow-y-auto max-h-[55vh]">
              {/* Explication */}
              <div className={cn('rounded-2xl p-4', isLight ? 'bg-blue-50 border border-blue-100' : 'bg-blue-500/5 border border-blue-500/10')}>
                <p className={cn('text-xs leading-relaxed', isLight ? 'text-blue-700' : 'text-blue-300')}>
                  Ce token sécurise la communication entre votre routeur MikroTik et la plateforme HotspotPay.
                  Copiez-le dans la configuration de votre routeur ou téléchargez le script d&apos;installation automatique.
                </p>
              </div>

              {/* Token */}
              <div>
                <label className={cn('text-[11px] font-semibold uppercase tracking-widest mb-2 block', isLight ? 'text-slate-500' : 'text-slate-500')}>
                  Token du routeur
                </label>
                <div className="flex items-center gap-2">
                  <code className={cn(
                    'flex-1 px-4 py-3 rounded-xl text-xs font-mono break-all select-all',
                    isLight ? 'bg-slate-100 text-slate-800 border border-slate-200' : 'bg-slate-800 text-slate-200 border border-slate-700',
                  )}>
                    {routerToken}
                  </code>
                  <button
                    onClick={() => copyToClipboard(routerToken, setCopiedToken)}
                    className={cn(
                      'flex items-center gap-1.5 h-11 px-4 rounded-xl text-xs font-semibold transition-all shrink-0',
                      copiedToken
                        ? 'bg-emerald-600 text-white'
                        : isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700',
                    )}
                  >
                    {copiedToken ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedToken ? 'Copié' : 'Copier'}
                  </button>
                </div>
              </div>

              {/* Portal link */}
              {portalLink && (
                <div>
                  <label className={cn('text-[11px] font-semibold uppercase tracking-widest mb-2 block', isLight ? 'text-slate-500' : 'text-slate-500')}>
                    Lien du portail captif
                  </label>
                  <div className="flex items-center gap-2">
                    <code className={cn(
                      'flex-1 px-4 py-3 rounded-xl text-xs font-mono break-all select-all',
                      isLight ? 'bg-slate-100 text-slate-800 border border-slate-200' : 'bg-slate-800 text-slate-200 border border-slate-700',
                    )}>
                      {portalLink}
                    </code>
                    <button
                      onClick={() => copyToClipboard(portalLink, setCopiedLink)}
                      className={cn(
                        'flex items-center gap-1.5 h-11 px-4 rounded-xl text-xs font-semibold transition-all shrink-0',
                        copiedLink
                          ? 'bg-emerald-600 text-white'
                          : isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700',
                      )}
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedLink ? 'Copié' : 'Copier'}
                    </button>
                    <a
                      href={portalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'flex items-center justify-center h-11 w-11 rounded-xl transition-all shrink-0',
                        isLight ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20',
                      )}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}

              {/* URLs (repliable avec œil) */}
              {(pollingUrl || scriptDownloadUrl) && (
                <div>
                  <button
                    onClick={() => setShowUrls(!showUrls)}
                    className={cn(
                      'flex items-center gap-2 text-[11px] font-semibold transition-all px-0 py-1',
                      isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-white',
                    )}
                  >
                    {showUrls ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {showUrls ? 'Masquer les URLs' : 'Voir les URLs du hotspot'}
                  </button>

                  {showUrls && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 space-y-3"
                    >
                      {pollingUrl && (
                        <div>
                          <label className={cn('text-[10px] font-semibold uppercase tracking-widest mb-1.5 block', isLight ? 'text-slate-500' : 'text-slate-500')}>
                            URL de polling (Long Polling)
                          </label>
                          <div className="flex items-center gap-2">
                            <code className={cn('flex-1 px-3 py-2.5 rounded-xl text-[10px] font-mono break-all select-all', isLight ? 'bg-slate-100 text-slate-700 border border-slate-200' : 'bg-slate-800 text-slate-300 border border-slate-700')}>
                              {pollingUrl}
                            </code>
                            <button
                              onClick={() => copyToClipboard(pollingUrl, setCopiedPollUrl)}
                              className={cn('flex items-center justify-center h-9 w-9 rounded-xl transition-all shrink-0', copiedPollUrl ? 'bg-emerald-600 text-white' : isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700')}
                            >
                              {copiedPollUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              )}

              {/* Avertissement token unique */}
              <div className={cn('rounded-2xl p-4 border', isLight ? 'bg-amber-50 border-amber-200' : 'bg-amber-500/10 border-amber-500/20')}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className={cn('w-5 h-5 shrink-0 mt-0.5', isLight ? 'text-amber-600' : 'text-amber-400')} />
                  <div>
                    <p className={cn('text-xs font-bold', isLight ? 'text-amber-800' : 'text-amber-300')}>
                      Token visible une seule fois
                    </p>
                    <p className={cn('text-[11px] mt-1', isLight ? 'text-amber-700' : 'text-amber-400')}>
                      Ce token ne sera plus affiché après la fermeture de cette fenêtre.
                      Si vous ne téléchargez pas le script maintenant, vous devrez
                      révoquer ce token et en générer un nouveau pour obtenir le script.
                    </p>
                  </div>
                </div>
              </div>

              {/* Téléchargement script */}
              <div>
                <label className={cn('text-[11px] font-semibold uppercase tracking-widest mb-2 block', isLight ? 'text-slate-500' : 'text-slate-500')}>
                  Installation automatique
                </label>
                <button
                  onClick={onDownloadScript}
                  className={cn(
                    'w-full flex items-center justify-center gap-3 h-12 rounded-xl text-sm font-semibold transition-all',
                    'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20',
                    'hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98]',
                  )}
                >
                  <Download className="w-4 h-4" />
                  Télécharger le script MikroTik
                </button>
                <p className={cn('text-[10px] mt-2', isLight ? 'text-slate-400' : 'text-slate-500')}>
                  Script automatique pour configurer votre routeur MikroTik (RouterOS). Importez-le via WinBox ou la console.
                </p>
              </div>

              {/* Instructions */}
              <div className={cn('rounded-2xl p-4 space-y-2', isLight ? 'bg-slate-50 border border-slate-200' : 'bg-slate-800/30 border border-slate-700/30')}>
                <h4 className={cn('text-xs font-bold flex items-center gap-2', isLight ? 'text-slate-700' : 'text-slate-300')}>
                  <Server className="w-3.5 h-3.5" />
                  Étapes suivantes
                </h4>
                <ol className={cn('text-[11px] space-y-1.5 ml-1', isLight ? 'text-slate-500' : 'text-slate-400')}>
                  {[
                    ['Téléchargez le script ci-dessus', 'Script adapté à votre hotspot'],
                    ['Importez-le dans votre routeur MikroTik', 'Via WinBox ou terminal SSH'],
                    ['Le routeur se connectera automatiquement', 'Communication sécurisée établie'],
                    ['Vérifiez le statut en ligne depuis ce tableau de bord', 'Le statut passera à "En ligne"'],
                  ].map(([step, sub], i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className={cn('flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold mt-0.5 shrink-0', isLight ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/20 text-blue-400')}>
                        {i + 1}
                      </span>
                      <div>
                        <span className="font-medium">{step}</span>
                        <span className="block opacity-60">{sub}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Footer */}
            <div className={cn('px-7 py-4 border-t flex items-center justify-end gap-3', isLight ? 'border-slate-100 bg-slate-50/50' : 'border-slate-800 bg-slate-900/50')}>
              <button
                onClick={onClose}
                className={cn('h-11 px-6 rounded-xl text-sm font-semibold transition-all',
                  isLight ? 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700/50'
                )}
              >
                Fermer
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
