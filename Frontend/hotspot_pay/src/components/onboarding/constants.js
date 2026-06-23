import { User, MapPin, Server, Shield, Check } from 'lucide-react'

// ─── Liste des pays africains ─────────────────────────────────────
export const AFRICAN_COUNTRIES = [
  { code: 'CM', name: 'Cameroun' },
  { code: 'CI', name: "Côte d'Ivoire" },
  { code: 'SN', name: 'Sénégal' },
  { code: 'ML', name: 'Mali' },
  { code: 'BF', name: 'Burkina Faso' },
  { code: 'NE', name: 'Niger' },
  { code: 'TG', name: 'Togo' },
  { code: 'BJ', name: 'Bénin' },
  { code: 'GN', name: 'Guinée' },
  { code: 'CD', name: 'RDC' },
  { code: 'GA', name: 'Gabon' },
  { code: 'CG', name: 'Congo' },
  { code: 'TD', name: 'Tchad' },
  { code: 'CF', name: 'RCA' },
  { code: 'GQ', name: 'Guinée Équatoriale' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'GH', name: 'Ghana' },
  { code: 'KE', name: 'Kenya' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'UG', name: 'Ouganda' },
  { code: 'TZ', name: 'Tanzanie' },
  { code: 'ZA', name: 'Afrique du Sud' },
  { code: 'MA', name: 'Maroc' },
  { code: 'TN', name: 'Tunisie' },
  { code: 'DZ', name: 'Algérie' },
  { code: 'EG', name: 'Égypte' },
]

// ─── Étapes ────────────────────────────────────────────────────────
export const STEP_ICONS = [User, MapPin, Server, Shield, Check]

export const STEPS = [
  {
    id: 0, label: 'Profil',
    title: 'Bienvenue sur HotspotPay !',
    desc: 'Faisons connaissance. Complétez votre profil avant de créer votre premier hotspot WiFi.',
  },
  {
    id: 1, label: 'Identification',
    title: 'Nommez votre hotspot',
    desc: 'Donnez un nom reconnaissable à votre hotspot WiFi. Ce nom apparaîtra dans votre tableau de bord.',
  },
  {
    id: 2, label: 'Connexion',
    title: 'Adresse IP et port du routeur',
    desc: "Saisissez l'adresse IP de votre routeur MikroTik. Vous la trouverez dans WinBox → IP → Addresses.",
  },
  {
    id: 3, label: 'Sécurité',
    title: 'Identifiants du routeur',
    desc: 'Créez un utilisateur dédié sur votre MikroTik avec les droits suffisants pour la configuration automatique.',
  },
  {
    id: 4, label: 'Finalisation',
    title: 'Vérifiez avant de créer',
    desc: 'Tout est bon ? Confirmez la création de votre premier hotspot WiFi.',
  },
]
