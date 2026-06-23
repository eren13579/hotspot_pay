import { cn } from '../../utils/cn'
import './WifiSignalAnimation.css'

/**
 * WifiSignalAnimation — Animation signature du portail captif.
 *
 * Props :
 *   status   'processing' | 'connected' | 'failed' | 'idle'
 *   size     number (px, défaut 120)
 */
export default function WifiSignalAnimation({ status = 'idle', size = 120 }) {
  const variant =
    status === 'connected' ? 'connected' :
    status === 'failed'    ? 'failed'    :
    'processing'

  return (
    <div
      className={cn('wifi-signal', `wifi-signal--${variant}`)}
      style={{ width: size, height: size }}
      role="status"
      aria-label={
        status === 'connected' ? 'Connecté au WiFi' :
        status === 'failed'    ? 'Échec de connexion' :
        'Connexion en cours'
      }
    >
      <div className="wifi-arc wifi-arc--outer" />
      <div className="wifi-arc wifi-arc--mid" />
      <div className="wifi-arc wifi-arc--inner" />
      <div className="wifi-dot" />
    </div>
  )
}
