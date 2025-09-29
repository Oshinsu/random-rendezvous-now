import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Coffee, BarChart3, Euro, Users, TrendingUp, Star } from 'lucide-react';
import { useBarSubscription } from '@/hooks/useBarSubscription';

const BarAuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  const { createCheckout, isLoadingSubscription } = useBarSubscription();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'signup' || tab === 'signin') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (activeTab === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
          emailRedirectTo: `${window.location.origin}/bar-dashboard`,
        },
      });

      if (error) {
        toast.error('Erreur lors de l\'inscription: ' + error.message);
      } else if (data.user && data.user.identities?.length === 0) {
        toast.success('Inscription réussie ! Vérifiez votre email pour confirmer votre compte.');
      } else if (data.user) {
        toast.success('Inscription réussie ! Activez votre abonnement pour accéder à toutes les fonctionnalités.');
        // Après inscription, lancer directement l'abonnement
        handleSubscribe();
      } else {
        toast.success('Inscription initialisée ! Vérifiez votre email pour confirmer votre compte.');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error('Erreur de connexion: ' + error.message);
      } else {
        toast.success('Connexion réussie ! Bienvenue dans votre espace gérant.');
        navigate('/bar-dashboard');
      }
    }
    setLoading(false);
  };

  const handleSubscribe = () => {
    createCheckout.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-red-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center py-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <Building className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Random Business</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Espace dédié aux gérants de bar - Découvrez l'impact de Random sur votre établissement
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Benefits Section */}
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="text-3xl font-bold text-primary mb-2">150€/mois</div>
              <div className="text-lg text-muted-foreground">Accès complet à Random Business</div>
              <div className="text-sm text-green-600 font-medium">✓ Essai gratuit 30 jours</div>
            </div>

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

          {/* Auth Form */}
          <div className="max-w-md mx-auto w-full">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Se connecter</TabsTrigger>
                <TabsTrigger value="signup">S'inscrire</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <Card>
                  <CardHeader>
                    <CardTitle>Connexion Gérant</CardTitle>
                    <CardDescription>
                      Accédez à votre tableau de bord d'analytics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAuth} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email-signin">Email</Label>
                        <Input 
                          id="email-signin" 
                          type="email" 
                          placeholder="votre@email.com"
                          value={email} 
                          onChange={(e) => setEmail(e.target.value)} 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password-signin">Mot de passe</Label>
                        <Input 
                          id="password-signin" 
                          type="password" 
                          value={password} 
                          onChange={(e) => setPassword(e.target.value)} 
                          required 
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Connexion...' : 'Se connecter'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="signup">
                <Card>
                  <CardHeader>
                    <CardTitle>Rejoignez Random Business</CardTitle>
                    <CardDescription>
                      Créez votre compte et commencez à recevoir de nouveaux clients dès maintenant
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAuth} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName-signup">Prénom</Label>
                          <Input 
                            id="firstName-signup" 
                            type="text" 
                            placeholder="Votre prénom"
                            value={firstName} 
                            onChange={(e) => setFirstName(e.target.value)} 
                            required 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName-signup">Nom</Label>
                          <Input 
                            id="lastName-signup" 
                            type="text" 
                            placeholder="Votre nom"
                            value={lastName} 
                            onChange={(e) => setLastName(e.target.value)} 
                            required 
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email-signup">Email</Label>
                        <Input 
                          id="email-signup" 
                          type="email" 
                          placeholder="votre@email.com"
                          value={email} 
                          onChange={(e) => setEmail(e.target.value)} 
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password-signup">Mot de passe</Label>
                        <Input 
                          id="password-signup" 
                          type="password" 
                          placeholder="Choisissez un mot de passe"
                          value={password} 
                          onChange={(e) => setPassword(e.target.value)} 
                          required 
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={loading || createCheckout.isPending}>
                        {loading ? 'Création du compte...' : 'Créer mon compte et m\'abonner'}
                      </Button>
                    </form>
                    <div className="text-xs text-center text-muted-foreground mt-4">
                      En créant un compte, vous acceptez nos conditions d'utilisation.
                      Essai gratuit de 30 jours, puis 150€/mois.
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarAuthPage;