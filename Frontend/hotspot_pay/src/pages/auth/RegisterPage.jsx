import { useState, useEffect } from "react";
import LeftPanel from "../../components/auth/LeftPanel";
import AuthLoader from "../../components/loader/AuthLoader";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { register, loading, error: authError, fieldErrors, clearError } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const displayError = error || authError;

  useEffect(() => {
    if (displayError) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [displayError, clearError]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    if (authError) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    await register(formData.email, formData.password);
  };

  const handleLogin = () => navigate("/sign-in");
  const togglePassword = () => setShowPassword(!showPassword);

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 h-screen w-screen bg-slate-950 overflow-hidden select-none">
      <LeftPanel />

      <div className="col-span-1 md:col-span-3 flex items-center justify-center p-6 sm:p-12">
        {loading ? (
          <AuthLoader label="Création de votre compte..." />
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 w-full max-w-md p-2"
          >
            <div className="mb-2">
              <h1 className="text-2xl font-bold text-white">Créer un compte</h1>
              <p className="text-sm text-slate-400 mt-1">
                Rejoignez-nous pour monétiser votre réseau
              </p>
            </div>

            {displayError && (
              <div className="bg-red-500/10 text-red-400 text-xs p-3 rounded-lg text-center border border-red-500/20">
                {displayError}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 text-sm font-medium">
                Email
              </label>
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
              <label className="text-slate-300 text-sm font-medium">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`h-11 w-full rounded-lg bg-slate-800 border px-3 pr-10 text-white placeholder-slate-500 text-sm focus:outline-none transition-colors ${
                    fieldErrors.password
                      ? "border-red-500 focus:border-red-400"
                      : "border-slate-700 focus:border-orange-500"
                  }`}
                  type={showPassword ? "text" : "password"}
                  required
                />
                <button
                  type="button"
                  onClick={togglePassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-red-400 text-xs mt-1">{fieldErrors.password}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-slate-300 text-sm font-medium">
                Confirmer le mot de passe
              </label>
              <input
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="h-11 rounded-lg bg-slate-800 border border-slate-700 px-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-500 transition-colors"
                type={showPassword ? "text" : "password"}
                required
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer mt-1">
              <input
                type="checkbox"
                required
                className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-800 accent-orange-500"
              />
              <span className="text-xs text-slate-400">
                J'accepte les{" "}
                <span className="text-orange-400">
                  Conditions d'utilisation
                </span>
              </span>
            </label>

            <button
              type="submit"
              className="h-11 rounded-lg bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold transition-colors"
            >
              S'inscrire
            </button>

            <p className="text-center text-slate-500 text-xs">
              Déjà un compte ?{" "}
              <span
                className="text-orange-400 cursor-pointer hover:text-orange-300 transition-colors"
                onClick={handleLogin}
              >
                Se connecter
              </span>
            </p>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-slate-600 text-xs">ou</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            <button
              type="button"
              className="h-11 rounded-lg flex justify-center items-center gap-2.5 bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-300 text-sm transition-colors"
            >
              <svg width="16" viewBox="0 0 512 512">
                <path
                  d="M113.47,309.408L95.648,375.94l-65.139,1.378C11.042,341.211,0,299.9,0,256c0-42.451,10.324-82.483,28.624-117.732h0.014l57.992,10.632l25.404,57.644c-5.317,15.501-8.215,32.141-8.215,49.456C103.821,274.792,107.225,292.797,113.47,309.408z"
                  fill="#FBBB00"
                />
                <path
                  d="M507.527,208.176C510.467,223.662,512,239.655,512,256c0,18.328-1.927,36.206-5.598,53.451c-12.462,58.683-45.025,109.925-90.134,146.187l-0.014-0.014l-73.044-3.727l-10.338-64.535c29.932-17.554,53.324-45.025,65.646-77.911h-136.89V208.176h138.887L507.527,208.176L507.527,208.176z"
                  fill="#518EF8"
                />
                <path
                  d="M416.253,455.624l0.014,0.014C372.396,490.901,316.666,512,256,512c-97.491 0-182.252-54.491-225.491-134.681l82.961-67.91c21.619,57.698,77.278,98.771,142.53,98.771c28.047,0,54.323-7.582,76.87-20.818L416.253,455.624z"
                  fill="#28B446"
                />
                <path
                  d="M419.404,58.936l-82.933,67.896c-23.335-14.586-50.919-23.012-80.471-23.012c-66.729 0-123.429,42.957-143.965,102.724l-83.397-68.276h-0.014C71.23,56.123,157.06,0,256,0C318.115,0,375.068,22.126,419.404,58.936z"
                  fill="#F14336"
                />
              </svg>
              Continuer avec Google
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default RegisterPage;
