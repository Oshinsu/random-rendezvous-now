import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Coffee, BarChart3, Euro } from 'lucide-react';

const BarAuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');

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
        toast.success('Inscription réussie ! Redirection vers votre espace...');
        navigate('/bar-dashboard');
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
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <BarChart3 className="h-5 w-5" />
                  Analytics Détaillées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Nombre exact de clients Random amenés</li>
                  <li>• Évolution mensuelle des groupes</li>
                  <li>• Heures de pointe d'affluence</li>
                  <li>• Impact financier estimé</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <Euro className="h-5 w-5" />
                  ROI Transparent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• Calcul précis du chiffre d'affaires généré</li>
                  <li>• Comparaison coût/bénéfice</li>
                  <li>• Preuves concrètes de la valeur ajoutée</li>
                  <li>• Rapports mensuels détaillés</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <Coffee className="h-5 w-5" />
                  Essai Gratuit 30 Jours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">0€</div>
                  <div className="text-sm text-muted-foreground">pendant 30 jours</div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Puis 150€/mois - Annulable à tout moment
                  </div>
                </div>
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
                    <CardTitle>Créer un compte</CardTitle>
                    <CardDescription>
                      Commencez votre essai gratuit de 30 jours
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
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Création...' : 'Commencer l\'essai gratuit'}
                      </Button>
                    </form>
                    <div className="text-xs text-center text-muted-foreground mt-4">
                      En créant un compte, vous acceptez nos conditions d'utilisation.
                      Pas de frais pendant 30 jours.
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