import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBarOwner } from '@/hooks/useBarOwner';
import { useBarSubscription } from '@/hooks/useBarSubscription';
import { Skeleton } from '@/components/ui/skeleton';
import { Building, ArrowLeft, Users, TrendingUp, Star, Euro } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function BarApplicationPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { barOwner, isLoadingProfile } = useBarOwner();
  const { createCheckout } = useBarSubscription();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/bar-auth');
    }
  }, [user, authLoading, navigate]);

  // Redirect approved bar owners to dashboard
  useEffect(() => {
    if (!isLoadingProfile && barOwner) {
      navigate('/bar-dashboard');
    }
  }, [barOwner, isLoadingProfile, navigate]);

  if (authLoading || isLoadingProfile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            <Skeleton className="h-12 w-64 mx-auto" />
            <Skeleton className="h-4 w-96 mx-auto" />
            <div className="space-y-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 space-y-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Button>
            
            <Building className="h-16 w-16 mx-auto text-primary" />
            
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight">Espace Gérant de Bar</h1>
              <p className="text-xl text-muted-foreground">
                Rejoignez Random et découvrez combien de clients nous vous envoyons chaque mois
              </p>
            </div>
            
            <div className="text-center mb-6">
              <div className="text-3xl font-bold text-primary mb-2">150€/mois</div>
              <div className="text-lg text-muted-foreground">Accès complet à Random Business</div>
            </div>

            <div className="grid gap-6 mb-8">
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Users className="h-5 w-5" />
                    Nouveaux Clients Garantis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Groupes de 5 personnes chaque semaine</li>
                    <li>• Ciblage géographique précis</li>
                    <li>• Clients pré-qualifiés et motivés</li>
                    <li>• Horaires optimisés selon votre affluence</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <TrendingUp className="h-5 w-5" />
                    ROI Prouvé
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• En moyenne 3x votre investissement mensuel</li>
                    <li>• Analytics détaillées en temps réel</li>
                    <li>• Suivi du chiffre d'affaires généré</li>
                    <li>• Rapports mensuels complets</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-orange-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-600">
                    <Star className="h-5 w-5" />
                    Service Premium
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li>• Support dédié 7j/7</li>
                    <li>• Optimisation continue de votre profil</li>
                    <li>• Accès prioritaire aux nouvelles fonctionnalités</li>
                    <li>• Annulation possible à tout moment</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Button 
                onClick={() => createCheckout.mutate()} 
                className="w-full"
                size="lg"
                disabled={createCheckout.isPending}
              >
                <Euro className="h-5 w-5 mr-2" />
                {createCheckout.isPending ? 'Chargement...' : 'Commencer l\'abonnement'}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => navigate('/bar-auth')}
                className="w-full"
              >
                J'ai déjà un compte
              </Button>
              
              <div className="text-xs text-center text-muted-foreground">
                150€/mois. Annulation possible à tout moment.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}