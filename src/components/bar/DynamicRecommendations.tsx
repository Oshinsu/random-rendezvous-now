import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Sparkles, TrendingUp, Clock, Users, Target, ChevronRight, AlertCircle } from 'lucide-react';
import type { BarAnalytics } from '@/hooks/useBarOwner';

interface DynamicRecommendationsProps {
  analytics: BarAnalytics[];
  avgGroupSize: number;
  roi: number;
  customerGrowth: number;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: 'growth' | 'optimization' | 'retention';
  icon: React.ReactNode;
  actionable: boolean;
  priority: number;
}

export function DynamicRecommendations({ 
  analytics, 
  avgGroupSize, 
  roi, 
  customerGrowth 
}: DynamicRecommendationsProps) {
  const generateRecommendations = (): Recommendation[] => {
    const recommendations: Recommendation[] = [];
    const currentMonth = analytics[0];
    const previousMonth = analytics[1];

    // Growth Analysis
    if (customerGrowth < 0) {
      recommendations.push({
        id: 'negative-growth',
        title: 'Alerte baisse de fréquentation',
        description: `Vous avez perdu ${Math.abs(customerGrowth).toFixed(1)}% de clients ce mois. Optimisez votre visibilité sur Random.`,
        impact: 'high',
        category: 'growth',
        icon: <AlertCircle className="h-5 w-5" />,
        actionable: true,
        priority: 1,
      });
    } else if (customerGrowth > 20) {
      recommendations.push({
        id: 'strong-growth',
        title: 'Croissance exceptionnelle !',
        description: `+${customerGrowth.toFixed(1)}% de clients ! Préparez votre équipe pour maintenir ce rythme.`,
        impact: 'high',
        category: 'growth',
        icon: <TrendingUp className="h-5 w-5" />,
        actionable: true,
        priority: 1,
      });
    }

    // ROI Analysis
    if (roi < 2) {
      recommendations.push({
        id: 'low-roi',
        title: 'Améliorez votre ROI',
        description: 'Votre ROI est en dessous de la moyenne. Augmentez votre panier moyen ou optimisez vos coûts.',
        impact: 'high',
        category: 'optimization',
        icon: <Target className="h-5 w-5" />,
        actionable: true,
        priority: 2,
      });
    } else if (roi > 5) {
      recommendations.push({
        id: 'excellent-roi',
        title: 'ROI excellent !',
        description: `Votre ROI de ${roi.toFixed(1)}x est exceptionnel. Continuez sur cette lancée !`,
        impact: 'medium',
        category: 'optimization',
        icon: <Sparkles className="h-5 w-5" />,
        actionable: false,
        priority: 3,
      });
    }

    // Group Size Analysis
    if (avgGroupSize < 4) {
      recommendations.push({
        id: 'small-groups',
        title: 'Petits groupes détectés',
        description: `Moyenne de ${avgGroupSize} pers/groupe. Proposez des offres groupes pour augmenter la taille.`,
        impact: 'medium',
        category: 'optimization',
        icon: <Users className="h-5 w-5" />,
        actionable: true,
        priority: 3,
      });
    } else if (avgGroupSize > 7) {
      recommendations.push({
        id: 'large-groups',
        title: 'Grands groupes fréquents',
        description: `Moyenne de ${avgGroupSize} pers/groupe. Assurez-vous d\'avoir l\'espace nécessaire.`,
        impact: 'medium',
        category: 'retention',
        icon: <Users className="h-5 w-5" />,
        actionable: true,
        priority: 3,
      });
    }

    // Peak Hours Analysis
    if (currentMonth?.peak_hours) {
      const peakHours = currentMonth.peak_hours as Record<string, number>;
      const maxHour = Object.entries(peakHours).reduce((a, b) => a[1] > b[1] ? a : b);
      recommendations.push({
        id: 'peak-hours',
        title: 'Optimisez vos horaires',
        description: `Pic à ${maxHour[0]}h. Renforcez votre équipe pendant ces heures.`,
        impact: 'medium',
        category: 'optimization',
        icon: <Clock className="h-5 w-5" />,
        actionable: true,
        priority: 4,
      });
    }

    // Retention Strategy
    const totalCustomers = currentMonth?.total_customers || 0;
    if (totalCustomers > 50) {
      recommendations.push({
        id: 'retention',
        title: 'Fidélisez vos clients Random',
        description: 'Avec votre volume, créez une expérience mémorable pour encourager les retours.',
        impact: 'high',
        category: 'retention',
        icon: <Star className="h-5 w-5" />,
        actionable: true,
        priority: 2,
      });
    }

    // Sort by priority
    return recommendations.sort((a, b) => a.priority - b.priority).slice(0, 4);
  };

  const recommendations = generateRecommendations();

  const getImpactColor = (impact: 'high' | 'medium' | 'low') => {
    switch (impact) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium': return 'bg-warning/10 text-warning border-warning/20';
      case 'low': return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getCategoryLabel = (category: 'growth' | 'optimization' | 'retention') => {
    switch (category) {
      case 'growth': return 'Croissance';
      case 'optimization': return 'Optimisation';
      case 'retention': return 'Fidélisation';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Recommandations personnalisées
        </CardTitle>
        <CardDescription>
          Basées sur vos données des 6 derniers mois
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.map((rec) => (
          <div 
            key={rec.id}
            className={`flex items-start gap-3 p-4 rounded-lg border transition-all hover:shadow-md ${getImpactColor(rec.impact)}`}
          >
            <div className="flex-shrink-0 mt-1">
              {rec.icon}
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{rec.title}</p>
                  <p className="text-sm opacity-90 mt-1">{rec.description}</p>
                </div>
                <Badge variant="outline" className="flex-shrink-0">
                  {getCategoryLabel(rec.category)}
                </Badge>
              </div>
              {rec.actionable && (
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  En savoir plus
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        ))}

        {recommendations.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Star className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Aucune recommandation pour le moment.</p>
            <p className="text-sm mt-1">Continuez à accumuler des données pour des insights personnalisés.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
