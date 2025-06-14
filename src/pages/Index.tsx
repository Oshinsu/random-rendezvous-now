
import HeroSection from "@/components/landing/HeroSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import WhyRandomSection from "@/components/landing/WhyRandomSection";
import NoMoreSection from "@/components/landing/NoMoreSection";
import FaqSection from "@/components/landing/FaqSection";
import CtaSection from "@/components/landing/CtaSection";
import Footer from "@/components/landing/Footer";
import { useEffect } from "react";

const Index = () => {
  useEffect(() => {
    // Ensure dark mode is applied by default to the html tag if not using system preference
    // document.documentElement.classList.add('dark'); // if your tailwind.config.ts darkMode is 'class'
    // Or, if your CSS variables in :root are already for dark mode, this might not be needed.
    // My index.css sets dark theme variables directly in :root, so this should be fine.
  }, []);

  return (
    <div className="bg-background min-h-screen flex flex-col">
      <main className="flex-grow">
        <HeroSection />
        <HowItWorksSection />
        <WhyRandomSection />
        <NoMoreSection />
        <FaqSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
