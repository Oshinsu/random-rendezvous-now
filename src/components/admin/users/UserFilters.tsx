import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface UserFiltersProps {
  healthScoreRange: number[];
  onHealthScoreChange: (range: number[]) => void;
  churnRisks: string[];
  onChurnRiskToggle: (risk: string) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
}

export const UserFilters = ({
  healthScoreRange,
  onHealthScoreChange,
  churnRisks,
  onChurnRiskToggle,
  onApplyFilters,
  onResetFilters,
}: UserFiltersProps) => {
  const riskLevels = [
    { value: 'low', label: 'Low', color: 'bg-success' },
    { value: 'medium', label: 'Medium', color: 'bg-warning' },
    { value: 'high', label: 'High', color: 'bg-error' },
    { value: 'critical', label: 'Critical', color: 'bg-destructive' },
  ];

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label>Health Score Range</Label>
          <Slider
            min={0}
            max={100}
            step={1}
            value={healthScoreRange}
            onValueChange={onHealthScoreChange}
            className="mt-2"
          />
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>{healthScoreRange[0]}</span>
            <span>{healthScoreRange[1]}</span>
          </div>
        </div>

        <div>
          <Label>Churn Risk</Label>
          <div className="space-y-2 mt-2">
            {riskLevels.map((risk) => (
              <div key={risk.value} className="flex items-center space-x-2">
                <Checkbox
                  id={risk.value}
                  checked={churnRisks.includes(risk.value)}
                  onCheckedChange={() => onChurnRiskToggle(risk.value)}
                />
                <label
                  htmlFor={risk.value}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                >
                  <div className={`w-3 h-3 rounded-full ${risk.color}`} />
                  {risk.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={onApplyFilters} className="flex-1">
            Apply Filters
          </Button>
          <Button onClick={onResetFilters} variant="outline">
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
