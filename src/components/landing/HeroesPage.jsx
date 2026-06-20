import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import productMockupImg from "../../assets/images/hotspot_hero.jpg";
import { useNavigate } from "react-router-dom";
import { usePublicSettings } from "../../context/PublicSettingsContext";

const TRANSACTIONS = [
  { op: "MTN MoMo", amount: "1 500 XAF", time: "à l'instant" },
  { op: "Orange Money", amount: "500 XAF", time: "il y a 12s" },
  { op: "MTN MoMo", amount: "2 000 XAF", time: "il y a 30s" },
  { op: "Airtel Money", amount: "1 000 XAF", time: "il y a 1min" },
]

function HeroesPage() {
  const navigate = useNavigate();
  const { settings } = usePublicSettings();
  const [tickerIndex, setTickerIndex] = useState(0);
  const [tickerVisible, setTickerVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerVisible(false);
      setTimeout(() => {
        setTickerIndex((prev) => (prev + 1) % TRANSACTIONS.length);
        setTickerVisible(true);
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  return (
    <motion.section
      id="heroe"
      className="relative bg-slate-955 text-slate-100 overflow-hidden w-full min-h-[calc(100vh-80px)] flex items-center py-12 lg:py-5"
      initial="hidden"
      animate="visible"
    >
      <style>{`
        @keyframes hero-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-18px); }
        }
        @keyframes hero-glow {
          0%, 100% { opacity: 0.3; transform: scale(0.95); }
          50% { opacity: 0.6; transform: scale(1.08); }
        }
        @keyframes pulse-ring-blue {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(3); opacity: 0; }
        }
        @keyframes revenue-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59,130,246,0.4); }
          50% { box-shadow: 0 0 0 12px rgba(59,130,246,0); }
        }
        @keyframes card-enter {
          0% { opacity: 0; transform: translateX(40px) scale(0.9); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes card-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .hero-float { animation: hero-float 3.5s ease-in-out infinite; }
        .hero-glow { animation: hero-glow 4s ease-in-out infinite; }
        .animate-pulse-ring-blue { animation: pulse-ring-blue 2.5s ease-out infinite; }
        .animate-card-enter { animation: card-enter 0.6s cubic-bezier(0.22, 1, 0.36, 1) 1s both; }
        .revenue-card:hover { transform: translateY(-4px); border-color: rgba(59,130,246,0.5); }
        .revenue-card { transition: transform 0.3s ease, border-color 0.3s ease; }
      `}</style>

      <div className="absolute left-[-10%] top-[-10%] w-150 h-150 bg-blue-600/8 blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="absolute right-[-5%] bottom-[-5%] w-125 h-125 bg-blue-500/6 blur-[130px] rounded-full pointer-events-none z-0" />

      <div className="w-full mx-auto px-6 sm:px-12 lg:px-16 2xl:px-24 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

        <motion.div
          className="lg:col-span-5 flex flex-col md:justify-center justify-start w-full text-center lg:text-left"
          variants={containerVariants}
        >
          <motion.span
            className="text-xs font-bold uppercase tracking-widest text-blue-400/90 mb-3 block mx-auto lg:mx-0"
            variants={itemVariants}
          >
            +10 000 opérateurs nous font confiance
          </motion.span>

          <motion.h1
            className="text-[2.5rem] sm:text-5xl lg:text-[3.5rem] font-heading leading-tight text-white"
            variants={itemVariants}
          >
            Monétisez votre WiFi en{' '}
            <span className="text-blue-500">quelques clics</span>
          </motion.h1>

          <motion.p
            className="mt-6 text-base sm:text-lg text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            variants={itemVariants}
          >
            La plateforme qui transforme votre hotspot en revenus.
            Vos clients paient par Mobile Money, l'accès WiFi est délivré automatiquement.{' '}
            <span className="text-slate-300 font-semibold">Zéro effort, revenus garantis.</span>
          </motion.p>

          <motion.div
            className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 w-full sm:w-auto"
            variants={itemVariants}
          >
            {settings.registrationEnabled ? (
              <motion.button
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm px-8 py-4 transition-all cursor-pointer shadow-lg shadow-blue-600/25 active:scale-[0.98]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/sign-in')}
              >
                Commencer gratuitement
              </motion.button>
            ) : (
              <motion.button
                className="w-full sm:w-auto bg-slate-800 text-slate-400 font-semibold rounded-xl text-sm px-8 py-4 cursor-not-allowed border border-slate-700"
                disabled
              >
                Inscriptions fermées
              </motion.button>
            )}
            <a
              href="#demo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-slate-300 hover:text-blue-400 border border-slate-800 hover:border-blue-500/40 bg-slate-900/40 font-semibold text-sm px-6 py-4 rounded-xl transition-all cursor-pointer"
            >
              Comment ça marche <span>→</span>
            </a>
          </motion.div>

          <motion.div
            className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6 border-t border-slate-900 pt-8 w-full max-w-xl mx-auto lg:mx-0 text-left"
            variants={itemVariants}
          >
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <svg width={22} height={22} className="text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h3 className="font-bold text-sm text-slate-200">Paiement auto</h3>
              </div>
              <p className="text-xs text-slate-500">Sécurité renforcée</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <svg width={22} height={22} className="text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h3 className="font-bold text-sm text-slate-200">Installation rapide</h3>
              </div>
              <p className="text-xs text-slate-500">5 minutes chrono</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <svg width={22} height={22} className="text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="font-bold text-sm text-slate-200">Dashboard</h3>
              </div>
              <p className="text-xs text-slate-500">Temps réel</p>
            </div>
          </motion.div>
        </motion.div>

        <div className="lg:col-span-7 flex items-center justify-center lg:justify-end w-full z-10">
          <motion.div
            className="relative w-full max-w-2xl lg:max-w-none lg:pl-6"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="absolute -inset-8 flex items-center justify-center pointer-events-none">
              <div className="w-72 h-72 rounded-full border border-blue-500/10 animate-pulse-ring-blue" />
              <div className="absolute w-56 h-56 rounded-full border border-blue-500/8 animate-pulse-ring-blue" style={{ animationDelay: '0.8s' }} />
            </div>

            <div className="absolute inset-0 bg-blue-500/8 blur-3xl rounded-2xl pointer-events-none hero-glow" />

            <img
              src={productMockupImg}
              alt="Dashboard HotspotPay"
              className="w-full h-auto object-contain rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] border border-slate-900/80 transition-transform duration-500 group-hover:scale-[1.02] hero-float relative"
            />

            <motion.div
              className="absolute -top-4 -right-4 md:-top-6 md:-right-6 bg-slate-900/95 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 md:p-5 shadow-2xl shadow-blue-500/5 min-w-[220px] md:min-w-[260px] revenue-card animate-card-enter"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revenus en direct</span>
                </div>
                <span className="text-[10px] font-bold text-blue-400/80">Aujourd'hui</span>
              </div>

              <div className="text-2xl md:text-3xl font-black text-white mb-3 tracking-tight">
                125 500{' '}
                <span className="text-blue-500 text-sm font-bold">XAF</span>
              </div>

              <div className="space-y-2 border-t border-slate-800/60 pt-3">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-blue-500/10 flex items-center justify-center">
                      <span className="text-[8px] font-black text-blue-400">
                        {TRANSACTIONS[tickerIndex].op === 'MTN MoMo' ? 'M' : TRANSACTIONS[tickerIndex].op === 'Orange Money' ? 'O' : 'A'}
                      </span>
                    </div>
                    <span className={`text-slate-400 font-medium transition-opacity duration-300 ${tickerVisible ? 'opacity-100' : 'opacity-0'}`}>
                      {TRANSACTIONS[tickerIndex].op}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-white font-bold transition-opacity duration-300 ${tickerVisible ? 'opacity-100' : 'opacity-0'}`}>
                      {TRANSACTIONS[tickerIndex].amount}
                    </span>
                    <span className="text-slate-600">{TRANSACTIONS[tickerIndex].time}</span>
                  </div>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-500 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2.8, ease: 'linear' }}
                    key={tickerIndex}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}

export default HeroesPage;
