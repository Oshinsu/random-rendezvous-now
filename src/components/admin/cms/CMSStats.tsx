import { FileText, Layout, Clock, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CMSStatsProps {
  total: number;
  sections: number;
  recentlyUpdated: number;
  byType: Array<{ type: string; count: number }>;
}

export const CMSStats = ({ total, sections, recentlyUpdated, byType }: CMSStatsProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total</p>
              <p className="text-xl sm:text-2xl font-bold">{total}</p>
            </div>
            <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Sections</p>
              <p className="text-xl sm:text-2xl font-bold">{sections}</p>
            </div>
            <Layout className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Modifiés (7j)</p>
              <p className="text-xl sm:text-2xl font-bold">{recentlyUpdated}</p>
            </div>
            <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Types</p>
              <div className="flex gap-1 flex-wrap">
                {byType.map(({ type, count }) => (
                  <Badge key={type} variant="outline" className="text-xs">
                    {count}
                  </Badge>
                ))}
              </div>
            </div>
            <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};