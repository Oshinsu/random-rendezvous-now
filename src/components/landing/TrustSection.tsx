import { Shield, Users, MapPin, AlertTriangle, Clock } from "lucide-react";
import { useEffect, useRef } from "react";
import { pushEvent } from "@/utils/marketingAnalytics";

const TrustSection = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  const sentRef = useRef(false);

  useEffect(() => {
    if (!ref.current || sentRef.current) return;
    const el = ref.current;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !sentRef.current) {
          pushEvent('view_trust_block');
          sentRef.current = true;
          obs.disconnect();
        }
      });
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-12 sm:py-16 md:py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold text-center mb-3 sm:mb-4">
          Safe <span className="text-primary">par design</span>
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground text-center mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
          Random n’est pas un service de dating. Ici, on se retrouve en groupe pour des rencontres sociales.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="p-4 sm:p-6 rounded-xl border bg-card shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-primary"><Users className="w-5 h-5" /><span className="font-semibold">Groupe de 5</span></div>
            <p className="text-sm text-muted-foreground">Toujours à plusieurs — confort et dynamique sociale.</p>
          </div>
          <div className="p-4 sm:p-6 rounded-xl border bg-card shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-primary"><MapPin className="w-5 h-5" /><span className="font-semibold">Bars publics</span></div>
            <p className="text-sm text-muted-foreground">Des lieux ouverts et vérifiés, proches de toi.</p>
          </div>
          <div className="p-4 sm:p-6 rounded-xl border bg-card shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-primary"><AlertTriangle className="w-5 h-5" /><span className="font-semibold">Signalement 1‑tap</span></div>
            <p className="text-sm text-muted-foreground">Bouton de report et modération en moins de 24h.</p>
          </div>
          <div className="p-4 sm:p-6 rounded-xl border bg-card shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-primary"><Shield className="w-5 h-5" /><span className="font-semibold">18+</span></div>
            <p className="text-sm text-muted-foreground">Communauté adulte, respect et bienveillance.</p>
          </div>
        </div>
        <div className="mt-6 text-center text-xs sm:text-sm text-muted-foreground flex items-center justify-center gap-2">
          <Clock className="w-4 h-4 text-primary" /> Créneaux forts : <span className="font-medium">19h30–22h</span> (Random Hour)
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
