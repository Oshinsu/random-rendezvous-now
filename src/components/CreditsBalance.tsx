import { useUserCredits } from '@/hooks/useUserCredits';
import { Card } from '@/components/ui/card';
import { Coins } from 'lucide-react';

export const CreditsBalance = () => {
  const { credits, loading } = useUserCredits();

  if (loading) return null;

  return (
    <Card className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-200 dark:border-yellow-800">
      <div className="flex items-center gap-3">
        <Coins className="h-8 w-8 text-yellow-600 dark:text-yellow-500" />
        <div>
          <p className="text-sm text-muted-foreground">Crédits disponibles</p>
          <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
            {credits?.credits_available || 0}
          </p>
          <p className="text-xs text-muted-foreground">
            1 crédit = 1 sortie gratuite
          </p>
        </div>
      </div>
    </Card>
  );
};
