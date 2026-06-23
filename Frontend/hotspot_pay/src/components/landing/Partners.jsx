import { motion } from "framer-motion";

import mtnLogo from "../../assets/logos/mtn.jpg";
import orangeLogo from "../../assets/logos/orange.png";
import camtelLogo from "../../assets/logos/camtel.png";
import starlinkLogo from "../../assets/logos/starlink.png";

const logos = [
  { name: "MTN", url: mtnLogo },
  { name: "Orange Money", url: orangeLogo },
  { name: "Camtel", url: camtelLogo },
  { name: "Starlink", url: starlinkLogo },
];

const infiniteLogos = [...logos, ...logos, ...logos, ...logos];

function Partners() {
  return (
    <section id="partners" className="bg-slate-950 py-14 border-y border-slate-900/60 overflow-hidden w-full select-none relative">
      <div className="w-full px-4 md:px-8 lg:px-16 2xl:px-24 text-center mb-10">
        <p className="text-xs font-bold uppercase tracking-widest bg-linear-to-r from-slate-500 to-slate-400 bg-clip-text text-transparent">
          Réseaux & Opérateurs pris en charge
        </p>
      </div>

      <div className="relative w-full flex overflow-hidden before:absolute before:left-0 before:top-0 before:z-10 before:h-full before:w-24 before:bg-linear-to-r before:from-slate-950 before:to-transparent after:absolute after:right-0 after:top-0 after:z-10 after:h-full after:w-24 after:bg-linear-to-l after:from-slate-950 after:to-transparent">
        <motion.div
          className="flex space-x-16 items-center whitespace-nowrap min-w-full"
          animate={{ x: [0, "-50%"] }}
          transition={{ ease: "linear", duration: 25, repeat: Infinity }}
        >
          {infiniteLogos.map((logo, index) => (
            <div
              key={index}
              className="shrink-0 flex items-center justify-center w-36 h-12 grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer group relative"
            >
              <img
                src={logo.url}
                alt={`${logo.name} logo`}
                className="max-w-full max-h-full object-contain filter brightness-110 group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-blue-500/5 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default Partners;
