import { motion } from 'framer-motion';
import backgroundImage from '../../assets/images/hotspot_background.png';

function LeftPanel() {
  return (
    <div
      className="hidden md:flex col-span-2 items-center justify-center text-white p-8 relative bg-cover bg-center overflow-hidden"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="absolute inset-0 bg-linear-to-br from-slate-950/80 via-slate-900/70 to-slate-950/80" />

      {/* Blue accent glow */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-blue-500/15 blur-[80px]"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-orange-500/10 blur-[60px]"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Subtle top-edge light leak */}
      <div className="absolute inset-x-0 top-0 h-48 bg-linear-to-b from-blue-500/5 to-transparent" />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-white/20"
          style={{
            top: `${15 + i * 15}%`,
            left: `${10 + i * 14}%`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.1, 0.4, 0.1],
          }}
          transition={{
            duration: 3 + i * 0.8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5,
          }}
        />
      ))}

      {/* Content */}
      <motion.div
        className="text-center flex flex-col items-center max-w-sm z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, delay: 0.4, ease: "easeOut" }}
      >
       

        <h2 className="text-5xl font-bold mb-3 tracking-tight bg-linear-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
          HotspotPay
        </h2>

        <div className="w-12 h-0.5 bg-linear-to-r from-transparent via-orange-500 to-transparent mb-4" />

        <p className="text-blue-100/70 font-light text-base leading-relaxed max-w-xs">
          Connexion instantanée,<br />accès sécurisé.
        </p>

        {/* Decorative bottom stats */}
        <motion.div
          className="mt-10 flex gap-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
        >
          <div className="text-center">
            <div className="text-lg font-semibold text-white/90">10K+</div>
            <div className="text-[10px] uppercase tracking-widest text-white/30 mt-0.5">Utilisateurs</div>
          </div>
          <div className="w-px bg-white/10" />
          <div className="text-center">
            <div className="text-lg font-semibold text-white/90">99.9%</div>
            <div className="text-[10px] uppercase tracking-widest text-white/30 mt-0.5">Uptime</div>
          </div>
          <div className="w-px bg-white/10" />
          <div className="text-center">
            <div className="text-lg font-semibold text-white/90">256bit</div>
            <div className="text-[10px] uppercase tracking-widest text-white/30 mt-0.5">Encryption</div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default LeftPanel;
