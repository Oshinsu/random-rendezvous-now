import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export interface CommandItem {
  id: string;
  label: string;
  icon?: string;
  action: () => void;
  keywords?: string[];
}

export const useCommandPalette = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const commands: CommandItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '📊',
      action: () => navigate('/admin'),
      keywords: ['accueil', 'home', 'overview'],
    },
    {
      id: 'users',
      label: 'Users Management',
      icon: '👥',
      action: () => navigate('/admin/users'),
      keywords: ['utilisateurs', 'members'],
    },
    {
      id: 'crm',
      label: 'CRM Campaigns',
      icon: '📧',
      action: () => navigate('/admin/crm'),
      keywords: ['email', 'marketing', 'campaigns'],
    },
    {
      id: 'push',
      label: 'Push Notifications',
      icon: '🔔',
      action: () => navigate('/admin/push-notifications'),
      keywords: ['notifications', 'push'],
    },
    {
      id: 'groups',
      label: 'Groups Monitor',
      icon: '🗺️',
      action: () => navigate('/admin/groups'),
      keywords: ['groupes', 'map', 'realtime'],
    },
    {
      id: 'bars',
      label: 'Bar Owners',
      icon: '🍺',
      action: () => navigate('/admin/bar-owners'),
      keywords: ['gerants', 'bars'],
    },
    {
      id: 'api',
      label: 'API Analytics',
      icon: '📡',
      action: () => navigate('/admin/api'),
      keywords: ['costs', 'usage'],
    },
    {
      id: 'logs',
      label: 'Logs & Audit',
      icon: '📝',
      action: () => navigate('/admin/logs'),
      keywords: ['errors', 'debug'],
    },
  ];

  return {
    open,
    setOpen,
    commands,
  };
};
