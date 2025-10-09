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
  loginStatusFilter?: string | null;
  onLoginStatusChange?: (value: string | null) => void;
}

export const CRMFilters = ({
  churnRiskFilter,
  onChurnRiskChange,
  segmentFilter,
  onSegmentFilterChange,
  searchQuery,
  onSearchChange,
  loginStatusFilter,
  onLoginStatusChange,
}: CRMFiltersProps) => {
  const { segments } = useCRMSegments();

  return (
    <div className="space-y-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          placeholder="Rechercher par nom ou email..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />

        {loginStatusFilter !== undefined && onLoginStatusChange && (
          <div className="flex gap-2">
            <Select value={loginStatusFilter || 'all'} onValueChange={(v) => onLoginStatusChange(v === 'all' ? null : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Statut connexion" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="never">🧟 Jamais connecté</SelectItem>
                <SelectItem value="active">⚡ Connecté récemment</SelectItem>
                <SelectItem value="inactive">😴 Inactif 30+ jours</SelectItem>
              </SelectContent>
            </Select>
            {loginStatusFilter && (
              <Button variant="ghost" size="icon" onClick={() => onLoginStatusChange(null)}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex gap-2">
          <Select value={churnRiskFilter || 'all'} onValueChange={(v) => onChurnRiskChange(v === 'all' ? null : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Risque de churn" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les risques</SelectItem>
              <SelectItem value="critical">💀 Critique</SelectItem>
              <SelectItem value="high">🔴 Élevé</SelectItem>
              <SelectItem value="medium">⚠️ Moyen</SelectItem>
              <SelectItem value="low">✅ Faible</SelectItem>
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
    </div>
  );
};
