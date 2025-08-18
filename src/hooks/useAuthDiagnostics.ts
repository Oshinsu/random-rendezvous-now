import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface AuthDiagnosticsData {
  // Context state
  contextUser: any;
  contextSession: boolean;
  
  // Supabase direct state
  supabaseUser: any;
  supabaseSession: boolean;
  
  // Errors
  userError?: string;
  sessionError?: string;
  rlsError?: string;
  
  // Test results
  rlsTest?: number | null;
  authKeysCount: number;
  
  // Status
  isDesynchronized: boolean;
  timestamp: string;
  
  // General error
  error?: string;
}

export const useAuthDiagnostics = () => {
  const { user, session } = useAuth();
  const [diagnostics, setDiagnostics] = useState<AuthDiagnosticsData | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    console.log('🔍 === DIAGNOSTIC D\'AUTHENTIFICATION ===');
    
    try {
      // 1. État du contexte AuthContext
      console.log('📱 AuthContext State:');
      console.log('  - user:', user ? `${user.id} (${user.email})` : 'null');
      console.log('  - session:', session ? 'présente' : 'null');
      
      // 2. Vérification directe Supabase
      const { data: { user: supabaseUser }, error: userError } = await supabase.auth.getUser();
      const { data: { session: supabaseSession }, error: sessionError } = await supabase.auth.getSession();
      
      console.log('🔗 Supabase Direct:');
      console.log('  - supabase.auth.getUser():', supabaseUser ? `${supabaseUser.id}` : 'null', userError ? `ERROR: ${userError.message}` : '');
      console.log('  - supabase.auth.getSession():', supabaseSession ? 'présente' : 'null', sessionError ? `ERROR: ${sessionError.message}` : '');
      
      // 3. Test RLS avec auth.uid()
      const { data: rlsTest, error: rlsError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      console.log('🛡️ Test RLS (profiles):', rlsTest ? `${rlsTest.length} résultats` : 'null', rlsError ? `ERROR: ${rlsError.message}` : 'OK');
      
      // 4. localStorage inspection
      const authKeys = Object.keys(localStorage).filter(key => key.includes('auth'));
      console.log('💾 LocalStorage auth keys:', authKeys.length, authKeys);
      
      // 5. Détection de désynchronisation
      const hasContextAuth = !!(user && session);
      const hasSupabaseAuth = !!(supabaseUser && supabaseSession);
      const isDesynchronized = hasContextAuth !== hasSupabaseAuth;
      
      if (isDesynchronized) {
        console.log('⚠️ DÉSYNCHRONISATION DÉTECTÉE!');
        console.log(`  - Context: ${hasContextAuth ? 'Authentifié' : 'Non authentifié'}`);
        console.log(`  - Supabase: ${hasSupabaseAuth ? 'Authentifié' : 'Non authentifié'}`);
      }
      
      // Stocker les résultats
      const diagnosticsData: AuthDiagnosticsData = {
        contextUser: user,
        contextSession: !!session,
        supabaseUser,
        supabaseSession: !!supabaseSession,
        userError: userError?.message,
        sessionError: sessionError?.message,
        rlsTest: rlsTest ? rlsTest.length : null,
        rlsError: rlsError?.message,
        authKeysCount: authKeys.length,
        isDesynchronized,
        timestamp: new Date().toLocaleTimeString()
      };
      
      setDiagnostics(diagnosticsData);
      return diagnosticsData;
      
    } catch (error) {
      console.error('❌ Erreur lors du diagnostic:', error);
      const errorDiagnostics: AuthDiagnosticsData = {
        contextUser: user,
        contextSession: !!session,
        supabaseUser: null,
        supabaseSession: false,
        authKeysCount: 0,
        isDesynchronized: false,
        timestamp: new Date().toLocaleTimeString(),
        error: String(error)
      };
      setDiagnostics(errorDiagnostics);
      return errorDiagnostics;
    } finally {
      setIsRunning(false);
    }
  };

  // Auto-run diagnostics when auth state changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      runDiagnostics();
    }, 500); // Small delay to let auth settle

    return () => clearTimeout(timeoutId);
  }, [user, session]);

  const clearSessionData = async () => {
    try {
      console.log('🧹 Clearing all auth session data...');
      
      // 1. Clear localStorage auth data
      const authKeys = Object.keys(localStorage).filter(key => key.includes('auth'));
      authKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`  - Removed: ${key}`);
      });
      
      // 2. Clear Supabase session
      await supabase.auth.signOut();
      console.log('  - Signed out from Supabase');
      
      // 3. Clear auth cookies
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        if (name.includes('auth') || name.includes('supabase')) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          console.log(`  - Cleared cookie: ${name}`);
        }
      });
      
      console.log('✅ Session data cleared successfully');
      return true;
    } catch (error) {
      console.error('❌ Error clearing session data:', error);
      return false;
    }
  };

  return {
    diagnostics,
    isRunning,
    runDiagnostics,
    clearSessionData,
    
    // Helper flags
    hasDesynchronization: diagnostics?.isDesynchronized || false,
    hasRLSError: !!diagnostics?.rlsError,
    hasAuthError: !!(diagnostics?.userError || diagnostics?.sessionError),
    isAuthWorking: !!(diagnostics?.contextUser && diagnostics?.supabaseUser && !diagnostics?.rlsError),
  };
};