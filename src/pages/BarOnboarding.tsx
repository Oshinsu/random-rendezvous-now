import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, Euro, Users, TrendingUp, CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function BarOnboarding() {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: <Users className="h-8 w-8 text-blue-500" />,
      title: "Nouveaux clients garantis",
      description: "Recevez automatiquement des groupes de 5 personnes qui cherchent un bar"
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-green-500" />,
      title: "Analytics en temps réel",
      description: "Suivez précisément combien de clients Random vous amène chaque mois"
    },
    {
      icon: <Euro className="h-8 w-8 text-yellow-500" />,
      title: "ROI immédiat",
      description: "150€/mois largement rentabilisé dès les premiers groupes"
    }
  ];

  const features = [
    "Dashboard analytics complet",
    "Suivi du chiffre d'affaires généré",
    "Statistiques de fréquentation",
    "Comparaison mensuelle",
    "Support dédié 7j/7",
    "Aucun engagement"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Building className="h-16 w-16 mx-auto mb-6 text-blue-600" />
          <h1 className="text-4xl font-bold mb-4">Rejoignez Random Business</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transformez votre bar en destination incontournable et découvrez combien de clients nous vous amenons chaque mois
          </p>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {benefits.map((benefit, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="mb-4">{benefit.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main CTA Card */}
        <Card className="bg-white shadow-xl border-0">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl mb-2">
              🎉 Offre de lancement spéciale
            </CardTitle>
            <CardDescription className="text-lg">
              <strong className="text-2xl text-green-600">30 jours d'essai gratuit</strong><br />
              Puis seulement 150€/mois - sans engagement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Features list */}
            <div>
              <h4 className="font-semibold mb-4 text-center">Ce qui est inclus :</h4>
              <div className="grid md:grid-cols-2 gap-3">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ROI Example */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <h4 className="font-semibold text-green-800 mb-3">Exemple concret de ROI :</h4>
                <div className="space-y-2 text-sm text-green-700">
                  <div className="flex justify-between">
                    <span>Random vous amène 50 clients/mois</span>
                    <span className="font-semibold">+1 250€ de CA</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Coût Random</span>
                    <span>-150€</span>
                  </div>
                  <div className="border-t border-green-200 pt-2 flex justify-between font-bold">
                    <span>Bénéfice net</span>
                    <span className="text-green-800">+1 100€/mois</span>
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-3 italic">
                  *Basé sur une consommation moyenne de 25€ par personne
                </p>
              </CardContent>
            </Card>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button 
                onClick={() => navigate('/bar-dashboard')}
                className="flex-1 h-12 text-lg"
              >
                Commencer l'essai gratuit
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate('/contact')}
                className="flex-1 h-12"
              >
                Questions ? Nous contacter
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Aucune carte de crédit requise pour l'essai. Annulation possible à tout moment.
            </p>
          </CardContent>
        </Card>

        {/* Trust indicators */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Déjà <strong>50+ bars partenaires</strong> font confiance à Random
          </p>
          <div className="flex justify-center items-center gap-6 opacity-60">
            <span className="text-sm">⭐⭐⭐⭐⭐ 4.8/5</span>
            <span className="text-sm">•</span>
            <span className="text-sm">Support réactif</span>
            <span className="text-sm">•</span>
            <span className="text-sm">Paiement sécurisé</span>
          </div>
        </div>
      </div>
    </div>
  );
}