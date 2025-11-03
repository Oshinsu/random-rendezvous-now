import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lightbulb, TrendingUp, MapPin, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface GeographicData {
  location_name: string;
  group_count: number;
  success_rate: number;
}

interface HeatmapData {
  day_of_week: number;
  hour_of_day: number;
  group_count: number;
  conversion_rate: number;
}

interface FunnelData {
  stage: string;
  count: number;
  drop_off_rate: number;
}

interface GroupsInsightsPanelProps {
  geographic: GeographicData[];
  heatmap: HeatmapData[];
  funnel: FunnelData[];
}

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export const GroupsInsightsPanel = ({ geographic, heatmap, funnel }: GroupsInsightsPanelProps) => {
  // Find peak hours
  const peakHours = [...heatmap]
    .sort((a, b) => b.group_count - a.group_count)
    .slice(0, 3);

  // Find underserved zones (low count but good conversion)
  const underservedZones = geographic
    .filter(z => z.group_count < 5 && z.success_rate > 40)
    .slice(0, 3);

  // Find oversaturated zones (high count but low conversion)
  const oversaturatedZones = geographic
    .filter(z => z.group_count > 10 && z.success_rate < 30)
    .slice(0, 3);

  // Analyze conversion funnel
  const criticalDropOff = funnel.find(f => f.drop_off_rate >= 50);
  const avgConversionRate = funnel[funnel.length - 1]?.count / (funnel[0]?.count || 1) * 100;

  // Generate insights
  const insights = [];

  // Temporal insights
  if (peakHours.length > 0) {
    const topPeak = peakHours[0];
    insights.push({
      type: 'temporal',
      icon: Clock,
      color: 'text-blue-500',
      title: 'Créneau Peak Identifié',
      description: `${DAYS[topPeak.day_of_week]} à ${topPeak.hour_of_day}h : ${topPeak.group_count} groupes créés avec ${topPeak.conversion_rate}% de conversion.`,
      recommendation: `Envoyer des notifications push ${DAYS[topPeak.day_of_week]} vers ${topPeak.hour_of_day - 1}h pour maximiser les créations.`,
      priority: 'high',
    });
  }

  // Geographic insights - underserved
  if (underservedZones.length > 0) {
    insights.push({
      type: 'geographic',
      icon: MapPin,
      color: 'text-green-500',
      title: 'Zones à Fort Potentiel',
      description: `${underservedZones.map(z => z.location_name).join(', ')} ont un taux de succès > 40% mais peu d'activité.`,
      recommendation: 'Cibler ces zones avec des campagnes marketing pour augmenter le volume.',
      priority: 'medium',
    });
  }

  // Geographic insights - oversaturated
  if (oversaturatedZones.length > 0) {
    insights.push({
      type: 'geographic',
      icon: AlertTriangle,
      color: 'text-orange-500',
      title: 'Zones Sur-Saturées',
      description: `${oversaturatedZones.map(z => z.location_name).join(', ')} ont beaucoup de groupes mais < 30% de conversion.`,
      recommendation: 'Optimiser l\'algorithme de matching ou diversifier les bars assignés dans ces zones.',
      priority: 'high',
    });
  }

  // Funnel insights
  if (criticalDropOff) {
    insights.push({
      type: 'conversion',
      icon: AlertTriangle,
      color: 'text-red-500',
      title: 'Drop-off Critique Détecté',
      description: `${criticalDropOff.drop_off_rate}% d'abandon à l'étape "${criticalDropOff.stage}".`,
      recommendation: 'Analyser les raisons d\'abandon et optimiser cette étape du funnel en priorité.',
      priority: 'critical',
    });
  } else if (avgConversionRate > 60) {
    insights.push({
      type: 'conversion',
      icon: CheckCircle2,
      color: 'text-green-500',
      title: 'Funnel Performant',
      description: `Taux de conversion global de ${avgConversionRate.toFixed(1)}%, excellent !`,
      recommendation: 'Continuer à monitorer et maintenir ce niveau de qualité.',
      priority: 'low',
    });
  }

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive' as const;
      default: return 'default' as const;
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            Insights Automatiques
          </h3>
          <p className="text-sm text-muted-foreground">Recommandations basées sur les données réelles</p>
        </div>
        <Badge variant="outline" className="gap-1">
          {insights.length} insight{insights.length > 1 ? 's' : ''}
        </Badge>
      </div>

      {insights.length === 0 ? (
        <Alert>
          <TrendingUp className="h-4 w-4" />
          <AlertDescription>
            Pas d'insights disponibles pour le moment. Attendez plus de données.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          {insights.map((insight, index) => {
            const Icon = insight.icon;
            return (
              <Alert key={index} variant={getPriorityVariant(insight.priority)}>
                <Icon className={`h-4 w-4 ${insight.color}`} />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-sm">{insight.title}</strong>
                      <Badge 
                        variant={insight.priority === 'critical' ? 'destructive' : 'secondary'} 
                        className="text-xs"
                      >
                        {insight.priority.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm">{insight.description}</p>
                    <div className="mt-2 p-2 rounded bg-secondary/50">
                      <p className="text-xs font-medium flex items-start gap-2">
                        <Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span><strong>Recommandation :</strong> {insight.recommendation}</span>
                      </p>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            );
          })}
        </div>
      )}
    </Card>
  );
};
