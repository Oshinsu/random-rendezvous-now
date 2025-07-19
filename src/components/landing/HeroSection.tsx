
import { Button } from "@/components/ui/button";
import { Zap, Heart, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleMainAction = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  return (
    <section className="relative py-20 md:py-32 bg-gradient-to-br from-white via-amber-50/50 to-orange-100/30 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-400/5 to-orange-500/5 animate-pulse"></div>
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-gradient-to-br from-amber-300/20 to-orange-400/20 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-br from-orange-300/15 to-amber-400/15 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
      
      <div className="container mx-auto px-6 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-playfair font-bold mb-8 tracking-tight leading-tight">
            Random: <span className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-700 bg-clip-text text-transparent">Fini</span> les Soirées Plates
          </h1>
          
          <p className="text-xl md:text-2xl text-neutral-600 mb-6 leading-relaxed font-light">
            L'app qui révolutionne tes sorties. Un clic, 4 inconnus, 1 bar surprise.
          </p>
          
          <p className="text-lg md:text-xl text-neutral-500 mb-12 max-w-3xl mx-auto font-medium">
            <span className="font-semibold text-amber-700">100% gratuit</span> · 
            <span className="font-semibold text-orange-700"> Totalement spontané</span> · 
            <span className="font-semibold text-amber-800"> Vraies rencontres</span>
          </p>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mb-12">
            <Button 
              onClick={handleMainAction}
              size="lg" 
              className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:via-orange-600 hover:to-amber-700 text-white font-bold px-12 py-6 text-xl w-full sm:w-auto transform hover:scale-110 transition-all duration-500 shadow-intense hover:shadow-glow-strong group rounded-2xl"
            >
              <Zap className="mr-3 h-6 w-6 group-hover:animate-bounce" />
              {user ? 'Chercher un groupe' : 'Tenter l\'Aventure'}
            </Button>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-3xl border border-amber-200/50 hover:bg-white/80 transition-all duration-300 group">
              <div className="flex justify-center mb-4">
                <Users className="h-8 w-8 text-amber-600 group-hover:animate-pulse" />
              </div>
              <p className="text-3xl font-bold text-amber-700 mb-2">500+</p>
              <p className="text-sm text-neutral-600 font-medium">Aventuriers actifs</p>
            </div>
            
            <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-3xl border border-orange-200/50 hover:bg-white/80 transition-all duration-300 group">
              <div className="flex justify-center mb-4">
                <Heart className="h-8 w-8 text-orange-600 group-hover:animate-pulse" />
              </div>
              <p className="text-3xl font-bold text-orange-700 mb-2">95%</p>
              <p className="text-sm text-neutral-600 font-medium">Satisfaction garantie</p>
            </div>
            
            <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-3xl border border-amber-200/50 hover:bg-white/80 transition-all duration-300 group">
              <div className="flex justify-center mb-4">
                <Zap className="h-8 w-8 text-amber-600 group-hover:animate-pulse" />
              </div>
              <p className="text-3xl font-bold text-amber-700 mb-2">2h</p>
              <p className="text-sm text-neutral-600 font-medium">Temps d'attente moyen</p>
            </div>
          </div>

          <div className="mt-12">
            <p className="text-sm text-neutral-500 mb-4 font-medium">
              {user ? '🎲 Votre prochaine aventure Random vous attend' : '✨ Rejoignez l\'aventure dès maintenant'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
