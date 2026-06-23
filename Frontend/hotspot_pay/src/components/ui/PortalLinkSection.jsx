import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Globe, Copy, Check, ExternalLink, Trash2 } from 'lucide-react'
import { cn } from '../../utils/cn'

const STORAGE_KEY = 'hotspot_portal_links'

function getStoredLinks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch { return {} }
}

function setStoredLink(hotspotId, url) {
  const links = getStoredLinks()
  links[hotspotId] = url
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links))
}

function removeStoredLink(hotspotId) {
  const links = getStoredLinks()
  delete links[hotspotId]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links))
}

export function usePortalLink(hotspotId) {
  const [link, setLink] = useState('')

  useEffect(() => {
    const stored = getStoredLinks()
    if (stored[hotspotId]) setLink(stored[hotspotId])
  }, [hotspotId])

  const saveLink = (url) => {
    setLink(url)
    setStoredLink(hotspotId, url)
  }

  const clearLink = () => {
    setLink('')
    removeStoredLink(hotspotId)
  }

  return { link, saveLink, clearLink }
}

export default function PortalLinkSection({ hotspotId, hotspotName, isLight }) {
  const { link, clearLink } = usePortalLink(hotspotId)
  const [copied, setCopied] = useState(false)
  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  if (!link) return null

  return (
    <div className={cn('rounded-2xl p-6', isLight ? 'bg-white border border-slate-200' : 'bg-slate-900/50 border border-slate-800')}>
      <div className="flex items-center gap-2.5 mb-4">
        <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', isLight ? 'bg-sky-50' : 'bg-sky-500/10')}>
          <Globe className={cn('w-4 h-4', isLight ? 'text-sky-600' : 'text-sky-400')} />
        </div>
        <div>
          <h3 className={cn('text-sm font-bold', textPrimary)}>Portail captif</h3>
          <p className={cn('text-[10px]', textMuted)}>Lien d&apos;accès au portail WiFi</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <code className={cn(
          'flex-1 px-4 py-3 rounded-xl text-xs font-mono break-all select-all',
          isLight ? 'bg-slate-100 text-slate-800 border border-slate-200' : 'bg-slate-800 text-slate-200 border border-slate-700',
        )}>
          {link}
        </code>
        <button
          onClick={copyLink}
          className={cn(
            'flex items-center justify-center h-11 w-11 rounded-xl transition-all shrink-0',
            copied
              ? 'bg-emerald-600 text-white'
              : isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700',
          )}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </button>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'flex items-center justify-center h-11 w-11 rounded-xl transition-all shrink-0',
            isLight ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20',
          )}
        >
          <ExternalLink className="w-4 h-4" />
        </a>
        <button
          onClick={clearLink}
          className={cn(
            'flex items-center justify-center h-11 w-11 rounded-xl transition-all shrink-0',
            isLight ? 'text-slate-400 hover:bg-red-50 hover:text-red-500' : 'text-slate-500 hover:bg-red-500/10 hover:text-red-400',
          )}
          title="Supprimer le lien"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
