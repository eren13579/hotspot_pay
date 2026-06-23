import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "C'est quoi HotspotPay exactement ?",
    r: "HotspotPay est une plateforme qui permet aux propriétaires de hotspots WiFi de monétiser leur connexion. Vos clients paient via Mobile Money et reçoivent un accès WiFi instantané — sans intervention humaine.",
  },
  {
    q: "Combien de temps faut-il pour installer ?",
    r: "Moins de 5 minutes. Créez votre compte, ajoutez votre routeur, copiez-collez le script généré dans votre équipement, créez vos tarifs. C'est tout. Pas de connaissance technique requise.",
  },
  {
    q: "Quels routeurs sont compatibles ?",
    r: "MikroTik (RouterOS), TP-Link, Ubiquiti, Cisco, Huawei — et d'autres à venir. La plateforme génère un script adapté à votre modèle automatiquement.",
  },
  {
    q: "Comment mes clients paient-ils ?",
    r: "Par Mobile Money : MTN MoMo, Orange Money. Le client sélectionne son opérateur, entre son numéro, confirme le paiement et reçoit son accès WiFi. Simple, rapide, familier.",
  },
  {
    q: "Puis-je gérer plusieurs hotspots ?",
    r: "Oui. Le plan Standard inclut 1 hotspot, le Pro jusqu'à 4, et le Premium jusqu'à 10. Vous pouvez aussi gérer plusieurs abonnements depuis un même compte.",
  },
  {
    q: "Comment reçois-je mes revenus ?",
    r: "Les paiements sont collectés automatiquement. Vous pouvez demander un retrait à tout moment. Les fonds sont disponibles dans votre espace avec un historique complet et exportable.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section className="bg-slate-950 py-24 relative overflow-hidden select-none border-t border-slate-900/60">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-blue-600/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="w-full px-4 md:px-8 lg:px-16 2xl:px-24 relative z-10 max-w-6xl mx-auto">
        {/* EN-TÊTE */}
        <div className="text-center mb-16">
          <span className="text-blue-400 font-semibold text-xs tracking-widest uppercase bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20 inline-block mb-4">
            FAQ
          </span>
          <h2 className="text-3xl md:text-5xl font-heading text-white tracking-tight mb-4">
            Des questions ? <br />
            <span className="bg-linear-to-r from-white to-blue-400 bg-clip-text text-transparent">
              Des réponses.
            </span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
            Tout ce que vous devez savoir avant de commencer.
          </p>
        </div>

        {/* ACCORDÉON */}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-slate-900/20 border border-slate-900/80 rounded-2xl overflow-hidden transition-all duration-200 hover:border-slate-800"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between gap-4 p-5 text-left cursor-pointer"
              >
                <span className="text-sm md:text-lg font-semibold text-white leading-relaxed">
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 text-slate-500 transition-transform duration-200 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-sm md:text-base text-slate-400 leading-relaxed">
                      {faq.r}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
