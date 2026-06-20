import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Settings,
  FileSpreadsheet,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";

const steps = [
  {
    id: 1,
    icon: <ShieldCheck className="w-5 h-5" />,
    title: "Créez votre compte",
    description:
      "Inscrivez-vous gratuitement en 30 secondes. Pas de carte bancaire, pas d'engagement. Votre espace de gestion est immédiatement disponible.",
    statLabel: "Statut Compte",
    statValue: "Actif & Sécurisé",
    statColor: "text-blue-400",
  },
  {
    id: 2,
    icon: <Settings className="w-5 h-5" />,
    title: "Connectez votre routeur",
    description:
      "Ajoutez votre hotspot, notre plateforme génère automatiquement le script adapté à votre marque (MikroTik, TP-Link, etc.). Copiez-collez, c'est prêt.",
    statLabel: "Statut Routeur",
    statValue: "Opérationnel (100%)",
    statColor: "text-emerald-400",
  },
  {
    id: 3,
    icon: <FileSpreadsheet className="w-5 h-5" />,
    title: "Créez vos offres WiFi",
    description:
      "Définissez vos tarifs (1h, 24h, 7 jours...) et importez vos tickets existants depuis MikroTik en un clic. Ou créez des profils sur mesure.",
    statLabel: "Offres créées",
    statValue: "Prêtes à vendre",
    statColor: "text-blue-400",
  },
  {
    id: 4,
    icon: <TrendingUp className="w-5 h-5" />,
    title: "Gagnez de l'argent",
    description:
      "Vos clients se connectent au WiFi, paient par Mobile Money et obtiennent leur accès automatiquement. Vous suivez vos revenus en temps réel.",
    statLabel: "Revenus (Aujourd'hui)",
    statValue: "+125 500 XAF",
    statColor: "text-emerald-400",
  },
];

function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="demo" className="bg-slate-950 py-24 relative overflow-hidden select-none border-t border-slate-900/60">
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-[130px] pointer-events-none" />

      <div className="w-full px-4 md:px-8 lg:px-16 2xl:px-24 relative z-10">
        <div className="mb-20">
          <span className="text-blue-400 font-semibold text-xs tracking-widest uppercase bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20 inline-block mb-4">
            Comment ça marche
          </span>
          <h2 className="text-3xl md:text-5xl font-heading text-white tracking-tight">
            Lancez votre WiFi ZONE{' '}
            <span className="bg-linear-to-r from-white to-blue-400 bg-clip-text text-transparent">
              en 4 étapes simples
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 flex flex-col gap-3 relative">
            <div className="absolute left-9.5 top-6 bottom-6 w-0.5 bg-slate-900 pointer-events-none hidden sm:block">
              <motion.div
                className="w-full bg-blue-500 origin-top"
                animate={{ height: `${(activeStep / (steps.length - 1)) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {steps.map((step, index) => {
              const isActive = activeStep === index;
              return (
                <div
                  key={step.id}
                  onMouseEnter={() => setActiveStep(index)}
                  className={`flex items-start gap-6 p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                    isActive
                      ? "bg-slate-900/50 border-blue-500/30 shadow-lg shadow-blue-500/5"
                      : "bg-transparent border-transparent hover:bg-slate-900/20"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 transition-all duration-300 relative ${
                      isActive
                        ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                        : "bg-slate-900 text-slate-400 border border-slate-800"
                    }`}
                  >
                    {step.icon}
                    <span
                      className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center border transition-colors ${
                        isActive
                          ? "bg-emerald-500 text-slate-950 border-blue-600"
                          : "bg-slate-800 text-slate-400 border-slate-900"
                      }`}
                    >
                      {step.id}
                    </span>
                  </div>

                  <div>
                    <h3 className={`text-lg font-bold tracking-tight mb-1 transition-colors ${isActive ? "text-blue-400" : "text-white"}`}>
                      {step.title}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-md">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="lg:col-span-6 flex justify-center items-center h-full min-h-87.5">
            <motion.div
              className="w-full max-w-md bg-slate-900/30 border border-slate-900 rounded-3xl p-8 relative backdrop-blur-md shadow-2xl"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-900">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  <span className="text-xs text-slate-500 ml-2 font-mono">hotspotpay_panel</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-600" />
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Aperçu du système
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-6 shadow-inner relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none" />

                    <p className="text-sm font-medium text-slate-400 mb-2">
                      {steps[activeStep].statLabel}
                    </p>
                    <p className={`text-3xl font-black tracking-tight ${steps[activeStep].statColor}`}>
                      {steps[activeStep].statValue}
                    </p>

                    {activeStep === 3 && (
                      <div className="mt-4 pt-4 border-t border-slate-900 flex items-end h-16 gap-1">
                        {[40, 55, 45, 60, 75, 50, 90, 100].map((h, i) => (
                          <motion.div
                            key={i}
                            className="bg-blue-500/40 rounded-t-xs w-full"
                            initial={{ height: 0 }}
                            animate={{ height: `${h}%` }}
                            transition={{ delay: i * 0.05, duration: 0.4 }}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl font-mono text-[11px] text-slate-500 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    {"system_log: step_"}
                    {steps[activeStep].id}
                    {"_verified_successfully"}
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
