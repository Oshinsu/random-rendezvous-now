import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface BarOwner {
  id: string;
  user_id: string;
  business_name: string;
  contact_email: string;
  contact_phone?: string;
  bar_place_id?: string;
  bar_name: string;
  bar_address: string;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  verification_documents: any;
  created_at: string;
  updated_at: string;
  approved_at?: string;
  approved_by?: string;
}

// BarSubscription is now managed exclusively by Stripe
// No local table needed - use useBarSubscription hook instead

export interface BarAnalytics {
  id: string;
  bar_owner_id: string;
  report_month: string;
  total_groups: number;
  total_customers: number;
  estimated_revenue_eur: number;
  peak_hours: any;
  weekly_breakdown: any;
  generated_at: string;
}

export const useBarOwner = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get current user's bar owner profile
  const { data: barOwner, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['barOwner', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('bar_owners')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as BarOwner | null;
    },
    enabled: !!user,
  });

  // Subscription is now managed exclusively by Stripe
  // Use useBarSubscription hook instead for subscription data

  // Get bar analytics
  const { data: analytics, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['barAnalytics', barOwner?.id],
    queryFn: async () => {
      if (!barOwner) return [];
      
      const { data, error } = await supabase
        .from('bar_analytics_reports')
        .select('*')
        .eq('bar_owner_id', barOwner.id)
        .order('report_month', { ascending: false })
        .limit(12); // Last 12 months
      
      if (error) throw error;
      return data as BarAnalytics[];
    },
    enabled: !!barOwner,
  });

  // Apply to become a bar owner
  const applyAsBarOwner = useMutation({
    mutationFn: async (applicationData: {
      business_name: string;
      contact_email: string;
      contact_phone?: string;
      bar_name: string;
      bar_address: string;
      bar_place_id?: string;
      why_join?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('bar_owners')
        .insert({
          user_id: user.id,
          ...applicationData,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barOwner'] });
      toast.success('Votre demande a été envoyée ! Nous la traiterons sous 48h.');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de l\'envoi de la demande: ' + error.message);
    },
  });

  // Update bar owner profile
  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<BarOwner>) => {
      if (!barOwner) throw new Error('No bar owner profile found');
      
      const { data, error } = await supabase
        .from('bar_owners')
        .update(updates)
        .eq('id', barOwner.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barOwner'] });
      toast.success('Profil mis à jour avec succès');
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la mise à jour: ' + error.message);
    },
  });

  return {
    barOwner,
    analytics,
    isLoadingProfile,
    isLoadingAnalytics,
    applyAsBarOwner,
    updateProfile,
    isApproved: barOwner?.status === 'approved',
  };
};