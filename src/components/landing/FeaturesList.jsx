import React from "react";
import {
  ShieldCheck,
  Smartphone,
  BarChart3,
  WifiIcon,
  Layers3Icon,
  MonitorSmartphoneIcon,
} from "lucide-react";
import { motion } from "framer-motion";

const featuresList = [
  {
    icon: <ShieldCheck className="w-6 h-6 text-blue-500" />,
    title: "Authentification sécurisée",
    description:
      "Vos clients se connectent en un clic via leur téléphone. Pas de mot de passe à retenir, pas de partage de code. Sécurité maximale, friction minimale.",
  },
  {
    icon: <MonitorSmartphoneIcon className="w-6 h-6 text-blue-500" />,
    title: "Portail captif mobile-first",
    description:
      "Une interface conçue pour l'Afrique : les clients paient en Mobile Money (MTN, Orange, Camtel) et reçoivent leur code WiFi en 5 secondes. Zéro paperasse.",
  },
  {
    icon: <BarChart3 className="w-6 h-6 text-blue-500" />,
    title: "Dashboard en temps réel",
    description:
      "Suivez vos ventes, vos connexions actives et vos revenus en direct depuis votre téléphone ou votre ordinateur. Tout est synchronisé, partout.",
  },
  {
    icon: <Smartphone className="w-6 h-6 text-blue-500" />,
    title: "Paiements Mobile Money",
    description:
      "MTN MoMo, Orange Money, Camtel Money — vos clients paient avec ce qu'ils ont déjà dans leur poche. Pas de carte bancaire nécessaire.",
  },
  {
    icon: <WifiIcon className="w-6 h-6 text-blue-500" />,
    title: "Multi-routeurs compatible",
    description:
      "MikroTik, TP-Link, Ubiquiti, Cisco... Peu importe votre matériel. Générez un script adapté en 1 clic et votre hotspot est opérationnel.",
  },
  {
    icon: <Layers3Icon className="w-6 h-6 text-blue-500" />,
    title: "100% automatisé",
    description:
      "Le client paie → l'accès WiFi est délivré. Pas d'intervention humaine, pas d'erreur, pas de retard. Vos revenus tournent 24h/24, même quand vous dormez.",
  },
];

function Features() {
  return (
    <section id="features" className="bg-slate-950 py-24 relative overflow-hidden select-none">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/8 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-blue-500/4 rounded-full blur-[150px] pointer-events-none" />

      <div className="w-full px-4 md:px-8 lg:px-16 2xl:px-24 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-blue-400 font-semibold text-xs tracking-widest uppercase bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20 inline-block mb-4"
          >
            Fonctionnalités
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-5xl font-heading text-white tracking-tight leading-tight mb-6"
          >
            <span className="bg-linear-to-r from-white via-slate-200 to-blue-400 bg-clip-text text-transparent">
              Pourquoi nous choisir
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-slate-400 text-base md:text-lg leading-relaxed"
          >
            Tout ce qu'il faut pour lancer et gérer votre WiFi rentable, sans compétence technique.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {featuresList.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -6 }}
              className="group relative bg-slate-900/20 border border-slate-900/80 rounded-2xl p-8 hover:bg-slate-900/60 hover:border-blue-500/30 transition-all duration-300 shadow-2xl backdrop-blur-xs"
            >
              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-blue-500/5 border border-blue-500/10 mb-6 group-hover:bg-blue-600 group-hover:border-blue-500 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all duration-300">
                <div className="group-hover:scale-110 group-hover:text-white transition-all duration-300">
                  {React.cloneElement(feature.icon, {
                    className: "w-6 h-6 text-blue-500 group-hover:text-white transition-colors duration-300",
                  })}
                </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-3 tracking-tight group-hover:text-blue-400 transition-colors duration-300">
                {feature.title}
              </h3>

              <p className="text-slate-400 text-sm leading-relaxed group-hover:text-slate-300 transition-colors duration-300">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;
