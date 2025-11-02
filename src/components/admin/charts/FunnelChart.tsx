import { Progress } from "@/components/ui/progress";
import { ChevronDown } from "lucide-react";

interface FunnelStep {
  label: string;
  value: number;
  color: string;
}

interface FunnelChartProps {
  data: FunnelStep[];
}

export const FunnelChart = ({ data }: FunnelChartProps) => {
  const maxValue = data[0]?.value || 1;

  return (
    <div className="space-y-6">
      {data.map((step, index) => {
        const percentage = (step.value / maxValue) * 100;
        const conversionRate = index > 0 ? ((step.value / data[index - 1].value) * 100).toFixed(1) : '100';

        return (
          <div key={step.label} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{index + 1}. {step.label}</span>
                {index > 0 && (
                  <ChevronDown className="h-4 w-4 text-red-500" />
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-red-800">{step.value}</span>
                {index > 0 && (
                  <span className={`text-xs font-medium ${parseFloat(conversionRate) >= 50 ? 'text-green-600' : 'text-orange-600'}`}>
                    {conversionRate}%
                  </span>
                )}
              </div>
            </div>
            <Progress 
              value={percentage} 
              className="h-3" 
              style={{ 
                backgroundColor: `${step.color}20`,
              }}
            />
          </div>
        );
      })}
    </div>
  );
};
