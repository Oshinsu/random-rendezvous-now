import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Campaign {
  id: string;
  campaign_name: string;
  campaign_type: 'email' | 'push' | 'sms' | 'in_app';
  trigger_type: 'manual' | 'lifecycle' | 'segment' | 'behavior';
  target_segment_id?: string;
  target_lifecycle_stage_id?: string;
  subject?: string;
  content: string;
  channels: string[]; // ['email', 'in_app', 'push']
  status: 'draft' | 'active' | 'paused' | 'completed';
  send_at?: string;
  created_at: string;
  updated_at: string;
  segment?: {
    segment_name: string;
  };
  lifecycle_stage?: {
    stage_name: string;
  };
  stats?: {
    total_sent: number;
    opened: number;
    clicked: number;
    converted: number;
  };
}

export const useCRMCampaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('crm_campaigns')
        .select(`
          *,
          segment:crm_user_segments(segment_name),
          lifecycle_stage:crm_lifecycle_stages(stage_name)
        `)
        .order('created_at', { ascending: false });

      if (campaignsError) throw campaignsError;

      // Get stats for each campaign
      const campaignsWithStats = await Promise.all(
        (campaignsData || []).map(async (campaign) => {
          const { data: sends } = await supabase
            .from('crm_campaign_sends')
            .select('opened_at, clicked_at, converted_at')
            .eq('campaign_id', campaign.id);

          const stats = {
            total_sent: sends?.length || 0,
            opened: sends?.filter(s => s.opened_at).length || 0,
            clicked: sends?.filter(s => s.clicked_at).length || 0,
            converted: sends?.filter(s => s.converted_at).length || 0
          };

          return {
            ...campaign,
            stats
          } as Campaign;
        })
      );

      setCampaigns(campaignsWithStats);
      setError(null);
    } catch (err) {
      console.error('Error fetching CRM campaigns:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async (campaignData: Partial<Campaign>) => {
    try {
      const { data, error: createError } = await supabase
        .from('crm_campaigns')
        .insert([campaignData as any])
        .select()
        .single();

      if (createError) throw createError;

      toast({
        title: 'Campagne créée',
        description: 'La campagne a été créée avec succès'
      });

      await fetchCampaigns();
      return data;
    } catch (err) {
      console.error('Error creating campaign:', err);
      
      // ✅ PHASE 3: Message spécifique selon le type d'erreur
      let errorMessage = 'Impossible de créer la campagne';
      
      if (err instanceof Error) {
        if (err.message?.includes('policy') || err.message?.includes('permission')) {
          errorMessage = '🔒 Session expirée ou permissions insuffisantes. Veuillez vous reconnecter.';
        } else if (err.message?.includes('network') || err.message?.includes('fetch')) {
          errorMessage = 'Erreur réseau: vérifiez votre connexion';
        }
      }
      
      // Check for PostgreSQL error codes
      if ((err as any).code === '23505') {
        errorMessage = 'Une campagne avec ce nom existe déjà';
      } else if ((err as any).code === '42501') {
        errorMessage = '🔒 Accès refusé: veuillez vous reconnecter';
      }
      
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive'
      });
      throw err;
    }
  };

  const sendCampaign = async (campaignId: string, zapierWebhookUrl?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-lifecycle-campaign', {
        body: { 
          campaignId: campaignId,
          zapier_webhook_url: zapierWebhookUrl 
        }
      });

      if (error) throw error;

      toast({
        title: 'Campagne envoyée',
        description: `${data.sent} emails envoyés avec succès`
      });

      await fetchCampaigns();
      return data;
    } catch (err) {
      console.error('Error sending campaign:', err);
      toast({
        title: 'Erreur',
        description: "Impossible d'envoyer la campagne",
        variant: 'destructive'
      });
      throw err;
    }
  };

  const updateCampaignStatus = async (campaignId: string, status: Campaign['status']) => {
    try {
      const { error } = await supabase
        .from('crm_campaigns')
        .update({ status })
        .eq('id', campaignId);

      if (error) throw error;

      toast({
        title: 'Statut mis à jour',
        description: 'Le statut de la campagne a été modifié'
      });

      await fetchCampaigns();
    } catch (err) {
      console.error('Error updating campaign status:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut',
        variant: 'destructive'
      });
      throw err;
    }
  };

  const rescheduleCampaign = async (campaignId: string, newSendAt: string) => {
    try {
      const { error } = await supabase
        .from('crm_campaigns')
        .update({ send_at: newSendAt, status: 'scheduled' })
        .eq('id', campaignId);

      if (error) throw error;

      toast({
        title: 'Campagne reprogrammée',
        description: 'La date d\'envoi a été mise à jour'
      });

      await fetchCampaigns();
    } catch (err) {
      console.error('Error rescheduling campaign:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de reprogrammer la campagne',
        variant: 'destructive'
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  return { 
    campaigns, 
    loading, 
    error, 
    refetch: fetchCampaigns,
    createCampaign,
    sendCampaign,
    updateCampaignStatus,
    rescheduleCampaign
  };
};
