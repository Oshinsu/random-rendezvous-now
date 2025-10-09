import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SiteContent {
  id: string;
  content_key: string;
  content_type: 'text' | 'image' | 'json' | 'html';
  content_value: any;
  page_section: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface SiteContentContextType {
  contents: SiteContent[];
  loading: boolean;
  getContentByKey: (key: string) => SiteContent | undefined;
  getContentValue: (key: string, fallback?: string) => string;
}

const SiteContentContext = createContext<SiteContentContextType | undefined>(undefined);

export const SiteContentProvider = ({ children }: { children: ReactNode }) => {
  const [contents, setContents] = useState<SiteContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContents = async () => {
      try {
        const { data, error } = await supabase
          .from('site_content')
          .select('*')
          .order('page_section', { ascending: true })
          .order('content_key', { ascending: true });

        if (error) throw error;
        
        const transformedData = (data || []).map(item => ({
          ...item,
          content_type: item.content_type as 'text' | 'image' | 'json' | 'html'
        }));
        
        setContents(transformedData);
      } catch (error) {
        console.error('Error fetching site contents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContents();
  }, []);

  const getContentByKey = (key: string): SiteContent | undefined => {
    return contents.find(item => item.content_key === key);
  };

  const getContentValue = (key: string, fallback: string = ''): string => {
    const content = getContentByKey(key);
    if (!content) return fallback;
    
    if (content.content_type === 'text' || content.content_type === 'image') {
      return content.content_value || fallback;
    }
    
    return JSON.stringify(content.content_value) || fallback;
  };

  return (
    <SiteContentContext.Provider value={{ contents, loading, getContentByKey, getContentValue }}>
      {children}
    </SiteContentContext.Provider>
  );
};

export const useSiteContentContext = () => {
  const context = useContext(SiteContentContext);
  if (context === undefined) {
    throw new Error('useSiteContentContext must be used within a SiteContentProvider');
  }
  return context;
};
