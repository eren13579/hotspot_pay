import { useState, useEffect, useCallback } from 'react'
import { usePublicSettings, PublicSettingsProvider } from '../../context/PublicSettingsContext'
import ScrollToTop from '../../components/ui/ScrollToTop'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Quote, Wifi, MapPin, Users, ArrowRight, Home } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'

/* ── Données statiques ── */

const METRICS = [
  {
    value: '10 000+',
    label: 'Opérateurs actifs',
    icon: Users,
    desc: 'Hotspots WiFi monétisés à travers l\'Afrique',
  },
  {
    value: '50+',
    label: 'Villes couvertes',
    icon: MapPin,
    desc: 'Du Cameroun à la Côte d\'Ivoire, du Sénégal au Gabon',
  },
  {
    value: '99,9%',
    label: 'Disponibilité',
    icon: Wifi,
    desc: 'Plateforme stable et fiable, 7j/7',
  },
]

const VALUES = [
  {
    title: 'Made in Africa',
    desc: 'Une solution conçue par et pour les opérateurs africains, avec les moyens de paiement et les réalités du terrain.',
  },
  {
    title: 'Support local',
    desc: 'Une équipe basée au Cameroun, joignable par téléphone, WhatsApp et email. Pas de chatbot, des humains.',
  },
  {
    title: 'Évolution constante',
    desc: 'Mises à jour régulières, nouvelles intégrations opérateurs, dashboard enrichi chaque mois.',
  },
]

/* ── Photo Carousel ── */

function PhotoCarousel({ photos }) {
  const [current, setCurrent] = useState(0)
  const len = photos.length

  const prev = useCallback(() => setCurrent((c) => (c === 0 ? len - 1 : c - 1)), [len])
  const next = useCallback(() => setCurrent((c) => (c === len - 1 ? 0 : c + 1)), [len])

  useEffect(() => {
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [next])

  if (len === 0) return null

  return (
    <div className="relative w-full">
      {/* Carousel viewport */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/30 aspect-video">
        <AnimatePresence mode="wait">
          <motion.img
            key={current}
            src={photos[current]}
            alt={`Photo ${current + 1}`}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full object-cover absolute inset-0"
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />
        </AnimatePresence>

        {/* Flèches */}
        {len > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/50 rounded-full p-2 transition-all hover:scale-105 cursor-pointer"
              aria-label="Photo précédente"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/50 rounded-full p-2 transition-all hover:scale-105 cursor-pointer"
              aria-label="Photo suivante"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </>
        )}
      </div>

      {/* Dots */}
      {len > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                i === current
                  ? 'bg-orange-400 w-6'
                  : 'bg-slate-700 hover:bg-slate-600'
              }`}
              aria-label={`Photo ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Section Hero ── */

function HeroSection({ settings }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="text-center mb-16"
    >
      <span className="text-blue-400 font-semibold text-xs tracking-widest uppercase bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20 inline-flex items-center gap-2 mb-6">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
        À propos
      </span>

      <h1 className="text-4xl md:text-6xl lg:text-7xl font-montserrat font-black text-white tracking-tight mb-6 leading-tight">
        {settings.aboutTitle || 'HotspotPay'}{' '}
        {settings.aboutSubtitle && (
          <span className="bg-linear-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
            {settings.aboutSubtitle}
          </span>
        )}
      </h1>

      {settings.aboutDescription ? (
        <p className="text-slate-400 text-sm md:text-base max-w-4xl mx-auto leading-relaxed font-montserrat">
          {settings.aboutDescription}
        </p>
      ) : (
        <div className="max-w-lg mx-auto space-y-4">
          <p className="text-slate-500 text-sm md:text-base font-montserrat">
            Page en cours de rédaction...
          </p>
          <div className="w-16 h-0.5 bg-slate-800 mx-auto rounded-full" />
          <p className="text-slate-600 text-xs font-montserrat">
            Revenez bientôt pour découvrir notre histoire.
          </p>
        </div>
      )}
    </motion.div>
  )
}

/* ── Section Métriques ── */

function MetricsSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-20">
      {METRICS.map((m, index) => {
        const Icon = m.icon
        return (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: index * 0.1, duration: 0.5, ease: 'easeOut' }}
            className="p-6 md:p-8 rounded-2xl border border-slate-800 bg-slate-900/30 text-center group hover:border-orange-500/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-500/15 transition-colors">
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-3xl md:text-5xl font-black tracking-tight bg-linear-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent mb-1 font-montserrat">
              {m.value}
            </div>
            <div className="text-xs font-semibold text-white uppercase tracking-wider mb-2 font-montserrat">
              {m.label}
            </div>
            <div className="text-[11px] text-slate-500 leading-relaxed font-montserrat">
              {m.desc}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

/* ── Section Valeurs (2 colonnes alternées) ── */

function ValuesSection() {
  return (
    <div className="mb-20 space-y-4">
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-montserrat font-bold text-white mb-3">
          Nos valeurs
        </h2>
        <p className="text-slate-500 text-xs md:text-sm font-montserrat max-w-md mx-auto">
          Ce qui nous différencie, c&apos;est notre ancrage dans la réalité du terrain.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {VALUES.map((v, index) => (
          <motion.div
            key={v.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ delay: index * 0.08, duration: 0.4 }}
            className="p-6 rounded-xl border border-slate-800/60 bg-slate-900/20 hover:bg-slate-900/40 transition-colors"
          >
            <div className="w-8 h-0.5 bg-orange-500/60 rounded-full mb-4" />
            <h3 className="text-sm font-bold text-white mb-2 font-montserrat">{v.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed font-montserrat">{v.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

/* ── Section Citation / Témoignage ── */

function TestimonialSection({ settings }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5 }}
      className="mb-20 p-8 md:p-10 rounded-2xl border border-slate-800 bg-slate-900/30 text-center"
    >
      <div className="w-10 h-10 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center mx-auto mb-5">
        <Quote className="w-5 h-5" />
      </div>
      <blockquote className="text-base md:text-lg text-slate-300 leading-relaxed italic max-w-4xl mx-auto font-montserrat">
        &ldquo;{settings.appName} rend la monétisation WiFi accessible à tous, partout en Afrique.&rdquo;
      </blockquote>
      <div className="mt-5 w-12 h-0.5 bg-slate-700 mx-auto rounded-full" />
    </motion.div>
  )
}

/* ── Section CTA ── */

function CTASection() {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.4 }}
      className="text-center pb-8"
    >
      <h2 className="text-xl md:text-2xl font-montserrat font-bold text-white mb-3">
        Prêt à rejoindre l&apos;aventure ?
      </h2>
      <p className="text-slate-500 text-xs md:text-sm font-montserrat mb-6">
        Des milliers d&apos;opérateurs nous font déjà confiance. Lancez-vous en quelques minutes.
      </p>
      <button
        onClick={() => navigate('/sign-up')}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-orange-500 hover:bg-orange-400 text-white font-bold text-sm transition-all cursor-pointer active:scale-95"
      >
        Commencer gratuitement
        <ArrowRight className="w-4 h-4" />
      </button>
    </motion.div>
  )
}

/* ── Page principale ── */

function AboutContent() {
  const { settings } = usePublicSettings()
  const photos = settings.aboutPhotos?.filter(Boolean) || []

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white select-none">

      <style>{`
        @keyframes home-btn-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
          50% { box-shadow: 0 0 0 10px rgba(59,130,246,0.15); }
        }
        .animate-home-btn {
          animation: home-btn-pulse 3s ease-in-out infinite;
        }
      `}</style>

      {/* ── Bouton retour accueil ── */}
      <Link
        to="/"
        className="fixed top-4 left-4 md:top-6 md:left-6 z-50 w-11 h-11 md:w-12 md:h-12 rounded-full bg-slate-900/80 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-800 hover:border-blue-500/30 flex items-center justify-center transition-all cursor-pointer group animate-home-btn"
        aria-label="Retour à l'accueil"
      >
        <motion.span
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Home className="w-5 h-5" />
        </motion.span>
      </Link>

      <main className="flex-1 bg-slate-950">
        <section className="py-24 md:py-32 relative overflow-hidden">
          {/* Halos d'ambiance */}
          <div className="absolute top-1/4 -left-32 w-125 h-125 bg-orange-600/4 rounded-full blur-[150px] pointer-events-none" />
          <div className="absolute bottom-1/4 -right-32 w-100 h-100 bg-blue-600/4 rounded-full blur-[150px] pointer-events-none" />

          <div className="w-full px-4 md:px-8 lg:px-16 2xl:px-24 relative z-10">
            {/* ── 1. Hero ── */}
            <HeroSection settings={settings} />

            {/* ── 2. Photos (carrousel) ── */}
            {photos.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="mb-20"
              >
                <PhotoCarousel photos={photos} />
              </motion.div>
            )}

            {/* ── 3. Métriques signature ── */}
            <MetricsSection />

            {/* ── 4. Valeurs ── */}
            <ValuesSection />

            {/* ── 5. Citation ── */}
            <TestimonialSection settings={settings} />

            {/* ── 6. CTA ── */}
            <CTASection />
          </div>
        </section>
      </main>

      {/* ── Scroll to top ── */}
      <ScrollToTop />
    </div>
  )
}

/* ── Provider wrapper ── */

function AboutPage() {
  return (
    <PublicSettingsProvider>
      <AboutContent />
    </PublicSettingsProvider>
  )
}

export default AboutPage
