import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBarOwner } from '@/hooks/useBarOwner';
import { MultiStepBarApplication } from '@/components/bar/MultiStepBarApplication';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Building, ArrowLeft, Users, TrendingUp, Euro, Star, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BarApplicationPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { barOwner, isLoadingProfile } = useBarOwner();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
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
            
            {/* Key Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-primary/5 border border-primary/20 rounded-lg p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">+300</div>
                <p className="text-sm text-muted-foreground">Clients/mois en moyenne</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">3x</div>
                <p className="text-sm text-muted-foreground">ROI moyen</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-1">48h</div>
                <p className="text-sm text-muted-foreground">Délai de validation</p>
              </div>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">Nouveaux clients garantis</h3>
                      <p className="text-sm text-muted-foreground">
                        Groupes de 5 personnes chaque semaine, automatiquement dirigés vers votre établissement
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">Zéro effort marketing</h3>
                      <p className="text-sm text-muted-foreground">
                        Nous nous occupons de tout : acquisition, organisation, et fidélisation des clients
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">Analytics en temps réel</h3>
                      <p className="text-sm text-muted-foreground">
                        Dashboard professionnel pour suivre vos groupes, clients et revenus générés
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">ROI prouvé</h3>
                      <p className="text-sm text-muted-foreground">
                        En moyenne 3x votre investissement mensuel dès le premier mois
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Social Proof */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="h-5 w-5 fill-primary text-primary" />
                  <Star className="h-5 w-5 fill-primary text-primary" />
                  <Star className="h-5 w-5 fill-primary text-primary" />
                  <Star className="h-5 w-5 fill-primary text-primary" />
                  <Star className="h-5 w-5 fill-primary text-primary" />
                  <span className="ml-2 font-semibold">4.9/5</span>
                  <span className="text-sm text-muted-foreground">(32 avis)</span>
                </div>
                <blockquote className="text-sm italic mb-2">
                  "Depuis qu'on est sur Random, on a +40% de nouveaux clients chaque mois. Le système est simple et efficace !"
                </blockquote>
                <p className="text-sm font-medium">
                  — Thomas M., Gérant du Café de la Bastille
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Application Form */}
          <MultiStepBarApplication />
        </div>
      </div>
    </div>
  );
}