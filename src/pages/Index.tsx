
import HeroSection from "@/components/landing/HeroSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import WhyRandomSection from "@/components/landing/WhyRandomSection";
import NoMoreSection from "@/components/landing/NoMoreSection";
import FaqSection from "@/components/landing/FaqSection";
import CtaSection from "@/components/landing/CtaSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import StatsSection from "@/components/landing/StatsSection";
import PricingSection from "@/components/landing/PricingSection";
import Footer from "@/components/landing/Footer";
import LandingNavigation from "@/components/landing/LandingNavigation";
import { Helmet } from "react-helmet-async";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Random • 1 clic, 1 groupe, 1 bar | Soirées authentiques</title>
        <meta name="description" content="Random forme un groupe de 5 près de toi et choisit un bar ouvert. 1 clic pour des rencontres vraies. Beta gratuite à Paris." />
        <link rel="canonical" href={typeof window !== "undefined" ? `${window.location.origin}/` : "/"} />
        <meta property="og:title" content="Random • 1 clic, 1 groupe, 1 bar" />
        <meta property="og:description" content="Clique, on forme ton groupe de 5 et on choisit un bar près de toi." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify({
          "@context":"https://schema.org",
          "@type":"WebSite",
          "name":"Random",
          "url": typeof window !== "undefined" ? `${window.location.origin}/` : "https://random.app/",
          "description":"Random forme un groupe de 5 près de toi et choisit un bar ouvert. 1 clic pour des rencontres vraies."
        })}</script>
      </Helmet>
      
      <LandingNavigation />
      
      <main className="flex-grow">
        <HeroSection />
        <StatsSection />
        <div id="how-it-works">
          <HowItWorksSection />
        </div>
        <div id="why-random">
          <WhyRandomSection />
        </div>
        <TestimonialsSection />
        <PricingSection />
        <NoMoreSection />
        <div id="faq">
          <FaqSection />
        </div>
        <CtaSection />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
