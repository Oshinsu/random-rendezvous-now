import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserDetails {
  user_info: {
    id: string;
    email: string;
    created_at: string;
    last_sign_in_at?: string;
    email_confirmed_at?: string;
  };
  profile: {
    first_name?: string;
    last_name?: string;
    created_at: string;
    updated_at: string;
  };
  roles: string[];
  active_groups: Array<{
    group_id: string;
    status: string;
    created_at: string;
    location_name?: string;
  }>;
  outings_history: Array<{
    bar_name: string;
    bar_address: string;
    meeting_time: string;
    completed_at: string;
    participants_count: number;
    user_rating?: number;
  }>;
  recent_messages: Array<{
    group_id: string;
    message: string;
    created_at: string;
    is_system: boolean;
  }>;
}

export const useUserDetails = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserDetails = async (userId: string): Promise<UserDetails | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc('get_user_details_admin', {
        target_user_id: userId
      });

      if (error) throw error;

      return data as unknown as UserDetails;
    } catch (err) {
      console.error('Error fetching user details:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Delete from profiles (cascades to other tables via RLS)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) throw profileError;

      // Delete from auth.users (admin function would be needed for this)
      // This would require a custom admin function to delete auth users
      
      return true;
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (userId: string, updates: { first_name?: string; last_name?: string; email?: string }) => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;

      return true;
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { fetchUserDetails, deleteUser, updateProfile, loading, error };
};