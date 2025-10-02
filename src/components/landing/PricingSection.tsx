import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const PricingSection = () => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleJoinBeta = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth?tab=signup');
    }
  };

  const features = i18n.language === 'en' ? [
    'Instant group matching (5 people)',
    'Automatic bar selection',
    'Chat with your group',
    'Free during beta',
    'Priority access to new features',
    'No hidden fees'
  ] : [
    'Matching instantané (5 personnes)',
    'Sélection automatique du bar',
    'Chat avec ton groupe',
    'Gratuit pendant la beta',
    'Accès prioritaire aux nouvelles features',
    'Aucun frais caché'
  ];

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-background to-secondary/10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 sm:mb-16 animate-fade-in">
          <Badge variant="secondary" className="mb-4 text-sm px-4 py-1">
            {i18n.language === 'en' ? 'Free Beta' : 'Beta Gratuite'}
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            {i18n.language === 'en' ? (
              <>Join the <span className="text-primary">Beta</span> Now</>
            ) : (
              <>Rejoins la <span className="text-primary">Beta</span> maintenant</>
            )}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {i18n.language === 'en' 
              ? 'Get early access to Random. Free for beta testers in Paris.'
              : 'Accès anticipé à Random. Gratuit pour les beta testeurs à Paris.'
            }
          </p>
        </div>

        <div className="max-w-lg mx-auto">
          <Card className="border-2 border-primary/20 shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover-scale">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl sm:text-3xl mb-2">
                {i18n.language === 'en' ? 'Beta Access' : 'Accès Beta'}
              </CardTitle>
              <CardDescription className="text-base">
                {i18n.language === 'en' 
                  ? 'Full access during beta period'
                  : 'Accès complet pendant la période beta'
                }
              </CardDescription>
              <div className="mt-6">
                <div className="text-5xl sm:text-6xl font-bold text-primary">
                  {i18n.language === 'en' ? 'Free' : 'Gratuit'}
                </div>
                <p className="text-muted-foreground mt-2">
                  {i18n.language === 'en' ? 'During beta phase' : 'Pendant la phase beta'}
                </p>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-3 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-foreground/90">{feature}</span>
                </div>
              ))}
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pt-6">
              <Button 
                onClick={handleJoinBeta}
                size="lg" 
                className="w-full text-lg py-6 shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <Zap className="mr-2 h-5 w-5 group-hover:animate-pulse" />
                {i18n.language === 'en' ? 'Join Beta Now' : 'Rejoindre la Beta'}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                {i18n.language === 'en' 
                  ? '✨ Limited spots available in Paris'
                  : '✨ Places limitées à Paris'
                }
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
