import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalytics } from '@/hooks/useAnalytics';

const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin'); // Controlled tab state
  const { trackSignUp, trackLogin } = useAnalytics();

  // Handle URL parameters to set the active tab
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
      // Sign Up
      // Attempting signup
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { // This goes into raw_user_meta_data
            first_name: firstName,
            last_name: lastName,
          },
          emailRedirectTo: `${window.location.origin}/`, // Important for email confirmation
        },
      });

      if (error) {
        // Signup error
        toast({ title: 'Erreur d\'inscription', description: error.message, variant: 'destructive' });
      } else if (data.user && data.user.identities?.length === 0) {
        // This case might indicate email confirmation is required and user isn't auto-confirmed.
        // Signup successful
        toast({ title: 'Inscription réussie!', description: 'Veuillez vérifier votre email pour confirmer votre compte.' });
      } else if (data.user) {
        trackSignUp();
        // Signup auto-confirmed
        toast({ title: 'Inscription réussie!', description: 'Vous êtes maintenant connecté.' });
        navigate('/');
      } else {
        // Signup initiated
        toast({ title: 'Inscription initiée', description: 'Veuillez vérifier votre email pour confirmer votre compte.' });
      }
    } else {
      // Sign In
      // Attempting signin
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Signin error
        toast({ title: 'Erreur de connexion', description: error.message, variant: 'destructive' });
      } else {
        trackLogin();
        // Signin successful
        toast({ title: 'Connexion réussie!', description: 'Bienvenue !' });
        navigate('/');
      }
    }
    setLoading(false);
  };

  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="signin">Se Connecter</TabsTrigger>
          <TabsTrigger value="signup">S'inscrire</TabsTrigger>
        </TabsList>
        <TabsContent value="signin">
          <Card>
            <CardHeader>
              <CardTitle>Se Connecter</CardTitle>
              <CardDescription>Accédez à votre compte Random.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAuth}>
                <div className="space-y-2">
                  <Label htmlFor="email-signin">Email</Label>
                  <Input id="email-signin" type="email" placeholder="vous@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2 mt-4">
                  <Label htmlFor="password-signin">Mot de passe</Label>
                  <Input id="password-signin" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full mt-6" disabled={loading}>
                  {loading ? 'Chargement...' : 'Se Connecter'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="signup">
          <Card>
            <CardHeader>
              <CardTitle>S'inscrire</CardTitle>
              <CardDescription>Créez un nouveau compte Random pour commencer l'aventure.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAuth}>
                <div className="space-y-2">
                  <Label htmlFor="firstName-signup">Prénom</Label>
                  <Input id="firstName-signup" type="text" placeholder="Votre prénom" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div className="space-y-2 mt-4">
                  <Label htmlFor="lastName-signup">Nom</Label>
                  <Input id="lastName-signup" type="text" placeholder="Votre nom" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
                <div className="space-y-2 mt-4">
                  <Label htmlFor="email-signup">Email</Label>
                  <Input id="email-signup" type="email" placeholder="vous@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2 mt-4">
                  <Label htmlFor="password-signup">Mot de passe</Label>
                  <Input id="password-signup" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full mt-6" disabled={loading}>
                  {loading ? 'Chargement...' : 'S\'inscrire'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuthPage;