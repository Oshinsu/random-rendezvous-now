import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface HealthScoreGaugeProps {
  value: number;
  maxValue?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const HealthScoreGauge = ({ value, maxValue = 100, size = 'md' }: HealthScoreGaugeProps) => {
  const percentage = (value / maxValue) * 100;
  
  const getColorClass = () => {
    if (percentage >= 70) return 'text-green-600 border-green-600';
    if (percentage >= 50) return 'text-yellow-600 border-yellow-600';
    if (percentage >= 30) return 'text-orange-600 border-orange-600';
    return 'text-red-600 border-red-600';
  };

  const getProgressColor = () => {
    if (percentage >= 70) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 30) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getRiskLabel = () => {
    if (percentage >= 70) return 'Faible risque';
    if (percentage >= 50) return 'Risque moyen';
    if (percentage >= 30) return 'Risque élevé';
    return 'Risque critique';
  };

  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl'
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-center space-y-3">
        <div className={`${sizeClasses[size]} font-bold ${getColorClass()}`}>
          {value}
        </div>
        <Badge variant="outline" className={getColorClass()}>
          {getRiskLabel()}
        </Badge>
      </div>
      <div className="space-y-2">
        <Progress 
          value={percentage} 
          className="h-3"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0</span>
          <span>{maxValue}</span>
        </div>
      </div>
    </div>
  );
};
