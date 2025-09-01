import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MessageData {
  id: string;
  group_id: string;
  user_id: string;
  message: string;
  created_at: string;
  is_system: boolean;
  reactions?: any;
  user_profile?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  group_info?: {
    status: string;
    location_name?: string;
  };
}

export const useAdminMessages = () => {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = async (filters?: { search?: string; isSystem?: boolean; groupId?: string }) => {
    try {
      setLoading(true);
      
      // Fetch messages first
      let query = supabase
        .from('group_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filters?.search) {
        query = query.ilike('message', `%${filters.search}%`);
      }

      if (filters?.isSystem !== undefined) {
        query = query.eq('is_system', filters.isSystem);
      }

      if (filters?.groupId) {
        query = query.eq('group_id', filters.groupId);
      }

      const { data: messagesData, error: messagesError } = await query;
      if (messagesError) throw messagesError;

      if (!messagesData) {
        setMessages([]);
        return;
      }

      // Get unique user and group IDs
      const userIds = [...new Set(messagesData.map(m => m.user_id))];
      const groupIds = [...new Set(messagesData.map(m => m.group_id))];

      // Fetch profiles and groups data
      const [profilesResult, groupsResult] = await Promise.all([
        supabase.from('profiles').select('id, first_name, last_name, email').in('id', userIds),
        supabase.from('groups').select('id, status, location_name').in('id', groupIds)
      ]);

      const profiles = profilesResult.data || [];
      const groups = groupsResult.data || [];

      // Combine data
      const enrichedMessages = messagesData.map(message => ({
        ...message,
        user_profile: profiles.find(p => p.id === message.user_id) || null,
        group_info: groups.find(g => g.id === message.group_id) || null
      }));

      setMessages(enrichedMessages as MessageData[]);
      setError(null);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('group_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      // Remove from local state
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      return true;
    } catch (err) {
      console.error('Error deleting message:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  const updateMessage = async (messageId: string, newMessage: string) => {
    try {
      const { error } = await supabase
        .from('group_messages')
        .update({ message: newMessage })
        .eq('id', messageId);

      if (error) throw error;

      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, message: newMessage } : msg
      ));
      return true;
    } catch (err) {
      console.error('Error updating message:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  return { messages, loading, error, fetchMessages, deleteMessage, updateMessage };
};