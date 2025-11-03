import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useTranslation } from 'react-i18next';
import { useReferralProgram } from '@/hooks/useReferralProgram';
import { useAuth } from '@/contexts/AuthContext';
import { useGoogleOAuthStatus } from '@/hooks/useGoogleOAuthStatus';
import { Chrome, AlertTriangle } from 'lucide-react';

const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin'); // Controlled tab state
  const [referralCode, setReferralCode] = useState('');
  const [gender, setGender] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const { trackSignUp, trackLogin } = useAnalytics();
  const { t } = useTranslation();
  const { applyReferralCode } = useReferralProgram();
  const { signInWithGoogle } = useAuth();
  const { isEnabled: googleOAuthEnabled, loading: googleOAuthLoading } = useGoogleOAuthStatus();

  // Handle URL parameters to set the active tab
  useEffect(() => {
    const tab = searchParams.get('tab');
    const refCode = searchParams.get('ref');
    
    if (tab === 'signup' || tab === 'signin') {
      setActiveTab(tab);
    }
    
    // If a referral code is in the URL, pre-fill it
    if (refCode) {
      setReferralCode(refCode.toUpperCase());
      setActiveTab('signup'); // Force signup tab
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
            gender: gender,
            city: city,
          },
          emailRedirectTo: `${window.location.origin}/`, // Important for email confirmation
        },
      });

      if (error) {
        // Signup error
        toast({ title: t('auth.signup_error'), description: error.message, variant: 'destructive' });
      } else if (data.user && data.user.identities?.length === 0) {
        // This case might indicate email confirmation is required and user isn't auto-confirmed.
        // Signup successful
        toast({ title: t('auth.signup_success'), description: t('auth.signup_confirm') });
      } else if (data.user) {
        trackSignUp();
        
        // Apply referral code if present
        if (referralCode.trim()) {
          try {
            await applyReferralCode(referralCode.trim());
            toast({ 
              title: t('auth.referral_applied'), 
              description: t('auth.referral_helper'),
            });
          } catch (error) {
            // Don't block signup if code is invalid
            console.error('Referral code error:', error);
          }
        }
        
        // Signup auto-confirmed
        toast({ title: t('auth.signup_success'), description: t('auth.signup_auto_confirm') });
        navigate('/');
      } else {
        // Signup initiated
        toast({ title: t('auth.signup_initiated'), description: t('auth.signup_confirm') });
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
        toast({ title: t('auth.signin_error'), description: error.message, variant: 'destructive' });
      } else {
        trackLogin();
        // Signin successful
        toast({ title: t('auth.signin_success'), description: t('auth.signin_welcome') });
        navigate('/');
      }
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      toast({ 
        title: t('auth.google_signin_initiated'), 
        description: t('auth.google_redirect') 
      });
    } catch (error: any) {
      toast({ 
        title: t('auth.google_signin_error'), 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-brand-50 p-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-md animate-fade-in">
        <TabsList className="grid w-full grid-cols-2 rounded-2xl">
          <TabsTrigger value="signin">{t('auth.signin')}</TabsTrigger>
          <TabsTrigger value="signup">{t('auth.signup')}</TabsTrigger>
        </TabsList>
        <TabsContent value="signin">
          <Card className="glass-card rounded-3xl">
            <CardHeader>
              <CardTitle className="text-center gradient-text">{t('auth.signin_title')}</CardTitle>
              <CardDescription className="text-center">{t('auth.signin_desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-signin">{t('auth.email')}</Label>
                  <Input id="email-signin" type="email" placeholder={t('auth.email_placeholder')} value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-2xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signin">{t('auth.password')}</Label>
                  <Input id="password-signin" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="rounded-2xl" />
                </div>

                {googleOAuthEnabled && !googleOAuthLoading && (
                  <>
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          {t('auth.or_continue_with')}
                        </span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full rounded-2xl"
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                    >
                      <Chrome className="mr-2 h-4 w-4" />
                      {t('auth.google_signin')}
                    </Button>
                  </>
                )}

                {!googleOAuthEnabled && !googleOAuthLoading && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-2xl">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                      <p className="text-sm text-yellow-800">
                        ⚠️ La connexion Google est temporairement désactivée. Veuillez utiliser email/mot de passe.
                      </p>
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t('auth.loading') : t('auth.signin')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="signup">
          <Card className="glass-card rounded-3xl">
            <CardHeader>
              <CardTitle className="text-center gradient-text">{t('auth.signup_title')}</CardTitle>
              <CardDescription className="text-center">{t('auth.signup_desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName-signup">{t('auth.first_name')}</Label>
                  <Input id="firstName-signup" type="text" placeholder={t('auth.first_name_placeholder')} value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="rounded-2xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName-signup">{t('auth.last_name')}</Label>
                  <Input id="lastName-signup" type="text" placeholder={t('auth.last_name_placeholder')} value={lastName} onChange={(e) => setLastName(e.target.value)} required className="rounded-2xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-signup">{t('auth.email')}</Label>
                  <Input id="email-signup" type="email" placeholder={t('auth.email_placeholder')} value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-2xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup">{t('auth.password')}</Label>
                  <Input id="password-signup" type="password" placeholder={t('auth.password_placeholder')} value={password} onChange={(e) => setPassword(e.target.value)} required className="rounded-2xl" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender-signup">{t('auth.gender')}</Label>
                  <RadioGroup value={gender} onValueChange={setGender} required>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male" className="font-normal">{t('auth.male')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female" className="font-normal">{t('auth.female')}</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city-signup">{t('auth.city')}</Label>
                  <Input 
                    id="city-signup" 
                    type="text" 
                    placeholder="Ex: Paris, Lyon, Bordeaux..." 
                    value={city} 
                    onChange={(e) => setCity(e.target.value)} 
                    required 
                    className="rounded-2xl"
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground">
                    Saisissez le nom de votre ville
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referral-code">
                    {t('auth.referral_code')} <span className="text-xs text-muted-foreground">({t('common.optional', 'optionnel')})</span>
                  </Label>
                  <Input 
                    id="referral-code" 
                    type="text" 
                    placeholder={t('auth.referral_placeholder')} 
                    value={referralCode} 
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    className="rounded-2xl"
                    maxLength={10}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('auth.referral_helper')}
                  </p>
                </div>

                {googleOAuthEnabled && !googleOAuthLoading && (
                  <>
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          {t('auth.or_continue_with')}
                        </span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full rounded-2xl"
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                    >
                      <Chrome className="mr-2 h-4 w-4" />
                      {t('auth.google_signin')}
                    </Button>
                  </>
                )}

                {!googleOAuthEnabled && !googleOAuthLoading && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-2xl">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                      <p className="text-sm text-yellow-800">
                        ⚠️ La connexion Google est temporairement désactivée. Veuillez utiliser email/mot de passe.
                      </p>
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t('auth.loading') : t('auth.signup')}
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