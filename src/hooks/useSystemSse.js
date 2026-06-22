import { useEffect, useRef, useCallback, useState } from 'react'

/**
 * Hook SSE système — écoute les événements en temps réel (settings_updated, faq_updated, etc.)
 * Endpoint public, pas besoin de token. Se reconnecte automatiquement.
 *
 * @param {Object} handlers  Map eventType → callback({ type, data }) exécuté à chaque événement
 * @param {Object} options
 * @param {boolean} options.enabled  Désactiver le hook
 *
 * @returns {{ connected: boolean, lastEvent: string|null }}
 *
 * @example
 *   useSystemSse({
 *     settings_updated: () => refetchSettings(),
 *     faq_updated: () => loadFaqs(),
 *   })
 */
export default function useSystemSse(handlers = {}, { enabled = true } = {}) {
  const eventSourceRef = useRef(null)
  const handlersRef = useRef(handlers)
  const [connected, setConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState(null)

  // Garder les handlers à jour sans recréer l'EventSource
  handlersRef.current = handlers

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
    const url = `${baseUrl}/sse/system`

    const es = new EventSource(url)

    es.onopen = () => {
      setConnected(true)
    }

    // Événements nommés (settings_updated, faq_updated, etc.)
    es.addEventListener('settings_updated', (e) => {
      setLastEvent('settings_updated')
      handlersRef.current.settings_updated?.(e.data ? JSON.parse(e.data) : null)
    })

    es.addEventListener('faq_updated', (e) => {
      setLastEvent('faq_updated')
      handlersRef.current.faq_updated?.(e.data ? JSON.parse(e.data) : null)
    })

    // Événement générique (fallback pour tout type)
    es.onmessage = (e) => {
      if (e.type && handlersRef.current[e.type]) {
        setLastEvent(e.type)
        handlersRef.current[e.type](e.data ? JSON.parse(e.data) : null)
      }
    }

    es.onerror = () => {
      setConnected(false)
      // EventSource reconnexion automatique gérée par le navigateur
    }

    eventSourceRef.current = es
  }, [])

  useEffect(() => {
    if (!enabled) return

    connect()

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      setConnected(false)
    }
  }, [enabled, connect])

  return { connected, lastEvent }
}
