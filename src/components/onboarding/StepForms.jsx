import { User, Phone, Flag, Wifi, MapPin, Globe, Server, Shield, Eye, EyeOff, Check, ChevronRight, Mail } from 'lucide-react'
import { AFRICAN_COUNTRIES } from './constants'
import { cn } from '../../utils/cn'

// ─── Champs partagés ──────────────────────────────────────────────
export const inputCls = (isLight) => cn(
  'w-full h-10 pl-10 pr-3 rounded-xl text-sm outline-none transition-all',
  isLight
    ? 'bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20'
    : 'bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-600 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20',
)

export const inputIconCls = (isLight) => cn(
  'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4',
  isLight ? 'text-slate-400' : 'text-slate-500',
)

export const labelCls = (isLight) => cn(
  'block text-xs font-medium mb-1.5',
  isLight ? 'text-slate-600' : 'text-slate-300',
)

export const hintCls = (isLight) => cn(
  'text-[10px] mt-1',
  isLight ? 'text-slate-400' : 'text-slate-500',
)

// ─── Étape 0 : Profil utilisateur ─────────────────────────────────
export function ProfileStep({ form, update, isLight }) {
  return (
    <div className="w-full text-left space-y-4">
      <div>
        <label className={labelCls(isLight)}>Adresse email</label>
        <div className={cn('flex items-center gap-2.5 h-10 px-3.5 rounded-xl', isLight ? 'bg-slate-50 border border-slate-200' : 'bg-slate-800/30 border border-slate-700/30')}>
          <Mail className={cn('w-4 h-4 shrink-0', isLight ? 'text-slate-400' : 'text-slate-500')} />
          <span className={cn('text-sm', isLight ? 'text-slate-600' : 'text-slate-400')}>{form.email}</span>
        </div>
      </div>
      <div>
        <label className={labelCls(isLight)}>Nom complet <span className="text-slate-400">(optionnel)</span></label>
        <div className="relative">
          <User className={inputIconCls(isLight)} />
          <input value={form.fullName} onChange={e => update('fullName', e.target.value)} placeholder="Ex: Jean Dupont" className={inputCls(isLight)} />
        </div>
        <p className={hintCls(isLight)}>Votre nom pour personnaliser votre expérience.</p>
      </div>
      <div>
        <label className={labelCls(isLight)}>Téléphone <span className="text-slate-400">(optionnel)</span></label>
        <div className="relative">
          <Phone className={inputIconCls(isLight)} />
          <input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="Ex: +237 6XX XXX XXX" className={inputCls(isLight)} />
        </div>
        <p className={hintCls(isLight)}>Numéro au format international. Utilisé pour les retraits.</p>
      </div>
      <div>
        <label className={labelCls(isLight)}>Pays <span className="text-slate-400">(optionnel)</span></label>
        <div className="relative">
          <Flag className={cn(inputIconCls(isLight), 'z-10')} />
          <select value={form.country} onChange={e => update('country', e.target.value)}
            className={cn(inputCls(isLight), 'appearance-none cursor-pointer', !form.country && (isLight ? 'text-slate-400' : 'text-slate-600'))}>
            <option value="">Sélectionnez votre pays</option>
            {AFRICAN_COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
          <ChevronRight className={cn('absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rotate-90', isLight ? 'text-slate-400' : 'text-slate-500')} />
        </div>
      </div>
      <div className="pt-2">
        <div className="p-3 rounded-xl bg-linear-to-r from-blue-500/10 to-blue-600/5 border border-blue-500/10">
          <p className="text-xs text-blue-400/80 text-center">Parfait ! Passons maintenant à la création de votre premier hotspot WiFi.</p>
        </div>
      </div>
    </div>
  )
}

// ─── Étape 1 : Nom et localisation ────────────────────────────────
export function NameLocationStep({ form, update, isLight }) {
  return (
    <div className="w-full space-y-4 text-left">
      <div>
        <label className={labelCls(isLight)}>Nom du hotspot <span className="text-red-400">*</span></label>
        <div className="relative">
          <Wifi className={inputIconCls(isLight)} />
          <input value={form.hotspotName} onChange={e => update('hotspotName', e.target.value)} placeholder="Ex: Café Central WiFi" className={inputCls(isLight)} />
        </div>
        <p className={hintCls(isLight)}>Choisissez un nom facile à reconnaître (nom du commerce, lieu, etc.).</p>
      </div>
      <div>
        <label className={labelCls(isLight)}>Localisation <span className="text-slate-400">(optionnel)</span></label>
        <div className="relative">
          <MapPin className={inputIconCls(isLight)} />
          <input value={form.location} onChange={e => update('location', e.target.value)} placeholder="Ex: Douala, Cameroun" className={inputCls(isLight)} />
        </div>
        <p className={hintCls(isLight)}>Indiquez où se trouve le routeur pour mieux gérer vos hotspots.</p>
      </div>
    </div>
  )
}

// ─── Étape 2 : IP et Port ─────────────────────────────────────────
export function IpPortStep({ form, update, ipError, isLight }) {
  return (
    <div className="w-full space-y-4 text-left">
      <div>
        <label className={labelCls(isLight)}>Adresse IP du routeur <span className="text-red-400">*</span></label>
        <div className="relative">
          <Globe className={inputIconCls(isLight)} />
          <input value={form.mikrotikIp} onChange={e => update('mikrotikIp', e.target.value)} placeholder="Ex: 192.168.88.1"
            className={cn(inputCls(isLight), ipError && (isLight ? 'border-red-400' : 'border-red-500/50'))} />
          {form.mikrotikIp && !ipError && <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />}
        </div>
        {ipError ? <p className="text-[10px] text-red-400 mt-1">{ipError}</p>
          : <p className={hintCls(isLight)}>Trouvez-la dans <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>WinBox → IP → Addresses</span> ou tapez <span className="font-mono text-slate-500">/ip address print</span></p>}
      </div>
      <div>
        <label className={labelCls(isLight)}>Port API <span className="text-red-400">*</span></label>
        <div className="relative">
          <Server className={inputIconCls(isLight)} />
          <input value={form.mikrotikPort} onChange={e => update('mikrotikPort', e.target.value)} placeholder="8728" className={inputCls(isLight)} />
        </div>
        <p className={hintCls(isLight)}>Port par défaut : <span className="font-mono text-slate-500">8728</span> (API) ou <span className="font-mono text-slate-500">8729</span> (API-SSL).</p>
      </div>
    </div>
  )
}

// ─── Étape 3 : Identifiants ───────────────────────────────────────
export function CredentialsStep({ form, update, showPwd, togglePwd, isLight }) {
  const strength = form.mikrotikPassword.length
  const strong = strength >= 12
  const medium = strength >= 8 && strength < 12

  return (
    <div className="w-full space-y-4 text-left">
      <div>
        <label className={labelCls(isLight)}>Nom d'utilisateur <span className="text-red-400">*</span></label>
        <div className="relative">
          <Shield className={inputIconCls(isLight)} />
          <input value={form.mikrotikUser} onChange={e => update('mikrotikUser', e.target.value)} placeholder="Ex: hotspotpay" className={inputCls(isLight)} />
        </div>
        <p className={hintCls(isLight)}>Créez un utilisateur dédié sur votre MikroTik ( <span className="font-mono text-slate-500">/user add name=hotspotpay group=full</span> )</p>
      </div>

      <div>
        <label className={labelCls(isLight)}>Mot de passe <span className="text-red-400">*</span><span className="font-normal text-slate-400 ml-1">(min. 4 caractères)</span></label>
        <div className="relative">
          <Shield className={cn(inputIconCls(isLight), 'z-10')} />
          <input type={showPwd ? 'text' : 'password'} value={form.mikrotikPassword} onChange={e => update('mikrotikPassword', e.target.value)}
            placeholder="Mot de passe sécurisé" className={cn(inputCls(isLight), 'pr-10')} />
          <button type="button" onClick={togglePwd}
            className={cn('absolute right-3 top-1/2 -translate-y-1/2 transition-colors', isLight ? 'text-slate-400 hover:text-slate-600' : 'text-slate-500 hover:text-slate-300')}>
            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {form.mikrotikPassword && (
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex gap-1 flex-1">
              {[0, 1, 2].map(i => (
                <div key={i} className={cn('h-1 rounded-full flex-1 transition-all',
                  i === 0 ? (strong || medium ? 'bg-emerald-500' : strength >= 4 ? 'bg-yellow-500' : 'bg-red-500')
                    : i === 1 ? (strong || medium ? 'bg-emerald-500' : isLight ? 'bg-slate-200' : 'bg-slate-700')
                    : strong ? 'bg-emerald-500' : isLight ? 'bg-slate-200' : 'bg-slate-700')} />
              ))}
            </div>
            <span className={cn('text-[10px] font-medium',
              strong ? 'text-emerald-400' : medium ? 'text-yellow-400' : strength >= 4 ? 'text-red-400' : 'text-slate-500')}>
              {strong ? 'Fort' : medium ? 'Moyen' : strength >= 4 ? 'Faible' : ''}
            </span>
          </div>
        )}

        <div className={cn('mt-1.5 p-2.5 rounded-lg border', isLight ? 'bg-amber-500/5 border-amber-500/10' : 'bg-amber-500/5 border-amber-500/10')}>
          <p className={cn('text-[10px] flex items-start gap-1.5', isLight ? 'text-amber-600/80' : 'text-amber-400/80')}>
            <Shield className="w-3 h-3 mt-0.5 shrink-0" />
            <span>Utilisez un mot de passe fort et différent de votre mot de passe administrateur. Créez toujours un utilisateur dédié pour HotspotPay sur votre routeur.</span>
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Étape 4 : Récapitulatif ──────────────────────────────────────
export function ReviewStep({ form, isLight }) {
  const countryName = AFRICAN_COUNTRIES.find(c => c.code === form.country)?.name || form.country || '—'
  const items = [
    { label: 'Nom complet', value: form.fullName || '—', icon: User },
    { label: 'Email', value: form.email, icon: Mail },
    { label: 'Téléphone', value: form.phone || '—', icon: Phone },
    { label: 'Pays', value: countryName, icon: Flag },
    { label: 'Hotspot', value: form.hotspotName || '—', icon: Wifi },
    { label: 'Localisation', value: form.location || '—', icon: MapPin },
    { label: 'IP du routeur', value: form.mikrotikIp, icon: Globe },
    { label: 'Port', value: form.mikrotikPort, icon: Server },
    { label: 'Utilisateur', value: form.mikrotikUser, icon: Shield },
    { label: 'Mot de passe', value: '•'.repeat(Math.min(form.mikrotikPassword.length, 12)), icon: Shield },
  ]
  return (
    <div className="w-full max-w-sm mx-auto">
      <div className={cn('rounded-xl border divide-y', isLight ? 'bg-slate-50/80 border-slate-200 divide-slate-200' : 'bg-slate-800/30 border-slate-700/50 divide-slate-700/30')}>
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-2.5">
            <item.icon className={cn('w-3.5 h-3.5 shrink-0', isLight ? 'text-slate-400' : 'text-slate-500')} />
            <span className={cn('text-[11px] w-24 shrink-0', isLight ? 'text-slate-500' : 'text-slate-400')}>{item.label}</span>
            <span className={cn('text-[11px] font-medium truncate', isLight ? 'text-slate-900' : 'text-white')}>{item.value}</span>
          </div>
        ))}
      </div>
      <p className={cn('text-[10px] text-center mt-3', isLight ? 'text-slate-400' : 'text-slate-500')}>
        Vérifiez que toutes les informations sont correctes avant de créer votre premier hotspot.
      </p>
    </div>
  )
}