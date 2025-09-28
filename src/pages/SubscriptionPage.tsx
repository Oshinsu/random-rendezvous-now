import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import AppLayout from "@/components/AppLayout";
import { toast } from "sonner";
import { 
  Crown, 
  Check, 
  Star, 
  Zap, 
  Users, 
  Calendar,
  Shield,
  Infinity,
  Clock
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const SubscriptionPage = () => {
  const navigate = useNavigate();
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);

  // TODO: Implement user subscription hook when available
  const isSubscribed = false; // Replace with actual subscription status
  
  const handleSubscribe = async () => {
    setIsCreatingCheckout(true);
    try {
      // TODO: Call user subscription checkout
      toast.success("Redirection vers le paiement...", {
        description: "Vous allez être redirigé vers Stripe pour finaliser votre abonnement."
      });
    } catch (error) {
      toast.error("Erreur lors de la création de la session de paiement");
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      // TODO: Call user subscription management
      toast.success("Ouverture du portail client...", {
        description: "Gérez votre abonnement dans l'onglet qui vient de s'ouvrir."
      });
    } catch (error) {
      toast.error("Erreur lors de l'ouverture du portail client");
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Random Premium</h1>
            <p className="text-xl text-muted-foreground">
              Débloquez tout le potentiel de Random avec un accès illimité
            </p>
          </div>

          {/* Current Status */}
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle>Votre abonnement</CardTitle>
                </div>
                {isSubscribed && (
                  <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                    <Crown className="h-3 w-3 mr-1" />
                    Premium Actif
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Statut:</span>
                  <Badge variant={isSubscribed ? "default" : "outline"}>
                    {isSubscribed ? "Premium" : "Gratuit"}
                  </Badge>
                </div>
                
                {isSubscribed && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Prochaine facturation:</span>
                      <span className="text-muted-foreground">15 novembre 2024</span>
                    </div>
                    <Button 
                      onClick={handleManageSubscription} 
                      variant="outline"
                      className="w-full"
                    >
                      Gérer mon abonnement
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Plans Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Plan Gratuit */}
            <Card className={`relative ${!isSubscribed ? 'border-primary/20' : ''}`}>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <CardTitle>Plan Gratuit</CardTitle>
                </div>
                <CardDescription>
                  Parfait pour découvrir Random
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-3xl font-bold">0€<span className="text-lg font-normal text-muted-foreground">/mois</span></div>
                  <ul className="space-y-3">
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-3" />
                      <span className="text-sm">1 groupe actif à la fois</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-3" />
                      <span className="text-sm">2 groupes planifiés max</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-3" />
                      <span className="text-sm">Chat en groupe</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-3" />
                      <span className="text-sm">Historique des sorties</span>
                    </li>
                    <li className="flex items-center text-muted-foreground">
                      <Clock className="h-4 w-4 mr-3" />
                      <span className="text-sm">Attente standard</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter>
                {!isSubscribed ? (
                  <Badge variant="default" className="w-full justify-center">
                    Plan actuel
                  </Badge>
                ) : (
                  <Badge variant="outline" className="w-full justify-center">
                    Ancien plan
                  </Badge>
                )}
              </CardFooter>
            </Card>

            {/* Plan Premium */}
            <Card className={`relative ${isSubscribed ? 'border-primary shadow-lg' : 'border-primary/50'}`}>
              {!isSubscribed && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
                    <Star className="h-3 w-3 mr-1" />
                    Recommandé
                  </Badge>
                </div>
              )}
              
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Crown className="h-5 w-5 text-primary" />
                  <CardTitle className="text-primary">Random Premium</CardTitle>
                </div>
                <CardDescription>
                  Accès illimité à toutes les fonctionnalités
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-3xl font-bold text-primary">
                    3,99€<span className="text-lg font-normal text-muted-foreground">/mois</span>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-center">
                      <Infinity className="h-4 w-4 text-primary mr-3" />
                      <span className="text-sm font-medium">Groupes illimités</span>
                    </li>
                    <li className="flex items-center">
                      <Calendar className="h-4 w-4 text-primary mr-3" />
                      <span className="text-sm font-medium">Planification illimitée</span>
                    </li>
                    <li className="flex items-center">
                      <Zap className="h-4 w-4 text-primary mr-3" />
                      <span className="text-sm font-medium">Priorité dans les groupes</span>
                    </li>
                    <li className="flex items-center">
                      <Star className="h-4 w-4 text-primary mr-3" />
                      <span className="text-sm font-medium">Accès anticipé aux nouveautés</span>
                    </li>
                    <li className="flex items-center">
                      <Shield className="h-4 w-4 text-primary mr-3" />
                      <span className="text-sm font-medium">Support prioritaire</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-3" />
                      <span className="text-sm">Toutes les fonctionnalités gratuites</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter>
                {isSubscribed ? (
                  <Badge className="w-full justify-center bg-green-100 text-green-800 border-green-200">
                    <Crown className="h-3 w-3 mr-1" />
                    Abonnement actif
                  </Badge>
                ) : (
                  <Button 
                    onClick={handleSubscribe} 
                    className="w-full bg-gradient-to-r from-primary to-primary/80"
                    disabled={isCreatingCheckout}
                  >
                    {isCreatingCheckout ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Redirection...
                      </div>
                    ) : (
                      <>
                        <Crown className="h-4 w-4 mr-2" />
                        Passer au Premium
                      </>
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>

          <Separator />

          {/* Benefits Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">Pourquoi choisir Premium ?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center">
                    <Infinity className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Sans limites</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Créez et rejoignez autant de groupes que vous voulez, planifiez vos sorties à l'avance.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Priorité</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Accès prioritaire aux groupes populaires et aux meilleurs créneaux.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center">
                    <Star className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Exclusivité</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Découvrez les nouvelles fonctionnalités en avant-première et profitez d'un support dédié.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">Questions fréquentes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Puis-je annuler à tout moment ?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Oui ! Votre abonnement Premium est sans engagement. Vous pouvez l'annuler à tout moment 
                    et continuer à profiter des avantages jusqu'à la fin de votre période payée.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Que se passe-t-il si j'annule ?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Vous revenez automatiquement au plan gratuit à la fin de votre période de facturation. 
                    Vos données et historique sont conservés.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Y a-t-il une période d'essai ?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Nous offrons une garantie de remboursement de 7 jours. 
                    Si vous n'êtes pas satisfait, contactez-nous pour un remboursement complet.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Comment gérer mon abonnement ?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Une fois abonné, vous pouvez gérer votre abonnement directement depuis cette page 
                    ou via le portail client sécurisé de Stripe.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default SubscriptionPage;