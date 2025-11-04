import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SiteContent {
  id: string;
  content_key: string;
  content_type: string;
  content_value: any;
  page_section: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export type { SiteContent };

interface SiteContentContextType {
  contents: SiteContent[];
  loading: boolean;
  isSaving: boolean;
  getContent: (key: string, fallback?: string) => string;
  updateContent: (id: string, value: any) => Promise<boolean>;
  refresh: () => Promise<void>;
}

const SiteContentContext = createContext<SiteContentContextType | null>(null);

export const SiteContentProvider = ({ children }: { children: ReactNode }) => {
  const [contents, setContents] = useState<SiteContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchContents = async () => {
    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .order('page_section', { ascending: true })
        .order('content_key', { ascending: true });
      
      if (error) throw error;
      
      setContents(data || []);
    } catch (error) {
      console.error('Error fetching site content:', error);
      setContents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContents();
  }, []);

  // Mémoriser getContent pour éviter les recalculs inutiles
  const getContent = useCallback((key: string, fallback = ''): string => {
    const item = contents.find(c => c.content_key === key);
    if (!item) return fallback;
    
    // Handle JSONB values
    if (item.content_type === 'json' || item.content_type === 'jsonb') {
      // If it's already an object, stringify it
      if (typeof item.content_value === 'object') {
        return JSON.stringify(item.content_value);
      }
      return item.content_value;
    }
    
    // Handle string values (image URLs)
    if (typeof item.content_value === 'string') {
      // Remove quotes if wrapped
      try {
        const parsed = JSON.parse(item.content_value);
        return typeof parsed === 'string' ? parsed : item.content_value;
      } catch {
        return item.content_value;
      }
    }
    
    return item.content_value || fallback;
  }, [contents]);

  const updateContent = useCallback(async (id: string, contentValue: any): Promise<boolean> => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('site_content')
        .update({ content_value: contentValue, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      // Update local state immediately
      setContents(prev => 
        prev.map(item => 
          item.id === id 
            ? { ...item, content_value: contentValue, updated_at: new Date().toISOString() }
            : item
        )
      );

      return true;
    } catch (error) {
      console.error('Error updating content:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const refresh = async () => {
    setLoading(true);
    await fetchContents();
  };

  const value = useMemo(() => ({
    contents,
    loading,
    isSaving,
    getContent,
    updateContent,
    refresh
  }), [contents, loading, isSaving, getContent, updateContent]);

  return (
    <SiteContentContext.Provider value={value}>
      {children}
    </SiteContentContext.Provider>
  );
};

export const useSiteContentContext = () => {
  const context = useContext(SiteContentContext);
  if (!context) {
    throw new Error('useSiteContentContext must be used within SiteContentProvider');
  }
  return context;
};
