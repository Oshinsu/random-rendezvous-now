import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBarOwner } from '@/hooks/useBarOwner';
import { BarOwnerApplication } from '@/components/bar/BarOwnerApplication';
import { Skeleton } from '@/components/ui/skeleton';
import { Building, ArrowLeft } from 'lucide-react';
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
            
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 text-left">
              <h3 className="font-semibold text-primary mb-2">Pourquoi rejoindre Random ?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>Nouveaux clients garantis</strong> - Groupes de 5 personnes chaque semaine</li>
                <li>• <strong>ROI prouvé</strong> - En moyenne 3x votre investissement mensuel</li>
                <li>• <strong>Zéro effort marketing</strong> - Nous nous occupons de tout</li>
                <li>• <strong>Analytics détaillés</strong> - Suivez vos revenus en temps réel</li>
              </ul>
            </div>
          </div>

          {/* Application Form */}
          <BarOwnerApplication />
        </div>
      </div>
    </div>
  );
}