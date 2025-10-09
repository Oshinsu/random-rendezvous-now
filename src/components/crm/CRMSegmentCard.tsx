import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';

interface CRMSegmentCardProps {
  name: string;
  description: string;
  userCount: number;
  color: string;
  icon: LucideIcon;
}

const getColorClasses = (color: string) => {
  const colorMap: Record<string, { bg: string; text: string; badge: string }> = {
    '#3b82f6': { bg: 'bg-blue-500/10', text: 'text-blue-600', badge: 'bg-blue-500' },
    '#ef4444': { bg: 'bg-red-500/10', text: 'text-red-600', badge: 'bg-red-500' },
    '#f97316': { bg: 'bg-orange-500/10', text: 'text-orange-600', badge: 'bg-orange-500' },
    '#8b5cf6': { bg: 'bg-purple-500/10', text: 'text-purple-600', badge: 'bg-purple-500' },
    '#10b981': { bg: 'bg-green-500/10', text: 'text-green-600', badge: 'bg-green-500' },
    '#06b6d4': { bg: 'bg-cyan-500/10', text: 'text-cyan-600', badge: 'bg-cyan-500' },
  };
  return colorMap[color] || colorMap['#3b82f6'];
};

export const CRMSegmentCard = ({ name, description, userCount, color, icon: Icon }: CRMSegmentCardProps) => {
  const colors = getColorClasses(color);

  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-200 border-border/50">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-full ${colors.bg}`}>
          <Icon className={`h-6 w-6 ${colors.text}`} />
        </div>
        <Badge variant="secondary" className={`${colors.badge} text-white border-0`}>
          {userCount} users
        </Badge>
      </div>

      <h3 className="text-xl font-bold mb-2 text-foreground">{name}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </Card>
  );
};
