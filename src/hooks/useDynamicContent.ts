import { useSiteContentContext } from '@/contexts/SiteContentContext';

// Hook simplifié pour récupérer le contenu dynamique dans les composants
export const useDynamicContent = () => {
  const { getContentValue, loading } = useSiteContentContext();

  return {
    getContent: (key: string, fallback: string = '') => {
      if (loading) return fallback;
      return getContentValue(key, fallback);
    },
    loading
  };
};