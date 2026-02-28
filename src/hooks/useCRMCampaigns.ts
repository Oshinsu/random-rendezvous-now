import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

  /**
   * Fetch campaigns with optimized RPC (fixes N+1 query)
   * SOTA Oct 2025: PostgreSQL 16 Performance
   * Source: https://www.postgresql.org/docs/16/performance-tips.html
   */
  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      
      // Use optimized RPC function (1 query instead of N+1)
      // @ts-expect-error - RPC function added via migration, not yet in generated types
      const { data: campaignsData, error: campaignsError } = await supabase
        .rpc('get_campaigns_with_stats' as any);

      if (campaignsError) throw campaignsError;

      // Transform RPC result to match Campaign interface
      const campaignsWithStats = ((campaignsData || []) as any[]).map((campaign: any) => ({
        id: campaign.id,
        campaign_name: campaign.campaign_name,
        campaign_type: 'email' as const,
        trigger_type: 'manual' as const,
        subject: campaign.subject,
        content: campaign.content,
        channels: ['email'],
        status: campaign.status,
        send_at: campaign.send_at,
        created_at: campaign.created_at,
        updated_at: campaign.updated_at,
        target_segment_id: campaign.segment_id,
        target_lifecycle_stage_id: campaign.lifecycle_stage_id,
        segment: campaign.segment_name ? { segment_name: campaign.segment_name } : undefined,
        lifecycle_stage: campaign.lifecycle_stage_name ? { stage_name: campaign.lifecycle_stage_name } : undefined,
        stats: {
          total_sent: Number(campaign.total_sent),
          opened: Number(campaign.opened),
          clicked: Number(campaign.clicked),
          converted: Number(campaign.converted)
        }
      }));

      setCampaigns(campaignsWithStats as Campaign[]);
      setError(null);
    } catch (err) {
      console.error('Error fetching CRM campaigns:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      toast.error('Erreur lors du chargement des campagnes');
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async (campaignData: Partial<Campaign>) => {
    try {
      // ✅ PHASE 1: Normalisation - Convertir chaîne vide → null
      const normalizedData = {
        ...campaignData,
        send_at: campaignData.send_at?.trim() === '' 
          ? null 
          : campaignData.send_at
      };

      const { data, error: createError } = await supabase
        .from('crm_campaigns')
        .insert([normalizedData as any])
        .select()
        .single();

      if (createError) throw createError;

      toast.success('Campagne créée', {
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
      if ((err as any).code === '22007') {
        errorMessage = '📅 Format de date invalide. Veuillez sélectionner une date valide ou laisser vide pour envoi immédiat.';
      } else if ((err as any).code === '23505') {
        errorMessage = 'Une campagne avec ce nom existe déjà';
      } else if ((err as any).code === '42501') {
        errorMessage = '🔒 Accès refusé: veuillez vous reconnecter';
      }
      
      toast.error('Erreur', {
        description: errorMessage
      });
      throw err;
    }
  };

  const sendCampaign = async (campaignId: string, zapierWebhookUrl?: string) => {
    try {
      console.log('🚀 [sendCampaign] Starting campaign send:', { campaignId, zapierWebhookUrl });
      
      const { data, error } = await supabase.functions.invoke('send-lifecycle-campaign', {
        body: { 
          campaignId: campaignId,
          zapier_webhook_url: zapierWebhookUrl 
        }
      });

      console.log('📦 [sendCampaign] Edge function response:', { data, error });

      if (error) {
        console.error('❌ [sendCampaign] Edge function error:', error);
        throw error;
      }

      // ✅ PHASE 3: Message spécifique si 0 envois (SOTA Oct 2025)
      if (data?.sent === 0) {
        if (data?.message?.includes('No target users')) {
          toast.error('⚠️ Segment vide', {
            description: '🔍 Aucun utilisateur trouvé dans ce segment. Vérifiez les critères du segment ou recalculez les segments.'
          });
        } else {
          toast.error('⚠️ Aucun envoi', {
            description: 'Aucun utilisateur n\'a pu recevoir la campagne. Vérifiez les logs pour plus de détails.'
          });
        }
      } else {
        toast.success('Campagne envoyée', {
          description: `${data.sent || 0} emails envoyés avec succès`
        });
      }

      await fetchCampaigns();
      return data;
    } catch (err) {
      console.error('Error sending campaign:', err);
      
      // Message d'erreur générique si pas de data
      toast.error('Erreur', {
        description: "Impossible d'envoyer la campagne. Vérifiez les logs serveur."
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

      toast.success('Statut mis à jour', {
        description: 'Le statut de la campagne a été modifié'
      });

      await fetchCampaigns();
    } catch (err) {
      console.error('Error updating campaign status:', err);
      toast.error('Erreur', {
        description: 'Impossible de mettre à jour le statut'
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

      toast.success('Campagne reprogrammée', {
        description: 'La date d\'envoi a été mise à jour'
      });

      await fetchCampaigns();
    } catch (err) {
      console.error('Error rescheduling campaign:', err);
      toast.error('Erreur', {
        description: 'Impossible de reprogrammer la campagne'
      });
      throw err;
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    try {
      // Delete from queue first if present
      const { error: queueError } = await supabase
        .from('campaign_email_queue')
        .delete()
        .eq('campaign_id', campaignId);

      if (queueError) {
        console.error('Error deleting from queue:', queueError);
      }

      // Delete the campaign
      const { error } = await supabase
        .from('crm_campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;

      toast.success("Campagne supprimée", {
        description: "La campagne a été supprimée avec succès"
      });

      await fetchCampaigns();
    } catch (err) {
      console.error('Error deleting campaign:', err);
      toast.error("Erreur", {
        description: "Impossible de supprimer la campagne"
      });
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
    rescheduleCampaign,
    deleteCampaign
  };
};
