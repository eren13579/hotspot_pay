import { useState, useEffect, useCallback, useRef } from 'react'
import { useSelector } from 'react-redux'
import { monitoringApi } from '../api/endpoints'

const POLL_INTERVAL = 30000 // 30 secondes

/**
 * Hook de notifications admin — polling des retraits en attente
 *
 * Retourne :
 * - pendingWithdrawals : number (retraits en attente)
 * - withdrawalsToday : number (retraits créés aujourd'hui)
 * - notificationsTotal : number (total pour badge)
 * - error : string | null
 * - refresh : () => void (rafraîchir manuellement)
 */
export default function useAdminNotifications() {
  const { role } = useSelector(state => state.auth)
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN'
  const [data, setData] = useState({ pendingWithdrawals: 0, withdrawalsToday: 0, notificationsTotal: 0 })
  const [error, setError] = useState(null)
  const intervalRef = useRef(null)

  const fetchCounts = useCallback(async () => {
    if (!isAdmin) return
    try {
      const res = await monitoringApi.notificationCounts()
      const d = res?.data?.data
      if (d) {
        setData({
          pendingWithdrawals: d.pendingWithdrawals ?? 0,
          withdrawalsToday: d.withdrawalsToday ?? 0,
          notificationsTotal: d.notificationsTotal ?? 0,
        })
        setError(null)
      }
    } catch {
      setError('Erreur de chargement')
    }
  }, [isAdmin])

  useEffect(() => {
    if (!isAdmin) return
    fetchCounts()
    intervalRef.current = setInterval(fetchCounts, POLL_INTERVAL)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isAdmin, fetchCounts])

  return {
    ...data,
    error,
    refresh: fetchCounts,
  }
}
