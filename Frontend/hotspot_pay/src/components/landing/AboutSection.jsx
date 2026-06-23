import { motion } from "framer-motion";
import { Info, Image as ImageIcon, Quote } from "lucide-react";
import { usePublicSettings } from "../../context/PublicSettingsContext";

function AboutSection() {
  const { settings } = usePublicSettings();

  if (!settings.aboutTitle && !settings.aboutDescription) return null;

  return (
    <section id="about" className="bg-slate-950 py-24 relative overflow-hidden select-none border-t border-slate-900/60">
      <div className="absolute top-1/3 left-0 w-96 h-96 bg-blue-600/5 rounded-full blur-[130px] pointer-events-none" />

      <div className="w-full px-4 md:px-8 lg:px-16 2xl:px-24 relative z-10">
        {/* EN-TÊTE */}
        <div className="text-center mb-16">
          <span className="text-blue-400 font-semibold text-xs tracking-widest uppercase bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20 inline-flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            À propos
          </span>
          <h2 className="text-3xl md:text-5xl font-heading text-white tracking-tight mb-4">
            {settings.aboutTitle && (
              <>
                {settings.aboutTitle}{' '}
                <span className="bg-linear-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">
                  {settings.aboutSubtitle || ''}
                </span>
              </>
            )}
          </h2>
          {settings.aboutDescription && (
            <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
              {settings.aboutDescription}
            </p>
          )}
        </div>

        {/* PHOTOS */}
        {settings.aboutPhotos && settings.aboutPhotos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {settings.aboutPhotos.filter(Boolean).map((photo, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="relative group rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/30 aspect-4/3"
              >
                <img
                  src={photo}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.parentElement.querySelector('.fallback')?.classList.remove('hidden')
                  }}
                />
                <div className="fallback hidden absolute inset-0 flex items-center justify-center bg-slate-900/80">
                  <ImageIcon className="w-8 h-8 text-slate-600" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </div>
        )}

        {/* Citation */}
        <div className="mt-16 max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-4">
            <Quote className="w-5 h-5" />
          </div>
          <blockquote className="text-sm md:text-base text-slate-400 leading-relaxed italic">
            HotspotPay rend la monétisation WiFi accessible à tous, partout en Afrique.
          </blockquote>
        </div>
      </div>
    </section>
  );
}

export default AboutSection;
