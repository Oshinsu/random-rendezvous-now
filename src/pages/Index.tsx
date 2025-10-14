import { lazy, Suspense } from "react";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import Footer from "@/components/landing/Footer";

// Lazy load below-the-fold sections
const WhyRandomSection = lazy(() => import("@/components/landing/WhyRandomSection"));
const NoMoreSection = lazy(() => import("@/components/landing/NoMoreSection"));
const FaqSection = lazy(() => import("@/components/landing/FaqSection"));
const CtaSection = lazy(() => import("@/components/landing/CtaSection"));
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, Star } from "lucide-react";
import RandomLogo from "@/components/RandomLogo";
import LanguageToggle from "@/components/LanguageToggle";
import ScrollProgressBar from "@/components/ScrollProgressBar";
import { Helmet } from "react-helmet-async";
const Index = () => {
  const {
    user,
    signOut,
    loading
  } = useAuth();
  const navigate = useNavigate();
  const handleSignOut = async () => {
    await signOut();
  };
  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };
  return <div className="bg-gradient-to-br from-white via-amber-50/30 to-amber-100/20 min-h-screen flex flex-col bg-pattern">
      <ScrollProgressBar />
      <Helmet>
        <title>Random • 1 clic, 1 groupe, 1 bar | Soirées authentiques</title>
        <meta name="description" content="Random forme un groupe de 5 près de toi et choisit un bar ouvert. 1 clic pour des rencontres vraies. Beta gratuite à Paris." />
        <link rel="canonical" href={typeof window !== "undefined" ? `${window.location.origin}/` : "/"} />
        
        {/* Performance optimizations */}
        <link rel="preconnect" href="https://xhrievvdnajvylyrowwu.supabase.co" />
        <link rel="dns-prefetch" href="https://xhrievvdnajvylyrowwu.supabase.co" />
        
        <meta property="og:title" content="Random • 1 clic, 1 groupe, 1 bar" />
        <meta property="og:description" content="Clique, on forme ton groupe de 5 et on choisit un bar près de toi." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Random",
          "url": typeof window !== "undefined" ? `${window.location.origin}/` : "https://random.app/",
          "description": "Random forme un groupe de 5 près de toi et choisit un bar ouvert. 1 clic pour des rencontres vraies."
        })}</script>
      </Helmet>
      <header className="p-3 sm:p-4 glass-enhanced sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center max-w-7xl">
          <div className="flex items-center space-x-2 sm:space-x-3 group cursor-pointer">
            <RandomLogo size={36} className="sm:w-12 sm:h-12 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" withAura />
            <span className="text-xl sm:text-3xl font-signature bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400 bg-clip-text text-transparent tracking-tight drop-shadow-glow-gold">
              Random
            </span>
          </div>
          {loading ? <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-amber-700 font-medium text-sm hidden xs:block">Chargement...</p>
            </div> : user ? <div className="flex items-center gap-1 sm:gap-3">
              <LanguageToggle />
              <div className="hidden md:flex items-center space-x-2 bg-amber-50 px-3 py-2 rounded-xl border border-amber-200">
                <Star className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-amber-700 font-medium">
                  {user.user_metadata?.first_name || user.email}
                </span>
              </div>
              <Button onClick={handleGoToDashboard} className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg transform hover:scale-105 transition-all duration-300 text-xs sm:text-sm px-2 sm:px-4" size="sm">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Chercher un </span>Groupe
              </Button>
              <Button onClick={handleSignOut} variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50 transform hover:scale-105 transition-all duration-300 text-xs sm:text-sm px-2 sm:px-4" size="sm">
                <span className="hidden xs:inline">Déconnexion</span>
                <span className="xs:hidden">✕</span>
              </Button>
            </div> : <div className="flex items-center gap-1 sm:gap-2">
              <LanguageToggle />
              <Button asChild variant="ghost" className="text-amber-700 hover:bg-amber-50 text-xs sm:text-sm px-2 sm:px-3" size="sm">
                
              </Button>
              <Button asChild variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50 transform hover:scale-105 transition-all duration-300 text-xs sm:text-sm px-2 sm:px-3" size="sm">
                <Link to="/auth?tab=signin">
                  <span className="hidden sm:inline">Connexion</span>
                  <span className="sm:hidden">👤</span>
                </Link>
              </Button>
              <Button asChild className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg transform hover:scale-105 transition-all duration-300 text-xs sm:text-sm px-2 sm:px-3" size="sm">
                <Link to="/auth?tab=signup">
                  <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1" />
                  <span className="hidden sm:inline">Inscription</span>
                  <span className="sm:hidden">⚡</span>
                </Link>
              </Button>
            </div>}
        </div>
      </header>
      <main className="flex-grow">
        <HeroSection />
        <HowItWorksSection />
        
        <Suspense fallback={
          <div className="py-20 bg-gradient-to-br from-white via-brand-50/10 to-white">
            <div className="container mx-auto px-4 max-w-7xl">
              <div className="h-12 bg-muted/30 rounded-xl animate-pulse mb-8 max-w-2xl mx-auto"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded-3xl bg-muted/20 h-96 animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
        }>
          <WhyRandomSection />
          <NoMoreSection />
          <FaqSection />
          <CtaSection />
        </Suspense>
      </main>
      <Footer />
    </div>;
};
export default Index;