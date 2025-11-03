import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

export const useSiteContent = () => {
  const [contents, setContents] = useState<SiteContent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContents = async () => {
    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .order('page_section', { ascending: true })
        .order('content_key', { ascending: true });

      if (error) throw error;
      
      // Transformer les données pour assurer la compatibilité des types
      const transformedData = (data || []).map(item => ({
        ...item,
        content_type: item.content_type as 'text' | 'image' | 'json' | 'html'
      }));
      
      setContents(transformedData);
    } catch (error) {
      console.error('Error fetching site contents:', error);
      toast.error("Erreur", {
        description: "Impossible de charger le contenu du site"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateContent = async (id: string, contentValue: any) => {
    try {
      const { error } = await supabase
        .from('site_content')
        .update({ 
          content_value: contentValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setContents(prev => 
        prev.map(item => 
          item.id === id 
            ? { ...item, content_value: contentValue, updated_at: new Date().toISOString() }
            : item
        )
      );

      toast.success("Succès", {
        description: "Contenu mis à jour avec succès"
      });
      return true;
    } catch (error) {
      console.error('Error updating content:', error);
      toast.error("Erreur", {
        description: "Impossible de mettre à jour le contenu"
      });
      return false;
    }
  };

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

  useEffect(() => {
    fetchContents();
  }, []);

  return {
    contents,
    loading,
    updateContent,
    getContentByKey,
    getContentValue,
    refresh: fetchContents
  };
};