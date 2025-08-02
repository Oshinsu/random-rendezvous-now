import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { RateLimiter, RATE_LIMITS } from '@/utils/rateLimiter';

export const useEnhancedAuth = () => {
  const { user, session, loading, signOut, signInWithGoogle } = useAuth();

  const safeSignOut = useCallback(async () => {
    // Check rate limit before signing out
    if (RateLimiter.isRateLimited('auth_signout', {
      maxAttempts: 3,
      windowMs: 60000, // 1 minute
      blockDurationMs: 30000 // 30 seconds
    })) {
      return false;
    }

    try {
      await signOut();
      return true;
    } catch (error) {
      return false;
    }
  }, [signOut]);

  const safeSignInWithGoogle = useCallback(async () => {
    // Check rate limit before Google sign in
    if (RateLimiter.isRateLimited('auth_google_signin', {
      maxAttempts: 5,
      windowMs: 300000, // 5 minutes
      blockDurationMs: 60000 // 1 minute
    })) {
      throw new Error('Too many sign-in attempts. Please wait.');
    }

    return signInWithGoogle();
  }, [signInWithGoogle]);

  return {
    user,
    session,
    loading,
    signOut: safeSignOut,
    signInWithGoogle: safeSignInWithGoogle
  };
};