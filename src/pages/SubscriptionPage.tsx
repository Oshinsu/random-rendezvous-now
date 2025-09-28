import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useBarSubscription } from "@/hooks/useBarSubscription";
import { useBarOwner } from "@/hooks/useBarOwner";
import AppLayout from "@/components/AppLayout";
import { toast } from "sonner";
import { 
  Building, 
  Crown, 
  Check, 
  Star, 
  TrendingUp, 
  Users, 
  Settings,
  CreditCard,
  Shield
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const SubscriptionPage = () => {
  const navigate = useNavigate();
  const { subscriptionStatus, isLoadingSubscription, createCheckout, manageSubscription } = useBarSubscription();
  const { barOwner, isLoadingProfile } = useBarOwner();
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);

  const handleSubscribe = async () => {
    setIsCreatingCheckout(true);
    try {
      await createCheckout.mutateAsync();
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
      await manageSubscription.mutateAsync();
      toast.success("Ouverture du portail client...", {
        description: "Gérez votre abonnement dans l'onglet qui vient de s'ouvrir."
      });
    } catch (error) {
      toast.error("Erreur lors de l'ouverture du portail client");
    }
  };

  const handleUpgradeToBarOwner = () => {
    navigate('/bar-application');
  };

  const isSubscribed = subscriptionStatus?.subscribed || false;
  const isBarOwner = barOwner?.status === 'approved';

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Mon Abonnement</h1>
            <p className="text-xl text-muted-foreground">
              Gérez votre abonnement et découvrez nos plans
            </p>
          </div>

          {/* Current Status */}
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle>Statut actuel</CardTitle>
                </div>
                {isSubscribed && (
                  <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                    <Crown className="h-3 w-3 mr-1" />
                    Actif
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingSubscription || isLoadingProfile ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span>Chargement du statut...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="font-medium">Type de compte:</p>
                      <Badge variant={isBarOwner ? "default" : "secondary"}>
                        {isBarOwner ? "Propriétaire de Bar" : "Utilisateur Standard"}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <p className="font-medium">Abonnement:</p>
                      <Badge variant={isSubscribed ? "default" : "outline"}>
                        {isSubscribed ? "Bar Manager Premium" : "Aucun abonnement"}
                      </Badge>
                    </div>
                  </div>
                  
                  {isSubscribed && subscriptionStatus?.subscription_end && (
                    <div className="space-y-2">
                      <p className="font-medium">Fin de période:</p>
                      <p className="text-muted-foreground">
                        {new Date(subscriptionStatus.subscription_end).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}

                  {isSubscribed && (
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleManageSubscription} 
                        variant="outline"
                        disabled={manageSubscription.isPending}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Gérer l'abonnement
                      </Button>
                      {isBarOwner && (
                        <Button onClick={() => navigate('/bar-dashboard')}>
                          <Building className="h-4 w-4 mr-2" />
                          Dashboard Bar
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Plans Available */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Utilisateur Standard */}
            <Card className="relative">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <CardTitle>Utilisateur Standard</CardTitle>
                </div>
                <CardDescription>
                  Parfait pour découvrir de nouveaux bars avec des amis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-3xl font-bold">Gratuit</div>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Rejoindre des groupes
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Découvrir de nouveaux bars
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Chat en groupe
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Historique des sorties
                    </li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter>
                <Badge variant="outline" className="w-full justify-center">
                  Plan actuel
                </Badge>
              </CardFooter>
            </Card>

            {/* Bar Manager Premium */}
            <Card className={`relative ${isSubscribed ? 'border-primary shadow-lg' : ''}`}>
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
                  <Building className="h-5 w-5 text-primary" />
                  <CardTitle>Bar Manager Premium</CardTitle>
                </div>
                <CardDescription>
                  Pour les propriétaires de bars qui veulent attirer plus de clients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-3xl font-bold">
                    29€<span className="text-lg font-normal text-muted-foreground">/mois</span>
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Dashboard analytics avancé
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Priorité dans l'algorithme
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Statistiques détaillées
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      Support prioritaire
                    </li>
                    <li className="flex items-center">
                      <TrendingUp className="h-4 w-4 text-primary mr-2" />
                      Jusqu'à +40% de visiteurs
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
                    className="w-full"
                    disabled={isCreatingCheckout}
                  >
                    {isCreatingCheckout ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Redirection...
                      </div>
                    ) : (
                      "S'abonner maintenant"
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>

          {/* Upgrade to Bar Owner */}
          {!isBarOwner && (
            <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Crown className="h-5 w-5 text-orange-500" />
                  <CardTitle>Vous êtes propriétaire d'un bar ?</CardTitle>
                </div>
                <CardDescription>
                  Rejoignez notre réseau de bars partenaires et attirez plus de clients !
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center space-y-2">
                    <div className="bg-orange-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                      <Users className="h-6 w-6 text-orange-600" />
                    </div>
                    <p className="font-medium">Plus de clients</p>
                    <p className="text-sm text-muted-foreground">Groupes dirigés vers votre établissement</p>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="bg-orange-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                      <TrendingUp className="h-6 w-6 text-orange-600" />
                    </div>
                    <p className="font-medium">Analytics détaillées</p>
                    <p className="text-sm text-muted-foreground">Suivez vos performances</p>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="bg-orange-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                      <Settings className="h-6 w-6 text-orange-600" />
                    </div>
                    <p className="font-medium">Gestion simplifiée</p>
                    <p className="text-sm text-muted-foreground">Dashboard intuitif</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleUpgradeToBarOwner} 
                  variant="default" 
                  className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
                >
                  Devenir Bar Partenaire
                </Button>
              </CardFooter>
            </Card>
          )}

          <Separator />

          {/* FAQ Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">Questions fréquentes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Comment fonctionne l'abonnement ?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    L'abonnement Bar Manager Premium est mensuel et sans engagement. 
                    Vous pouvez annuler à tout moment depuis votre espace client.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Puis-je changer d'avis ?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Oui ! Vous pouvez annuler votre abonnement à tout moment. 
                    Vous garderez l'accès jusqu'à la fin de votre période de facturation.
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