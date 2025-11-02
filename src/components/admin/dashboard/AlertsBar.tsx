import { AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface SystemAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  actionUrl: string;
  actionLabel: string;
}

interface AlertsBarProps {
  alerts: SystemAlert[];
}

export const AlertsBar = ({ alerts }: AlertsBarProps) => {
  const navigate = useNavigate();

  if (alerts.length === 0) return null;

  const getAlertVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'warning': return 'default';
      default: return 'default';
    }
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'warning': return <TrendingUp className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-3 mb-6">
      {alerts.map((alert) => (
        <Alert key={alert.id} variant={getAlertVariant(alert.severity)}>
          {getAlertIcon(alert.severity)}
          <AlertTitle className="ml-2">{alert.title}</AlertTitle>
          <AlertDescription className="ml-2 flex items-center justify-between">
            <span>{alert.message}</span>
            <Button 
              size="sm" 
              variant="secondary" 
              onClick={() => navigate(alert.actionUrl)}
              className="ml-4"
            >
              {alert.actionLabel} →
            </Button>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
};
