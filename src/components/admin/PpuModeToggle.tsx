import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Euro, Settings, CreditCard, Users, DollarSign } from 'lucide-react';
import { usePpuPayments } from '@/hooks/usePpuPayments';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export const PpuModeToggle: React.FC = () => {
  const { ppuConfig, isLoadingConfig } = usePpuPayments();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [priceInput, setPriceInput] = React.useState('0.99');

  React.useEffect(() => {
    if (ppuConfig) {
      setPriceInput(ppuConfig.priceEur.toFixed(2));
    }
  }, [ppuConfig]);

  const handleTogglePpu = async (enabled: boolean) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase.rpc('update_system_setting', {
        setting_name: 'ppu_mode_enabled',
        new_value: JSON.stringify(enabled)
      });
      
      if (error) throw error;
      
      // Force immediate cache refresh
      await queryClient.invalidateQueries({ queryKey: ['ppuConfig'] });
      
      toast.success(
        enabled 
          ? 'Mode PPU activé - Les nouveaux groupes nécessiteront un paiement'
          : 'Mode PPU désactivé - Les groupes redeviennent gratuits'
      );
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du mode PPU');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePrice = async () => {
    const priceEur = parseFloat(priceInput);
    if (isNaN(priceEur) || priceEur < 0.01 || priceEur > 50) {
      toast.error('Le prix doit être entre 0.01€ et 50€');
      return;
    }

    setIsUpdating(true);
    try {
      const priceCents = Math.round(priceEur * 100);
      const { error } = await supabase.rpc('update_system_setting', {
        setting_name: 'ppu_price_cents',
        new_value: JSON.stringify(priceCents)
      });
      
      if (error) throw error;
      
      // Force immediate cache refresh
      await queryClient.invalidateQueries({ queryKey: ['ppuConfig'] });
      
      toast.success(`Prix PPU mis à jour: ${priceEur.toFixed(2)}€`);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du prix');
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
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Mode Pay-Per-Use (PPU)
                <Badge variant={ppuConfig?.enabled ? "default" : "secondary"}>
                  {ppuConfig?.enabled ? 'Activé' : 'Désactivé'}
                </Badge>
              </CardTitle>
              <CardDescription>
                Activer ou désactiver le système de paiement pour la validation des groupes
              </CardDescription>
            </div>
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
                {ppuConfig?.enabled 
                  ? 'Les groupes complets nécessitent un paiement pour être validés'
                  : 'Les groupes sont validés gratuitement comme actuellement'
                }
              </p>
            </div>
            <Switch
              id="ppu-toggle"
              checked={ppuConfig?.enabled || false}
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
                disabled={isUpdating || priceInput === ppuConfig?.priceEur.toFixed(2)}
              >
                {isUpdating ? <LoadingSpinner className="h-4 w-4" /> : 'Mettre à jour'}
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Prix actuel: <strong>{ppuConfig?.priceEur.toFixed(2)}€</strong> par membre
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
                  {ppuConfig?.enabled 
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
                  {ppuConfig?.enabled 
                    ? `${(ppuConfig.priceEur * 5).toFixed(2)}€ par groupe validé (5 × ${ppuConfig.priceEur.toFixed(2)}€)`
                    : 'Aucun revenu généré par groupe'
                  }
                </p>
              </div>
            </div>
          </div>

          {ppuConfig?.enabled && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <h4 className="font-medium text-sm text-primary mb-2">
                ⚠️ Mode PPU activé
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Les nouveaux groupes qui atteignent 5 membres déclencheront le processus de paiement</li>
                <li>• Chaque membre aura 15 minutes pour payer {ppuConfig.priceEur.toFixed(2)}€</li>
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