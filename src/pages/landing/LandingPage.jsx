import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { usePublicSettings, PublicSettingsProvider } from '../../context/PublicSettingsContext'
import NavBar from "../../components/layouts/NavBar";
import Footer from "../../components/layouts/Footer";
import ScrollToTop from '../../components/ui/ScrollToTop';
import HeroesPage from '../../components/landing/HeroesPage';
import Partners from "../../components/landing/Partners";
import Features from "../../components/landing/FeaturesList";
import HowItWorks from "../../components/landing/HowItWorks";
import Pricing from "../../components/landing/Pricing";
import FAQ from "../../components/landing/FAQ";
import Contact from "../../components/landing/Contact";
import { googleLogin } from "../../store/authSlice";
import { hotspotsApi } from "../../api/endpoints";

function LandingContent() {
  const { settings } = usePublicSettings()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isAuthenticated } = useSelector((state) => state.auth)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleError, setGoogleError] = useState("")
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const googleSuccessRef = useRef(null)

  // ── Google OAuth2 silencieux (pas de FedCM, pas de 403) ──────────────────
  // Essaye de récupérer un token sans UI si l'utilisateur a déjà autorisé l'app
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || isAuthenticated) return

    const initSilentAuth = () => {
      try {
        if (!window.google?.accounts?.oauth2) return

        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'openid profile email',
          callback: (tokenResponse) => {
            if (tokenResponse.access_token) {
              fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              })
                .then((res) => res.json())
                .then((userInfo) => {
                  if (userInfo.sub && userInfo.email) {
                    googleSuccessRef.current?.(tokenResponse.access_token, {
                      sub: userInfo.sub,
                      email: userInfo.email,
                      name: userInfo.name,
                      picture: userInfo.picture,
                    })
                  }
                })
                .catch(() => {})
            }
          },
        })

        // prompt: 'none' → pas de popup, pas d'UI, juste un échange silencieux
        tokenClient.requestAccessToken({ prompt: 'none' })
      } catch (e) {
        // Google OAuth2 pas encore chargé — silencieux
      }
    }

    if (window.google?.accounts?.oauth2) {
      initSilentAuth()
    } else {
      window.addEventListener('load', initSilentAuth)
      return () => window.removeEventListener('load', initSilentAuth)
    }
  }, [isAuthenticated])

  // ── Login Google (appelé par One Tap avec credential JWT, ou popup avec access_token + userInfo) ──
  const googleLoginFlow = useCallback(async (token, userInfo) => {
    if (googleLoading || isAuthenticated) return
    setGoogleError("")
    setGoogleLoading(true)

    try {
      // Popup → access_token + userInfo ; One Tap → credential JWT sans userInfo
      const payload = userInfo
        ? { idToken: token, email: userInfo.email, name: userInfo.name, googleId: userInfo.sub, picture: userInfo.picture }
        : { idToken: token }

      const result = await dispatch(googleLogin(payload))

      if (googleLogin.fulfilled.match(result)) {
        toast.success(result.payload.message || 'Connexion réussie')
        const userId = result.payload.data?.userId
        try {
          const { data } = await hotspotsApi.list(userId, 0, 1, 'self')
          const items = data?.data?.content || []
          navigate(items.length > 0 ? '/dashboard' : '/onboarding')
        } catch {
          navigate('/dashboard')
        }
      } else {
        const errMsg = result.payload || 'Échec de la connexion Google'
        setGoogleError(typeof errMsg === 'string' ? errMsg : 'Échec de la connexion')
      }
    } catch (err) {
      setGoogleError("Erreur de communication avec Google")
    } finally {
      setGoogleLoading(false)
    }
  }, [dispatch, navigate, googleLoading, isAuthenticated])

  // Synchronise le ref pour le callback One Tap
  useEffect(() => { googleSuccessRef.current = googleLoginFlow }, [googleLoginFlow])

  // ── Google popup OAuth2 (bouton "Commencer gratuitement") ────────────────
  const handleGoogleLogin = useCallback(() => {
    if (googleLoading || isAuthenticated) return

    if (!window.google?.accounts?.oauth2) {
      setGoogleError("Google pas encore chargé — réessayez dans un instant")
      return
    }

    setGoogleError("")

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'openid profile email',
        callback: async (tokenResponse) => {
          if (!tokenResponse.access_token) {
            setGoogleError("Impossible d'obtenir l'accès Google")
            return
          }

          try {
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            })
            const userInfo = await res.json()

            if (!userInfo.sub || !userInfo.email) {
              setGoogleError("Impossible de récupérer vos informations Google")
              return
            }

            await googleLoginFlow(tokenResponse.access_token, {
              sub: userInfo.sub,
              email: userInfo.email,
              name: userInfo.name,
              picture: userInfo.picture,
            })
          } catch (err) {
            setGoogleError("Erreur de communication avec Google")
          }
        },
        error_callback: (error) => {
          if (error.type !== 'popup_closed') {
            console.error('Google OAuth error:', error)
            setGoogleError("Erreur de connexion Google")
          }
        },
      })

      tokenClient.requestAccessToken({ prompt: 'select_account' })
    } catch (err) {
      setGoogleError("Erreur lors de l'initialisation de Google")
    }
  }, [googleLoading, isAuthenticated, googleLoginFlow])

  // Mode maintenance
  if (settings.maintenanceMode) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-950 text-white select-none font-sans">
        <NavBar />
        <main className="flex-1 pt-20 bg-slate-950 flex items-center justify-center">
          <div className="text-center space-y-4 px-6">
            <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <h1 className="text-2xl font-heading text-white">Site en maintenance</h1>
            <p className="text-sm text-slate-400 max-w-md">Nous effectuons des opérations de maintenance. Revenez dans quelques instants.</p>
          </div>
        </main>
        <ScrollToTop />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white select-none font-sans">
      <NavBar />

      <main className="flex-1 pt-20 bg-slate-950">
        <HeroesPage onGoogleLogin={handleGoogleLogin} googleLoading={googleLoading} googleError={googleError} />

        <Partners />

        <Features />

        <HowItWorks />

        <Pricing />

        <FAQ />

        <Contact />
      </main>

      <Footer />
      <ScrollToTop />
    </div>
  );
}

function LandingPage() {
  return (
    <PublicSettingsProvider>
      <LandingContent />
    </PublicSettingsProvider>
  );
}

export default LandingPage;