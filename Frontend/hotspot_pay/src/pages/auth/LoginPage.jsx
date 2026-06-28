import { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import LeftPanel from "../../components/auth/LeftPanel";
import AuthLoader from "../../components/loader/AuthLoader";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { twoFactorLogin, clearTwoFactorState } from "../../store/authSlice";
import { ArrowLeft, ShieldAlert } from "lucide-react";

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('hotspotpay-remember') === 'true';
  });
  const [totpCode, setTotpCode] = useState('');
  const [googleError, setGoogleError] = useState('');
  const totpInputRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { login, loading, error, clearError, google } = useAuth();
  const { requiresTwoFactor, tempToken } = useSelector(state => state.auth);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  useEffect(() => {
    if (requiresTwoFactor && totpInputRef.current) {
      totpInputRef.current.focus();
    }
  }, [requiresTwoFactor]);

  const [formData, setFormData] = useState(() => ({
    email: localStorage.getItem('hotspotpay-saved-email') || '',
    password: '',
  }));

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rememberMe) {
      localStorage.setItem('hotspotpay-remember', 'true');
      localStorage.setItem('hotspotpay-saved-email', formData.email);
    } else {
      localStorage.removeItem('hotspotpay-remember');
      localStorage.removeItem('hotspotpay-saved-email');
    }
    await login(formData.email, formData.password);
  };

  const handleTotpSubmit = async (e) => {
    e.preventDefault();
    if (totpCode.length < 6) return;
    const result = await dispatch(twoFactorLogin({ tempToken, totpCode }));
    if (twoFactorLogin.fulfilled.match(result)) {
      dispatch(clearTwoFactorState());
      navigate('/dashboard');
    }
  };

  const handleBackToLogin = () => {
    dispatch(clearTwoFactorState());
    setTotpCode('');
  };

  const handleRegister = () => navigate("/sign-up");
  const togglePassword = () => setShowPassword(!showPassword);

  const handleGoogle = async (accessToken, userInfo) => {
    if (!accessToken) return;
    setGoogleError('');
    // Envoie l'access_token + infos user récupérées de l'API userinfo
    await google({
      idToken: accessToken,
      email: userInfo.email,
      name: userInfo.name,
      googleId: userInfo.sub,
      picture: userInfo.picture,
    });
  };

  // ── Google OAuth2 (popup — pas de FedCM) ──────────────────────────────────
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleGoogleClick = useCallback(() => {
    if (!window.google?.accounts?.oauth2) {
      setGoogleError("Chargement de Google... réessayez dans un instant");
      return;
    }

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'openid profile email',
      callback: (tokenResponse) => {
        if (tokenResponse.access_token) {
          // Récupère les infos user depuis l'API Google UserInfo
          fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          })
            .then((res) => res.json())
            .then((userInfo) => {
              const { sub, email, name, picture } = userInfo;
              if (!sub || !email) {
                setGoogleError("Impossible de récupérer vos informations Google");
                return;
              }
              handleGoogle(tokenResponse.access_token, { sub, email, name, picture });
            })
            .catch(() => {
              setGoogleError("Erreur de communication avec Google");
            });
        }
      },
      error_callback: (error) => {
        if (error.type !== 'popup_closed') {
          console.error('Google OAuth error:', error);
          setGoogleError("Erreur de connexion Google");
        }
      },
    });

    tokenClient.requestAccessToken({ prompt: 'select_account' });
  }, []);

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-5 min-h-screen w-full bg-slate-950 overflow-y-auto lg:overflow-hidden">
      <LeftPanel />

      <div className="flex-1 lg:col-span-3 flex items-center justify-center p-4 sm:p-6 lg:p-12 min-h-screen lg:min-h-0 relative">
        {/* Bouton retour à l'accueil */}
        <button
          onClick={() => navigate("/")}
          className="absolute top-3 left-3 sm:top-4 sm:left-4 lg:top-6 lg:left-6 w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800/40 border border-slate-700/40 text-slate-400 hover:text-white hover:bg-slate-800 hover:border-slate-600 transition-all z-10 cursor-pointer"
          title="Accueil"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {loading ? (
          <AuthLoader label={requiresTwoFactor ? "Vérification..." : "Authentification..."} />
        ) : requiresTwoFactor ? (
          /* ── Étape 2FA ── */
          <form onSubmit={handleTotpSubmit} className="flex flex-col gap-5 w-full max-w-md p-4 sm:p-6 md:p-8">
            <div className="flex flex-col items-center lg:hidden mb-2">
              <div className="text-2xl font-bold text-white">
                Hotspot<span className="text-orange-500">Pay</span>
              </div>
              <div className="w-8 h-0.5 bg-linear-to-r from-transparent via-orange-500 to-transparent mt-2 mb-1" />
              <p className="text-xs text-slate-500">Connexion sécurisée</p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-6 h-6 text-blue-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">Authentification à deux facteurs</h1>
              <p className="text-sm text-slate-400 mt-1">
                Saisissez le code à 6 chiffres généré par votre application d'authentification
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 text-red-400 text-xs p-3 rounded-lg text-center border border-red-500/20">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 text-sm font-medium">Code de vérification</label>
              <input
                ref={totpInputRef}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={totpCode}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setTotpCode(val);
                  if (error) clearError();
                }}
                placeholder="000000"
                className="h-14 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 text-white placeholder-slate-500 text-2xl text-center font-mono tracking-widest focus:outline-none focus:border-orange-500 transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={totpCode.length < 6}
              className="h-12 sm:h-11 rounded-lg bg-orange-500 hover:bg-orange-400 active:bg-orange-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Vérifier
            </button>

            <button
              type="button"
              onClick={handleBackToLogin}
              className="text-center text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            >
              Retour à la connexion
            </button>
          </form>
        ) : (
          /* ── Formulaire de connexion standard ── */
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-5 w-full max-w-md p-4 sm:p-6 md:p-8"
          >
            {/* Logo mobile (caché sur desktop — LeftPanel le montre) */}
            <div className="flex flex-col items-center lg:hidden mb-2">
              <div className="text-2xl font-bold text-white">
                Hotspot<span className="text-orange-500">Pay</span>
              </div>
              <div className="w-8 h-0.5 bg-linear-to-r from-transparent via-orange-500 to-transparent mt-2 mb-1" />
              <p className="text-xs text-slate-500">Connexion instantanée, accès sécurisé</p>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Bon retour</h1>
              <p className="text-sm text-slate-400 mt-1">
                Connectez-vous pour accéder à votre espace
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 text-red-400 text-xs p-3 rounded-lg text-center border border-red-500/20">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 text-sm font-medium">Email</label>
              <input
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="votre@email.com"
                className="h-11 rounded-lg bg-slate-800 border border-slate-700 px-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500 transition-colors"
                type="email"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 text-sm font-medium">Mot de passe</label>
              <div className="relative">
                <input
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="h-11 w-full rounded-lg bg-slate-800 border border-slate-700 px-3 pr-10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500 transition-colors"
                  type={showPassword ? "text" : "password"}
                  required
                />
                <button
                  type="button"
                  onClick={togglePassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
              <label className="flex items-center gap-2 cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 accent-orange-500 cursor-pointer"
                />
                <span className="text-xs text-slate-400 select-none">Se souvenir de moi</span>
              </label>
              <span className="text-xs text-orange-400 cursor-pointer hover:text-orange-300 transition-colors py-1">
                Mot de passe oublié ?
              </span>
            </div>

            <button
              type="submit"
              className="h-12 sm:h-11 rounded-lg bg-orange-500 hover:bg-orange-400 active:bg-orange-600 text-white text-sm font-semibold transition-colors"
            >
              Se connecter
            </button>

            <p className="text-center text-slate-500 text-xs">
              Pas encore de compte ?{" "}
              <span
                className="text-orange-400 cursor-pointer hover:text-orange-300 transition-colors font-medium"
                onClick={handleRegister}
              >
                Créer un compte
              </span>
            </p>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-slate-600 text-xs">ou</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            {googleError && (
              <div className="bg-red-500/10 text-red-400 text-xs p-3 rounded-lg text-center border border-red-500/20">
                {googleError}
              </div>
            )}

            <button
              type="button"
              className="h-12 sm:h-11 rounded-lg flex justify-center items-center gap-2.5 bg-slate-800 border border-slate-700 hover:border-slate-600 active:border-slate-500 text-slate-300 text-sm transition-colors"
              onClick={handleGoogleClick}
            >
              <svg width="16" viewBox="0 0 512 512">
                <path d="M113.47,309.408L95.648,375.94l-65.139,1.378C11.042,341.211,0,299.9,0,256c0-42.451,10.324-82.483,28.624-117.732h0.014l57.992,10.632l25.404,57.644c-5.317,15.501-8.215,32.141-8.215,49.456C103.821,274.792,107.225,292.797,113.47,309.408z" fill="#FBBB00" />
                <path d="M507.527,208.176C510.467,223.662,512,239.655,512,256c0,18.328-1.927,36.206-5.598,53.451c-12.462,58.683-45.025,109.925-90.134,146.187l-0.014-0.014l-73.044-3.727l-10.338-64.535c29.932-17.554,53.324-45.025,65.646-77.911h-136.89V208.176h138.887L507.527,208.176L507.527,208.176z" fill="#518EF8" />
                <path d="M416.253,455.624l0.014,0.014C372.396,490.901,316.666,512,256,512c-97.491 0-182.252-54.491-225.491-134.681l82.961-67.91c21.619,57.698,77.278,98.771,142.53,98.771c28.047,0,54.323-7.582,76.87-20.818L416.253,455.624z" fill="#28B446" />
                <path d="M419.404,58.936l-82.933,67.896c-23.335-14.586-50.919-23.012-80.471-23.012c-66.729 0-123.429,42.957-143.965,102.724l-83.397-68.276h-0.014C71.23,56.123,157.06,0,256,0C318.115,0,375.068,22.126,419.404,58.936z" fill="#F14336" />
              </svg>
              Continuer avec Google
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default LoginPage;
