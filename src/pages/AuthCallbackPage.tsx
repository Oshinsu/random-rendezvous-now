import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('AuthCallbackPage: Starting auth callback handling');
      console.log('Current URL:', window.location.href);
      
      try {
        // Extract OAuth parameters
        const { searchParams } = new URL(window.location.href);
        const code = searchParams.get('code');
        const error_code = searchParams.get('error_code');
        const error_description = searchParams.get('error_description');
        
        // Handle OAuth errors
        if (error_code) {
          console.error('OAuth error:', error_code, error_description);
          toast({
            title: "Erreur d'authentification",
            description: error_description || 'Échec de la connexion OAuth',
            variant: "destructive",
          });
          navigate('/auth');
          return;
        }
        
        // Exchange PKCE code for session
        if (code) {
          console.log('🔐 Exchanging code for session...');
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (error) {
            console.error('Code exchange error:', error);
            toast({
              title: "Erreur d'authentification",
              description: error.message,
              variant: "destructive",
            });
            navigate('/auth');
            return;
          }
          
          if (data.session) {
            console.log('✅ Session created successfully');
            toast({
              title: "Bienvenue !",
              description: "Connexion Google réussie.",
            });
            navigate('/dashboard');
            return;
          }
        }
        
        // Fallback: Try getSession()
        console.log('⚠️ No code in URL, falling back to getSession()');
        const { data, error } = await supabase.auth.getSession();
        
        if (data.session) {
          toast({
            title: "Bienvenue !",
            description: "Connexion réussie.",
          });
          navigate('/dashboard');
        } else {
          console.log('❌ No session found, redirecting to auth');
          navigate('/auth');
        }
      } catch (error) {
        console.error('Unexpected error during auth callback:', error);
        toast({
          title: "Erreur",
          description: "Une erreur inattendue s'est produite.",
          variant: "destructive",
        });
        navigate('/auth');
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;