import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import type { BarAnalytics } from '@/hooks/useBarOwner';

interface KPIDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  icon: React.ReactNode;
  currentValue: number | string;
  analytics: BarAnalytics[];
  metricType: 'customers' | 'groups' | 'revenue' | 'roi' | 'costPerCustomer' | 'groupSize' | 'totalCustomers' | 'avgCustomers';
}

export function KPIDetailModal({
  open,
  onOpenChange,
  title,
  icon,
  currentValue,
  analytics,
  metricType,
}: KPIDetailModalProps) {
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  };

  const getMetricValue = (month: BarAnalytics) => {
    switch (metricType) {
      case 'customers':
        return month.total_customers;
      case 'groups':
        return month.total_groups;
      case 'revenue':
        return month.estimated_revenue_eur;
      case 'roi':
        return (month.estimated_revenue_eur / 100) / 150;
      case 'costPerCustomer':
        return month.total_customers ? 150 / month.total_customers : 0;
      case 'groupSize':
        return month.total_customers && month.total_groups 
          ? month.total_customers / month.total_groups 
          : 0;
      default:
        return 0;
    }
  };

  const formatValue = (value: number) => {
    switch (metricType) {
      case 'revenue':
        return formatCurrency(value);
      case 'roi':
        return `${value.toFixed(1)}x`;
      case 'costPerCustomer':
        return `${value.toFixed(2)}€`;
      case 'groupSize':
        return `${value.toFixed(1)} pers.`;
      default:
        return value.toString();
    }
  };

  const lastSixMonths = analytics.slice(0, 6);
  const currentMonth = analytics[0];
  const previousMonth = analytics[1];
  
  const currentMetricValue = currentMonth ? getMetricValue(currentMonth) : 0;
  const previousMetricValue = previousMonth ? getMetricValue(previousMonth) : 0;
  const change = previousMetricValue ? ((currentMetricValue - previousMetricValue) / previousMetricValue) * 100 : 0;
  const isPositive = change > 0;

  const avg = lastSixMonths.reduce((sum, m) => sum + getMetricValue(m), 0) / lastSixMonths.length;
  const max = Math.max(...lastSixMonths.map(m => getMetricValue(m)));
  const min = Math.min(...lastSixMonths.map(m => getMetricValue(m)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            {icon}
            {title}
          </DialogTitle>
          <DialogDescription>
            Analyse détaillée sur les 6 derniers mois
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Current Value */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Valeur actuelle</p>
                  <p className="text-4xl font-bold">{currentValue}</p>
                </div>
                {previousMonth && (
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                    isPositive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                  }`}>
                    {isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                    <span className="font-semibold">{Math.abs(change).toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Activity className="h-4 w-4" />
                  <p className="text-xs">Moyenne</p>
                </div>
                <p className="text-xl font-semibold">{formatValue(avg)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-success mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <p className="text-xs">Maximum</p>
                </div>
                <p className="text-xl font-semibold">{formatValue(max)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <TrendingDown className="h-4 w-4" />
                  <p className="text-xs">Minimum</p>
                </div>
                <p className="text-xl font-semibold">{formatValue(min)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Breakdown */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Historique mensuel
            </h4>
            <Separator />
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {lastSixMonths.map((month, index) => {
                const value = getMetricValue(month);
                const monthDate = new Date(month.report_month);
                const monthLabel = monthDate.toLocaleDateString('fr-FR', { 
                  month: 'long',
                  year: 'numeric'
                });
                
                return (
                  <div key={month.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-primary' : 'bg-muted-foreground'}`} />
                      <span className="text-sm font-medium capitalize">{monthLabel}</span>
                    </div>
                    <span className="font-semibold">{formatValue(value)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
