import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAnalytics } from '@/hooks/useAnalytics';
import { useAuth } from '@/contexts/AuthContext';

const AuthPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin'); // Controlled tab state
  const { trackSignUp, trackLogin } = useAnalytics();
  const { signInWithGoogle } = useAuth();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (activeTab === 'signup') {
      // Sign Up
      console.log('🔐 Attempting signup for:', email);
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
        console.error('❌ Signup error:', error);
        toast({ title: 'Erreur d\'inscription', description: error.message, variant: 'destructive' });
      } else if (data.user && data.user.identities?.length === 0) {
        // This case might indicate email confirmation is required and user isn't auto-confirmed.
        console.log('✅ Signup successful, email confirmation required');
        toast({ title: 'Inscription réussie!', description: 'Veuillez vérifier votre email pour confirmer votre compte.' });
      } else if (data.user) {
        trackSignUp();
        console.log('✅ Signup successful, user auto-confirmed');
        toast({ title: 'Inscription réussie!', description: 'Vous êtes maintenant connecté.' });
        navigate('/');
      } else {
        console.log('✅ Signup initiated, email confirmation needed');
        toast({ title: 'Inscription initiée', description: 'Veuillez vérifier votre email pour confirmer votre compte.' });
      }
    } else {
      // Sign In
      console.log('🔐 Attempting signin for:', email);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Signin error:', error);
        toast({ title: 'Erreur de connexion', description: error.message, variant: 'destructive' });
      } else {
        trackLogin();
        console.log('✅ Signin successful');
        toast({ title: 'Connexion réussie!', description: 'Bienvenue !' });
        navigate('/');
      }
    }
    setLoading(false);
  };

  const handleGoogleAuth = async () => {
    try {
      setGoogleLoading(true);
      await signInWithGoogle();
    } catch (error: any) {
      console.error('❌ Google auth error:', error);
      toast({ 
        title: 'Erreur Google', 
        description: 'Impossible de se connecter avec Google. Veuillez réessayer.', 
        variant: 'destructive' 
      });
    } finally {
      setGoogleLoading(false);
    }
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
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">ou</span>
                </div>
              </div>
              <Button 
                onClick={handleGoogleAuth}
                variant="outline" 
                className="w-full" 
                disabled={googleLoading}
              >
                {googleLoading ? (
                  'Chargement...'
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Se connecter avec Google
                  </>
                )}
              </Button>
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
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">ou</span>
                </div>
              </div>
              <Button 
                onClick={handleGoogleAuth}
                variant="outline" 
                className="w-full" 
                disabled={googleLoading}
              >
                {googleLoading ? (
                  'Chargement...'
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    S'inscrire avec Google
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuthPage;