import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TestTube, Plus } from 'lucide-react';

interface ABTestVariant {
  id: string;
  name: string;
  subject: string;
  content: string;
  sent: number;
  opened: number;
  clicked: number;
  converted: number;
}

export const ABTestingPanel = () => {
  const [variants, setVariants] = useState<ABTestVariant[]>([
    {
      id: '1',
      name: 'Variant A',
      subject: 'Bienvenue sur Random !',
      content: 'Content A...',
      sent: 100,
      opened: 45,
      clicked: 12,
      converted: 5
    },
    {
      id: '2',
      name: 'Variant B',
      subject: 'Commence ton aventure Random 🎉',
      content: 'Content B...',
      sent: 100,
      opened: 52,
      clicked: 18,
      converted: 8
    }
  ]);

  const calculateWinner = () => {
    const scores = variants.map(v => ({
      id: v.id,
      score: (v.converted / v.sent) * 100
    }));
    return scores.sort((a, b) => b.score - a.score)[0]?.id;
  };

  const winnerId = calculateWinner();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              A/B Testing
            </CardTitle>
            <CardDescription>
              Compare différentes versions de tes campagnes
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Test
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {variants.map((variant) => {
            const openRate = (variant.opened / variant.sent) * 100;
            const clickRate = (variant.clicked / variant.sent) * 100;
            const conversionRate = (variant.converted / variant.sent) * 100;
            const isWinner = variant.id === winnerId;

            return (
              <div key={variant.id} className={`p-4 border rounded-lg ${isWinner ? 'border-green-500 bg-green-50/50' : ''}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold">{variant.name}</h4>
                    <p className="text-sm text-muted-foreground">{variant.subject}</p>
                  </div>
                  {isWinner && (
                    <Badge className="bg-green-500">
                      🏆 Gagnant
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Envoyés</p>
                    <p className="text-lg font-bold">{variant.sent}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Ouverture</p>
                    <p className="text-lg font-bold">{openRate.toFixed(1)}%</p>
                    <Progress value={openRate} className="h-1 mt-1" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Clics</p>
                    <p className="text-lg font-bold">{clickRate.toFixed(1)}%</p>
                    <Progress value={clickRate} className="h-1 mt-1" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Conversion</p>
                    <p className="text-lg font-bold">{conversionRate.toFixed(1)}%</p>
                    <Progress value={conversionRate} className="h-1 mt-1" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
