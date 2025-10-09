import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useBarOwnerAuth = () => {
  const { user, loading: authLoading } = useAuth();
  const [isBarOwner, setIsBarOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkBarOwnerStatus = async () => {
      if (!user) {
        setIsBarOwner(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('bar_owners')
          .select('status')
          .eq('user_id', user.id)
          .eq('status', 'approved')
          .single();
        
        if (error) {
          setIsBarOwner(false);
        } else {
          setIsBarOwner(!!data);
        }
      } catch (error) {
        console.error('Error checking bar owner status:', error);
        setIsBarOwner(false);
      }
      
      setLoading(false);
    };

    if (!authLoading) {
      checkBarOwnerStatus();
    }
  }, [user, authLoading]);

  return { isBarOwner, loading: loading || authLoading };
};
