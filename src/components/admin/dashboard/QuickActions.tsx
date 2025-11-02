import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Users, Download, Settings, FileText, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      id: 'new-campaign',
      label: 'New Campaign',
      icon: <Mail className="h-5 w-5" />,
      action: () => navigate('/admin/crm'),
      variant: 'default' as const,
    },
    {
      id: 'export-users',
      label: 'Export Users',
      icon: <Download className="h-5 w-5" />,
      action: () => navigate('/admin/users'),
      variant: 'outline' as const,
    },
    {
      id: 'view-logs',
      label: 'View Logs',
      icon: <FileText className="h-5 w-5" />,
      action: () => navigate('/admin/logs'),
      variant: 'outline' as const,
    },
    {
      id: 'send-push',
      label: 'Send Push Notification',
      icon: <Bell className="h-5 w-5" />,
      action: () => navigate('/admin/push-notifications'),
      variant: 'outline' as const,
    },
    {
      id: 'system-settings',
      label: 'System Settings',
      icon: <Settings className="h-5 w-5" />,
      action: () => navigate('/admin/settings'),
      variant: 'outline' as const,
    },
    {
      id: 'user-management',
      label: 'User Management',
      icon: <Users className="h-5 w-5" />,
      action: () => navigate('/admin/users'),
      variant: 'outline' as const,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant}
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={action.action}
            >
              {action.icon}
              <span className="text-sm">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
