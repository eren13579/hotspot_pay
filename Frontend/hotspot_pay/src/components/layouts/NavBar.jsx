import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Globe, ChevronDown } from "lucide-react";
import { toggleLocale } from "../../store/uiSlice";
import { cn } from "../../utils/cn";

const locales = {
  fr: { label: 'FR', flag: '🇫🇷' },
  en: { label: 'EN', flag: '🇬🇧' },
}

function NavBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const locale = useSelector((state) => state.ui.locale);
  const currentLocale = locales[locale] || locales.fr;
  const handleLinkClick = () => setIsOpen(false);

  const handleNavigation = () => {
    navigate(isAuthenticated ? "/dashboard" : "/sign-in");
  }

  return (
    <nav className="bg-slate-950 fixed w-full z-20 top-0 inset-x-0 select-none backdrop-blur-md bg-opacity-95 border-b border-slate-900/60">
      <div className="flex flex-wrap items-center justify-between w-full px-4 md:px-8 lg:px-16 2xl:px-24 py-3">

        <a href="/" className="flex items-center select-none" onClick={handleLinkClick}>
          <span className="text-xl font-black tracking-tight text-white">
            HOTSPOT<span className="text-orange-500">PAY</span>
          </span>
        </a>

        <div className="flex md:order-2 items-center space-x-3 rtl:space-x-reverse">
          <div className="hidden md:flex gap-2">
            <motion.button
              className="text-sm px-5 py-2.5 transition-all cursor-pointer active:scale-95 text-slate-300 hover:text-blue-400 border border-slate-800 hover:border-blue-700 bg-slate-900/40 font-semibold rounded-xl"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNavigation}
            >
              {isAuthenticated ? 'Dashboard' : 'Se connecter'}
            </motion.button>

            <a href="#demo">
              <motion.button
                type="button"
                className="text-center text-white bg-blue-600 hover:bg-blue-500 font-semibold rounded-xl text-sm px-5 py-2.5 transition-colors cursor-pointer shadow-lg shadow-blue-600/20"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Comment ça marche
              </motion.button>
            </a>
          </div>

          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all text-slate-400 hover:text-blue-400 hover:bg-slate-900 cursor-pointer"
            >
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">{currentLocale.label}</span>
              <ChevronDown className={cn('w-3 h-3 transition-transform hidden sm:block', langOpen && 'rotate-180')} />
            </button>

            {langOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setLangOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-40 w-28 rounded-xl border border-slate-800 bg-slate-900 shadow-xl overflow-hidden">
                  {Object.entries(locales).map(([key, { label, flag }]) => (
                    <button
                      key={key}
                      onClick={() => { dispatch(toggleLocale()); setLangOpen(false) }}
                      className={cn(
                        'flex items-center gap-2 w-full px-3 py-2 text-xs font-medium transition-all',
                        locale === key
                          ? 'text-blue-400 bg-blue-500/10'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800',
                      )}
                    >
                      <span>{flag}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            type="button"
            className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-slate-400 rounded-lg md:hidden hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-800 cursor-pointer transition-colors"
            aria-controls="navbar-cta"
            aria-expanded={isOpen}
          >
            <span className="sr-only">Menu</span>
            <svg className="w-6 h-6" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              {isOpen ? (
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path stroke="currentColor" strokeLinecap="round" strokeWidth="2" d="M5 7h14M5 12h14M5 17h14" />
              )}
            </svg>
          </button>
        </div>

        <div className={`items-center justify-between w-full md:flex md:w-auto md:order-1 ${isOpen ? "block" : "hidden"}`} id="navbar-cta">
          <ul className="font-medium flex flex-col p-4 md:p-0 mt-4 border border-slate-900 rounded-2xl bg-slate-950 md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0 md:border-0 md:bg-transparent text-sm gap-1 md:gap-0">
            <li>
              <a href="#features" onClick={handleLinkClick}
                className="block py-2.5 px-4 text-slate-300 md:text-slate-300 rounded-xl hover:bg-slate-900 md:hover:bg-transparent md:border-0 md:hover:text-blue-400 md:p-0 transition-colors">
                Fonctionnalités
              </a>
            </li>
            <li>
              <a href="#pricing" onClick={handleLinkClick}
                className="block py-2.5 px-4 text-slate-300 rounded-xl hover:bg-slate-900 md:hover:bg-transparent md:border-0 md:hover:text-blue-400 md:p-0 transition-colors">
                Tarifs
              </a>
            </li>
            <li>
              <a href="#partners" onClick={handleLinkClick}
                className="block py-2.5 px-4 text-slate-300 rounded-xl hover:bg-slate-900 md:hover:bg-transparent md:border-0 md:hover:text-blue-400 md:p-0 transition-colors">
                Ressources
              </a>
            </li>
            <li>
              <a href="#contact" onClick={handleLinkClick}
                className="block py-2.5 px-4 text-slate-300 rounded-xl hover:bg-slate-900 md:hover:bg-transparent md:border-0 md:hover:text-blue-400 md:p-0 transition-colors">
                Contact
              </a>
            </li>
            <li>
              <a href="/about" onClick={handleLinkClick}
                className="block py-2.5 px-4 text-slate-300 rounded-xl hover:bg-slate-900 md:hover:bg-transparent md:border-0 md:hover:text-blue-400 md:p-0 transition-colors">
                À propos
              </a>
            </li>

            <li className="mt-4 pt-4 border-t border-slate-900 md:hidden space-y-4">
              <motion.button
                className="w-full text-sm px-5 py-2.5 transition-all cursor-pointer active:scale-95 text-slate-300 hover:text-blue-400 border border-slate-800 hover:border-blue-700 bg-slate-900/40 font-semibold rounded-xl"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNavigation}>
                {isAuthenticated ? 'Dashboard' : 'Se connecter'}
              </motion.button>

              <a href="#demo" onClick={handleLinkClick} className="block w-full">
                <motion.button
                  type="button"
                  className="w-full text-white bg-blue-600 hover:bg-blue-500 font-semibold rounded-xl text-sm px-4 py-3 transition-colors cursor-pointer shadow-lg shadow-blue-600/20"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}>
                  Comment ça marche
                </motion.button>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
