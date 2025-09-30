import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Euro, Settings, CreditCard, Users, DollarSign, RefreshCw } from 'lucide-react';
import { usePpuPayments } from '@/hooks/usePpuPayments';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export const PpuModeToggle: React.FC = () => {
  const { ppuConfig, isLoadingConfig, refetchConfig } = usePpuPayments();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [priceInput, setPriceInput] = React.useState('0.99');
  const [lastSync, setLastSync] = React.useState<Date>(new Date());
  
  // Local optimistic state
  const [optimisticEnabled, setOptimisticEnabled] = React.useState<boolean | null>(null);
  const [optimisticPrice, setOptimisticPrice] = React.useState<number | null>(null);
  
  // Use optimistic values if available, otherwise use server values
  const displayEnabled = optimisticEnabled !== null ? optimisticEnabled : ppuConfig.enabled;
  const displayPrice = optimisticPrice !== null ? optimisticPrice : ppuConfig.priceEur;

  React.useEffect(() => {
    setPriceInput(displayPrice.toFixed(2));
    if (ppuConfig) {
      setLastSync(new Date());
    }
  }, [displayPrice, ppuConfig]);

  const handleManualRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    setIsRefreshing(true);
    try {
      await refetchConfig();
      setLastSync(new Date());
      toast.success('Configuration actualisée');
    } catch (error) {
      console.error('Error refreshing config:', error);
      toast.error("Erreur lors de l'actualisation");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTogglePpu = async (enabled: boolean) => {
    console.log('🎚️ Toggle PPU:', enabled);
    // Optimistic update - change UI immediately
    setOptimisticEnabled(enabled);
    
    try {
      setIsUpdating(true);
      
      // Update cache optimistically
      queryClient.setQueryData(['ppuConfig'], (old: any) => ({
        ...old,
        enabled
      }));
      
      const { error } = await supabase.rpc('update_system_setting', {
        setting_name: 'ppu_mode_enabled',
        new_value: JSON.stringify([enabled])
      });
      
      if (error) throw error;
      
      // Force immediate refetch after successful update
      await refetchConfig();
      setLastSync(new Date());
      
      toast.success(
        enabled 
          ? 'Mode PPU activé - Les groupes complets devront payer avant validation'
          : 'Mode PPU désactivé - Les groupes sont validés gratuitement'
      );
      
      // Clear optimistic state on success
      setOptimisticEnabled(null);
    } catch (error) {
      console.error('❌ Error toggling PPU:', error);
      toast.error('Erreur lors du changement de mode PPU');
      
      // Rollback optimistic update on error
      setOptimisticEnabled(null);
      await queryClient.invalidateQueries({ queryKey: ['ppuConfig'] });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePrice = async () => {
    const priceEur = parseFloat(priceInput);
    
    if (isNaN(priceEur) || priceEur <= 0) {
      toast.error('Prix invalide');
      return;
    }
    
    const priceCents = Math.round(priceEur * 100);
    console.log('💰 Updating price to:', priceEur, 'EUR (', priceCents, 'cents)');
    
    // Optimistic update - change UI immediately
    setOptimisticPrice(priceEur);
    
    try {
      setIsUpdating(true);
      
      // Update cache optimistically
      queryClient.setQueryData(['ppuConfig'], (old: any) => ({
        ...old,
        priceEur
      }));
      
      const { error } = await supabase.rpc('update_system_setting', {
        setting_name: 'ppu_price_cents',
        new_value: JSON.stringify([priceCents])
      });
      
      if (error) throw error;
      
      // Force immediate refetch after successful update
      await refetchConfig();
      setLastSync(new Date());
      
      toast.success(`Prix PPU mis à jour: ${priceEur.toFixed(2)}€`);
      
      // Clear optimistic state on success
      setOptimisticPrice(null);
    } catch (error) {
      console.error('❌ Error updating PPU price:', error);
      toast.error('Erreur lors de la mise à jour du prix');
      
      // Rollback optimistic update on error
      setOptimisticPrice(null);
      await queryClient.invalidateQueries({ queryKey: ['ppuConfig'] });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoadingConfig) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Toggle Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Mode Pay-Per-Use (PPU)
                  <Badge variant={displayEnabled ? "default" : "secondary"}>
                    {displayEnabled ? 'Activé' : 'Désactivé'}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Activer ou désactiver le système de paiement pour la validation des groupes
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Dernière synchro: {lastSync.toLocaleTimeString()}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Toggle Switch */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div>
              <Label htmlFor="ppu-toggle" className="text-base font-medium">
                Mode PPU
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                {displayEnabled 
                  ? 'Les groupes complets nécessitent un paiement pour être validés'
                  : 'Les groupes sont validés gratuitement comme actuellement'
                }
              </p>
            </div>
            <Switch
              id="ppu-toggle"
              checked={displayEnabled}
              onCheckedChange={handleTogglePpu}
              disabled={isUpdating}
            />
          </div>

          {/* Price Configuration */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Euro className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="price-input" className="text-base font-medium">
                Prix par membre
              </Label>
            </div>
            
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Input
                  id="price-input"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="50"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  €
                </span>
              </div>
              <Button 
                onClick={handleUpdatePrice}
                disabled={isUpdating || priceInput === displayPrice.toFixed(2)}
              >
                {isUpdating ? <LoadingSpinner className="h-4 w-4" /> : 'Mettre à jour'}
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Prix actuel: <strong>{displayPrice.toFixed(2)}€</strong> par membre
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Status and Impact Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Impact du mode PPU
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
              <Users className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Expérience utilisateur</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {displayEnabled 
                    ? 'Les groupes complets passent en "attente de paiement" pendant 15min'
                    : 'Les groupes complets sont directement confirmés et un bar est assigné'
                  }
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm">Revenus</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {displayEnabled 
                    ? `${(displayPrice * 5).toFixed(2)}€ par groupe validé (5 × ${displayPrice.toFixed(2)}€)`
                    : 'Aucun revenu généré par groupe'
                  }
                </p>
              </div>
            </div>
          </div>

          {displayEnabled && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <h4 className="font-medium text-sm text-primary mb-2">
                ⚠️ Mode PPU activé
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Les nouveaux groupes qui atteignent 5 membres déclencheront le processus de paiement</li>
                <li>• Chaque membre aura 15 minutes pour payer {displayPrice.toFixed(2)}€</li>
                <li>• Si tous les membres payent, le bar est automatiquement assigné</li>
                <li>• Si le délai expire, le groupe est annulé</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};