import { usePublicSettings, PublicSettingsProvider } from '../../context/PublicSettingsContext'
import NavBar from "../../components/layouts/NavBar";
import Footer from "../../components/layouts/Footer";
import ScrollToTop from '../../components/ui/ScrollToTop';
import HeroesPage from '../../components/landing/HeroesPage';
import Partners from "../../components/landing/Partners";
import Features from "../../components/landing/FeaturesList";
import HowItWorks from "../../components/landing/HowItWorks";
import Pricing from "../../components/landing/Pricing";
import FAQ from "../../components/landing/FAQ";
import Contact from "../../components/landing/Contact";

function LandingContent() {
  const { settings } = usePublicSettings()

  // Mode maintenance
  if (settings.maintenanceMode) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-950 text-white select-none font-sans">
        <NavBar />
        <main className="flex-1 pt-20 bg-slate-950 flex items-center justify-center">
          <div className="text-center space-y-4 px-6">
            <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <h1 className="text-2xl font-heading text-white">Site en maintenance</h1>
            <p className="text-sm text-slate-400 max-w-md">Nous effectuons des opérations de maintenance. Revenez dans quelques instants.</p>
          </div>
        </main>
        <ScrollToTop />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white select-none font-sans">
      <NavBar />

      <main className="flex-1 pt-20 bg-slate-950">
        <HeroesPage />

        <Partners />

        <Features />

        <HowItWorks />

        <Pricing />

        <FAQ />

        <Contact />
      </main>

      <Footer />
      <ScrollToTop />
    </div>
  );
}

function LandingPage() {
  return (
    <PublicSettingsProvider>
      <LandingContent />
    </PublicSettingsProvider>
  );
}

export default LandingPage;