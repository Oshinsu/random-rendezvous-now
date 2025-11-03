import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NotificationTypeConfig } from '@/hooks/useNotificationTypesConfig';
import { Beaker, Plus, Trophy } from 'lucide-react';

interface NotificationVariantsABProps {
  notification: NotificationTypeConfig;
}

export const NotificationVariantsAB = ({ notification }: NotificationVariantsABProps) => {
  const variants = Object.keys(notification.default_copy || {});
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Beaker className="h-4 w-4" />
            Variantes A/B
          </CardTitle>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Ajouter variante
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {variants.map((variant, index) => (
          <div
            key={variant}
            className="flex items-center justify-between p-3 bg-muted rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                {String.fromCharCode(65 + index)}
              </div>
              <div>
                <p className="text-sm font-medium">{variant}</p>
                <p className="text-xs text-muted-foreground">
                  {notification.default_copy?.[variant]?.title?.substring(0, 30) || 'Sans titre'}...
                </p>
              </div>
            </div>
            {variant === 'default' && (
              <Badge variant="secondary" className="gap-1">
                <Trophy className="h-3 w-3" />
                Active
              </Badge>
            )}
          </div>
        ))}

        {variants.length === 1 && (
          <div className="text-center py-4 text-muted-foreground">
            <Beaker className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aucun test A/B actif</p>
            <p className="text-xs mt-1">
              Ajoute des variantes pour tester différents messages
            </p>
          </div>
        )}

        <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">
            💡 Best Practice
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300">
            Teste 2-3 variantes avec au moins 1000 envois avant de déclarer un
            gagnant. Focus sur : titre, emojis, et CTA.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
