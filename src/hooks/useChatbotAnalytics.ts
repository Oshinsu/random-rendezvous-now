import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ChatbotConversation {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  total_messages: number;
  total_tokens: number;
  cost_usd: number;
  satisfaction_rating: number | null;
  messages: any[];
  context_used: string | null;
}

interface ChatbotStats {
  totalConversations: number;
  totalTokens: number;
  totalCost: number;
  avgSatisfaction: number;
  avgTokensPerConversation: number;
  avgCostPerConversation: number;
}

export const useChatbotAnalytics = () => {
  const [conversations, setConversations] = useState<ChatbotConversation[]>([]);
  const [stats, setStats] = useState<ChatbotStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChatbotData();
  }, []);

  const fetchChatbotData = async () => {
    try {
      setLoading(true);

      // Fetch conversations (cast to any to bypass type checking for new table)
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('chatbot_conversations' as any)
        .select('*')
        .order('started_at', { ascending: false })
        .limit(100);

      if (conversationsError) throw conversationsError;

      setConversations((conversationsData || []) as unknown as ChatbotConversation[]);

      // Calculate stats
      if (conversationsData && conversationsData.length > 0) {
        const totalTokens = (conversationsData as any).reduce((sum: number, c: any) => sum + (c.total_tokens || 0), 0);
        const totalCost = (conversationsData as any).reduce((sum: number, c: any) => sum + parseFloat(c.cost_usd || '0'), 0);
        const ratingsCount = (conversationsData as any).filter((c: any) => c.satisfaction_rating).length;
        const totalRating = (conversationsData as any).reduce((sum: number, c: any) => sum + (c.satisfaction_rating || 0), 0);

        setStats({
          totalConversations: conversationsData.length,
          totalTokens,
          totalCost,
          avgSatisfaction: ratingsCount > 0 ? totalRating / ratingsCount : 0,
          avgTokensPerConversation: totalTokens / conversationsData.length,
          avgCostPerConversation: totalCost / conversationsData.length,
        });
      }
    } catch (error) {
      console.error('Error fetching chatbot analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConversation = async (conversation: Partial<ChatbotConversation>) => {
    try {
      const { error } = await supabase
        .from('chatbot_conversations' as any)
        .insert(conversation as any);

      if (error) throw error;
      
      await fetchChatbotData();
      return true;
    } catch (error) {
      console.error('Error saving conversation:', error);
      return false;
    }
  };

  const rateConversation = async (conversationId: string, rating: number) => {
    try {
      const { error } = await supabase
        .from('chatbot_conversations' as any)
        .update({ 
          satisfaction_rating: rating,
          ended_at: new Date().toISOString()
        } as any)
        .eq('id', conversationId);

      if (error) throw error;
      
      await fetchChatbotData();
      return true;
    } catch (error) {
      console.error('Error rating conversation:', error);
      return false;
    }
  };

  return {
    conversations,
    stats,
    loading,
    saveConversation,
    rateConversation,
    refresh: fetchChatbotData,
  };
};
