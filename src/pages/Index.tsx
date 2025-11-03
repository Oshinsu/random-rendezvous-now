import { lazy, Suspense, useEffect, useRef } from "react";
import { trackSectionView, trackBounce, trackCTAClick } from "@/utils/cmsTracking";
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
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  
  // Track section views
  const heroRef = useRef<HTMLDivElement>(null);
  const benefitsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const sectionTimers = new Map<string, number>();
    
    const trackSectionTime = (section: string, startTime: number) => {
      const timeSpent = Date.now() - startTime;
      trackBounce(section, timeSpent);
    };
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const section = entry.target.getAttribute('data-section');
          if (!section) return;
          
          if (entry.isIntersecting) {
            trackSectionView(section);
            sectionTimers.set(section, Date.now());
          } else {
            const startTime = sectionTimers.get(section);
            if (startTime) {
              trackSectionTime(section, startTime);
              sectionTimers.delete(section);
            }
          }
        });
      },
      { threshold: 0.5 }
    );
    
    if (heroRef.current) observer.observe(heroRef.current);
    if (benefitsRef.current) observer.observe(benefitsRef.current);
    if (ctaRef.current) observer.observe(ctaRef.current);
    
    return () => {
      observer.disconnect();
      sectionTimers.forEach((startTime, section) => {
        trackSectionTime(section, startTime);
      });
    };
  }, []);
  const handleSignOut = async () => {
    await signOut();
  };
  const handleGoToDashboard = () => {
    trackCTAClick('header', 'go_to_dashboard');
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
            <RandomLogo size={36} className="sm:w-12 sm:h-12" withAura animated={false} />
            <span className="text-xl sm:text-3xl font-signature bg-gradient-to-r from-brand-600 via-brand-500 to-brand-400 bg-clip-text text-transparent tracking-tight drop-shadow-glow-gold">
              Random
            </span>
          </div>
          {loading ? <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-amber-700 font-medium text-sm hidden xs:block">Chargement...</p>
            </div> : user ? <div className="flex items-center gap-1 sm:gap-3">
              <LanguageToggle />
              <Button onClick={handleGoToDashboard} className="bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white shadow-medium hover:scale-102 transition-all duration-300 text-xs sm:text-sm px-3 sm:px-5" size="sm">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Mon groupe
              </Button>
              <Button onClick={handleSignOut} variant="outline" className="border-neutral-300 text-neutral-700 hover:bg-neutral-50 hover:scale-102 transition-all duration-300 text-xs sm:text-sm px-2 sm:px-3 hidden sm:flex" size="sm">
                Déconnexion
              </Button>
            </div> : <div className="flex items-center gap-1 sm:gap-2">
              <LanguageToggle />
              <Button 
                asChild 
                variant="outline" 
                className="border-brand-300 text-brand-700 hover:bg-brand-50 hover:scale-102 transition-all duration-300 text-xs sm:text-sm px-3 sm:px-4" 
                size="sm"
                onClick={() => trackCTAClick('header', 'signin')}
              >
                <Link to="/auth?tab=signin">
                  Connexion
                </Link>
              </Button>
              <Button 
                asChild 
                className="bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white shadow-medium hover:scale-102 transition-all duration-300 text-xs sm:text-sm px-3 sm:px-4" 
                size="sm"
                onClick={() => trackCTAClick('header', 'signup')}
              >
                <Link to="/auth?tab=signup">
                  <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  Commencer
                </Link>
              </Button>
            </div>}
        </div>
      </header>
      <main className="flex-grow">
        <div ref={heroRef} data-section="hero">
          <HeroSection />
        </div>
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
          <div ref={benefitsRef} data-section="benefits">
            <WhyRandomSection />
          </div>
          <NoMoreSection />
          <FaqSection />
          <div ref={ctaRef} data-section="cta">
            <CtaSection />
          </div>
        </Suspense>
      </main>
      <Footer />
    </div>;
};
export default Index;