import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TestTube, Plus } from 'lucide-react';
import { useABTesting } from '@/hooks/useABTesting';
import { Skeleton } from '@/components/ui/skeleton';

export const ABTestingPanel = () => {
  const { tests, loading } = useABTesting();

  const calculateWinner = (test: any) => {
    const aConversionRate = test.variant_a_sends > 0 ? (test.variant_a_conversions / test.variant_a_sends) * 100 : 0;
    const bConversionRate = test.variant_b_sends > 0 ? (test.variant_b_conversions / test.variant_b_sends) * 100 : 0;
    return aConversionRate > bConversionRate ? 'A' : 'B';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            A/B Testing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

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
        {tests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <TestTube className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun test A/B en cours</p>
            <p className="text-sm mt-2">Créez une campagne et lancez un test A/B pour comparer les performances</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tests.map((test) => {
              const aOpenRate = test.variant_a_sends > 0 ? (test.variant_a_opens / test.variant_a_sends) * 100 : 0;
              const bOpenRate = test.variant_b_sends > 0 ? (test.variant_b_opens / test.variant_b_sends) * 100 : 0;
              const aClickRate = test.variant_a_sends > 0 ? (test.variant_a_clicks / test.variant_a_sends) * 100 : 0;
              const bClickRate = test.variant_b_sends > 0 ? (test.variant_b_clicks / test.variant_b_sends) * 100 : 0;
              const aConversionRate = test.variant_a_sends > 0 ? (test.variant_a_conversions / test.variant_a_sends) * 100 : 0;
              const bConversionRate = test.variant_b_sends > 0 ? (test.variant_b_conversions / test.variant_b_sends) * 100 : 0;
              
              const winner = test.status === 'completed' ? calculateWinner(test) : null;

              return (
                <div key={test.id} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{test.test_name}</h4>
                    <Badge variant={test.status === 'completed' ? 'default' : 'secondary'}>
                      {test.status === 'completed' ? 'Terminé' : 'En cours'}
                    </Badge>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Variant A */}
                    <div className={`p-4 border rounded-lg ${winner === 'A' ? 'border-green-500 bg-green-50/50' : ''}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h5 className="font-medium">Variant A</h5>
                          <p className="text-sm text-muted-foreground">{test.variant_a_subject}</p>
                        </div>
                        {winner === 'A' && (
                          <Badge className="bg-green-500">
                            🏆 Gagnant
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Envoyés: {test.variant_a_sends}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Ouverture</p>
                          <p className="text-lg font-bold">{aOpenRate.toFixed(1)}%</p>
                          <Progress value={aOpenRate} className="h-1 mt-1" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Clics</p>
                          <p className="text-lg font-bold">{aClickRate.toFixed(1)}%</p>
                          <Progress value={aClickRate} className="h-1 mt-1" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Conversion</p>
                          <p className="text-lg font-bold">{aConversionRate.toFixed(1)}%</p>
                          <Progress value={aConversionRate} className="h-1 mt-1" />
                        </div>
                      </div>
                    </div>

                    {/* Variant B */}
                    <div className={`p-4 border rounded-lg ${winner === 'B' ? 'border-green-500 bg-green-50/50' : ''}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h5 className="font-medium">Variant B</h5>
                          <p className="text-sm text-muted-foreground">{test.variant_b_subject}</p>
                        </div>
                        {winner === 'B' && (
                          <Badge className="bg-green-500">
                            🏆 Gagnant
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Envoyés: {test.variant_b_sends}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Ouverture</p>
                          <p className="text-lg font-bold">{bOpenRate.toFixed(1)}%</p>
                          <Progress value={bOpenRate} className="h-1 mt-1" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Clics</p>
                          <p className="text-lg font-bold">{bClickRate.toFixed(1)}%</p>
                          <Progress value={bClickRate} className="h-1 mt-1" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Conversion</p>
                          <p className="text-lg font-bold">{bConversionRate.toFixed(1)}%</p>
                          <Progress value={bConversionRate} className="h-1 mt-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
