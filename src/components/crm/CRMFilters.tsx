import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useCRMSegments } from '@/hooks/useCRMSegments';

interface CRMFiltersProps {
  churnRiskFilter: string | null;
  onChurnRiskChange: (value: string | null) => void;
  segmentFilter: string | null;
  onSegmentFilterChange: (value: string | null) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export const CRMFilters = ({
  churnRiskFilter,
  onChurnRiskChange,
  segmentFilter,
  onSegmentFilterChange,
  searchQuery,
  onSearchChange,
}: CRMFiltersProps) => {
  const { segments } = useCRMSegments();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Input
        placeholder="Rechercher par nom ou email..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="md:col-span-2"
      />

      <div className="flex gap-2">
        <Select value={churnRiskFilter || 'all'} onValueChange={(v) => onChurnRiskChange(v === 'all' ? null : v)}>
          <SelectTrigger>
            <SelectValue placeholder="Risque de churn" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les risques</SelectItem>
            <SelectItem value="critical">Critique</SelectItem>
            <SelectItem value="high">Élevé</SelectItem>
            <SelectItem value="medium">Moyen</SelectItem>
            <SelectItem value="low">Faible</SelectItem>
          </SelectContent>
        </Select>
        {churnRiskFilter && (
          <Button variant="ghost" size="icon" onClick={() => onChurnRiskChange(null)}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <Select value={segmentFilter || 'all'} onValueChange={(v) => onSegmentFilterChange(v === 'all' ? null : v)}>
          <SelectTrigger>
            <SelectValue placeholder="Segment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les segments</SelectItem>
            {segments.map((segment) => (
              <SelectItem key={segment.id} value={segment.id}>
                {segment.segment_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {segmentFilter && (
          <Button variant="ghost" size="icon" onClick={() => onSegmentFilterChange(null)}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
