import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserData {
  id: string;
  profile?: {
    first_name?: string;
    last_name?: string;
  };
}

interface GenderStats {
  hommes: number;
  femmes: number;
  doutes: number;
  total: number;
}

interface GenderResult {
  user_id: string;
  gender: 'homme' | 'femme' | 'doute';
  confidence: number;
  reasoning?: string;
}

export const useGenderDetection = () => {
  const [loading, setLoading] = useState(false);
  const [genderStats, setGenderStats] = useState<GenderStats>({
    hommes: 0,
    femmes: 0,
    doutes: 0,
    total: 0
  });
  const [detailedResults, setDetailedResults] = useState<GenderResult[]>([]);

  const detectGenders = async (users: UserData[]) => {
    if (users.length === 0) {
      setGenderStats({ hommes: 0, femmes: 0, doutes: 0, total: 0 });
      return null;
    }

    setLoading(true);
    try {
      const payload = users.map(u => ({
        user_id: u.id,
        first_name: u.profile?.first_name || '',
        last_name: u.profile?.last_name || ''
      }));

      const { data, error } = await supabase.functions.invoke('detect-user-gender', {
        body: { users: payload }
      });

      if (error) {
        console.error('Gender detection error:', error);
        throw error;
      }

      const results = data.results as GenderResult[];
      setDetailedResults(results);

      // Aggregate statistics
      const stats = results.reduce((acc, r) => {
        if (r.gender === 'homme') acc.hommes++;
        else if (r.gender === 'femme') acc.femmes++;
        else acc.doutes++;
        acc.total++;
        return acc;
      }, { hommes: 0, femmes: 0, doutes: 0, total: 0 });

      setGenderStats(stats);
      return results;

    } catch (err) {
      console.error('Gender detection error:', err);
      
      // Fallback: all users as 'doute'
      const fallbackStats = {
        hommes: 0,
        femmes: 0,
        doutes: users.length,
        total: users.length
      };
      setGenderStats(fallbackStats);
      
      toast.error('Détection de genre temporairement indisponible', {
        description: 'Tous les utilisateurs sont marqués comme "doute"'
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getGenderForUser = (userId: string): 'homme' | 'femme' | 'doute' | null => {
    const result = detailedResults.find(r => r.user_id === userId);
    return result?.gender || null;
  };

  return { 
    detectGenders, 
    genderStats, 
    detailedResults,
    getGenderForUser,
    loading 
  };
};
