import { ArrowRight, Wifi } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePublicSettings } from "../../context/PublicSettingsContext";

function Footer() {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();
  const { settings } = usePublicSettings();

  return (
    <footer className="bg-slate-950 border-t border-slate-800 select-none mt-auto w-full relative overflow-hidden">
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/3 rounded-full blur-[130px] pointer-events-none" />

      <div className="w-full px-4 md:px-8 lg:px-16 2xl:px-24 py-8 lg:py-12 relative z-10">

        <div className="w-full bg-slate-900/30 border border-slate-800/80 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 mb-16 relative backdrop-blur-md">
          <div className="absolute inset-0 bg-linear-to-r from-blue-500/2 to-transparent pointer-events-none rounded-3xl" />

          <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
            <div className="w-12 h-12 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shadow-lg shadow-blue-500/5 shrink-0">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold tracking-tight text-white mb-0.5">
                Lancez votre WiFi rentable dès aujourd'hui
              </h3>
              <p className="text-slate-400 text-xs md:text-sm">
                Rejoignez +10 000 opérateurs qui monétisent déjà leur connexion avec {settings.appName}.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/sign-in')}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-3.5 px-5 rounded-xl tracking-wide transition-all flex items-center gap-2 shrink-0 cursor-pointer shadow-lg shadow-blue-600/10 active:scale-[0.98]"
          >
            Commencer maintenant
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-12 gap-10 lg:gap-6 items-start">
          <div className="lg:col-span-4 space-y-4 flex flex-col items-center md:items-start text-center md:text-left">
            <a href="/" className="flex items-center select-none">
              <span className="text-xl font-black tracking-tight text-white">
                HOTSPOT<span className="text-orange-500">PAY</span>
              </span>
            </a>
            <p className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-sm">
              La plateforme tout-en-un pour les opérateurs de Hotspots en Afrique.
            </p>
            {settings.supportEmail && (
              <p className="text-blue-400 text-xs mt-1">{settings.supportEmail}</p>
            )}
          </div>

          <div className="md:col-span-2 lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center sm:text-left">
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Produit</h4>
              <ul className="space-y-2.5 text-xs font-medium text-slate-400">
                <li><a href="#features" className="hover:text-blue-400 transition-colors">Fonctionnalités</a></li>
                <li><a href="#pricing" className="hover:text-blue-400 transition-colors">Tarifs</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Mises à jour</a></li>
              </ul>
            </div>
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Ressources</h4>
              <ul className="space-y-2.5 text-xs font-medium text-slate-400">
                <li><a href="#" className="hover:text-blue-400 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">API</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Guides</a></li>
              </ul>
            </div>
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Entreprise</h4>
              <ul className="space-y-2.5 text-xs font-medium text-slate-400">
                <li><a href="/about" className="hover:text-blue-400 transition-colors">À propos</a></li>
                <li><a href="#" className="hover:text-blue-400 transition-colors">Blog</a></li>
                <li><a href="#contact" className="hover:text-blue-400 transition-colors">Contact</a></li>
              </ul>
            </div>
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Suivez-nous</h4>
              <div className="flex items-center justify-center sm:justify-start gap-2.5">
                <a href="#" className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-blue-400 hover:border-blue-500/30 flex items-center justify-center transition-all" aria-label="Facebook">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                  </svg>
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-blue-400 hover:border-blue-500/30 flex items-center justify-center transition-all" aria-label="Twitter">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-blue-400 hover:border-blue-500/30 flex items-center justify-center transition-all" aria-label="LinkedIn">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        <hr className="my-8 border-slate-800" />

        <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between text-center sm:text-left text-[11px] font-medium text-slate-500">
          <span>© {currentYear} {settings.appName}. Tous droits réservés.</span>
          <div className="flex items-center justify-center gap-6">
            <a href="#" className="hover:text-slate-300 transition-colors">Conditions d'utilisation</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Politique de confidentialité</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
