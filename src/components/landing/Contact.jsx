import { useState } from "react";
import { motion } from "framer-motion";
import { Send, MessageSquare, Mail, Loader2 } from "lucide-react";
import { usePublicSettings } from "../../context/PublicSettingsContext";
import { contactApi } from "../../api/endpoints";

function Contact() {
  const { settings } = usePublicSettings();
  const [formData, setFormData] = useState({
    fullName: "", phone: "", email: "", message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const { data } = await contactApi.submit(formData);
      if (data?.success || data?.success !== false) {
        setSubmitted(true);
        setFormData({ fullName: "", phone: "", email: "", message: "" });
      } else {
        setError(data?.message || "Erreur lors de l'envoi");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Erreur de connexion. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="bg-slate-950 py-16 md:py-24 relative overflow-hidden select-none border-t border-slate-900/60">
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/5 rounded-full blur-[130px] pointer-events-none" />

      <div className="w-full px-4 md:px-8 lg:px-16 2xl:px-24 relative z-10">

        <div className="text-center mb-10 md:mb-16">
          <span className="text-blue-400 font-semibold text-xs tracking-widest uppercase bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20 inline-flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            Contact
          </span>
          <h2 className="text-2xl md:text-5xl font-heading text-white tracking-tight mb-4">
            Besoin d'aide ?{' '}
            <span className="bg-linear-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">Parlons-en</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            Notre équipe est disponible pour vous accompagner dans la mise en place de votre wifizone.
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden border border-slate-900 shadow-2xl shadow-blue-950/10">

          <div className="lg:col-span-5 bg-linear-to-b from-slate-900 to-slate-950 p-8 md:p-10 flex flex-col justify-between relative border-b lg:border-b-0 lg:border-r border-slate-900">
            <div className="absolute top-0 left-0 w-full h-full bg-blue-500/2 pointer-events-none" />

            <div className="relative z-10">
              <span className="text-[10px] uppercase font-black tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-md inline-block mb-6">
                Nous contacter
              </span>
              <h3 className="text-2xl md:text-3xl font-heading text-white tracking-tight mb-4 leading-tight">
                On est là pour<br />vous aider
              </h3>
              <p className="text-slate-400 text-xs md:text-sm leading-relaxed mb-8">
                Disponible 7j/7 par WhatsApp, email ou réseaux sociaux. Réponse rapide garantie.
              </p>
            </div>

            <div className="space-y-4 relative z-10 pt-6 border-t border-slate-900/80">
              <div className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-400 group-hover:border-blue-500/30 transition-all">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">Support Live WhatsApp</span>
              </div>
              <div className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-blue-400 group-hover:border-blue-500/30 transition-all">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">{settings.supportEmail}</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-900/30 backdrop-blur-md p-8 md:p-10 relative">
            <h3 className="text-lg font-bold text-white mb-1">Envoyez-nous un message</h3>
            <p className="text-slate-500 text-xs mb-8">On vous répond dans les plus brefs délais.</p>

            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-64 flex flex-col items-center justify-center text-center space-y-3"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Send className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-white text-sm">Message envoyé avec succès !</h4>
                <p className="text-xs text-slate-400 max-w-xs">Merci pour votre intérêt. Notre équipe commerciale prendra contact avec vous rapidement.</p>
                <button onClick={() => setSubmitted(false)}
                  className="text-xs font-bold text-blue-400 hover:underline pt-2 cursor-pointer">
                  Envoyer un autre message
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Nom complet</label>
                    <input type="text" name="fullName" required value={formData.fullName}
                      onChange={handleChange} placeholder="Votre nom"
                      className="w-full bg-slate-950/60 border border-slate-900 hover:border-slate-800 focus:border-blue-500 rounded-xl py-3 px-4 text-xs font-medium text-white placeholder-slate-600 focus:outline-none transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Téléphone</label>
                    <input type="tel" name="phone" required value={formData.phone}
                      onChange={handleChange} placeholder="+XXX XX XX XX XX"
                      className="w-full bg-slate-950/60 border border-slate-900 hover:border-slate-800 focus:border-blue-500 rounded-xl py-3 px-4 text-xs font-medium text-white placeholder-slate-600 focus:outline-none transition-all" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Email</label>
                  <input type="email" name="email" required value={formData.email}
                    onChange={handleChange} placeholder="email@exemple.com"
                    className="w-full bg-slate-950/60 border border-slate-900 hover:border-slate-800 focus:border-blue-500 rounded-xl py-3 px-4 text-xs font-medium text-white placeholder-slate-600 focus:outline-none transition-all" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Message (Optionnel)</label>
                  <textarea name="message" rows="4" value={formData.message}
                    onChange={handleChange} placeholder="Décrivez votre besoin..."
                    className="w-full bg-slate-950/60 border border-slate-900 hover:border-slate-800 focus:border-blue-500 rounded-xl py-3 px-4 text-xs font-medium text-white placeholder-slate-600 focus:outline-none transition-all resize-none" />
                </div>

                <button type="submit" disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs py-3.5 rounded-xl tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]">
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Envoi en cours...</>
                  ) : (
                    <><Send className="w-3.5 h-3.5" /> Envoyer le message</>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Contact;
