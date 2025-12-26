import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command as CommandPrimitive } from 'cmdk';
import { 
  Search, 
  Home, 
  Users, 
  Calendar, 
  User, 
  Settings, 
  LogOut,
  Sparkles,
  MapPin,
  Bell,
  Gift,
  Shield,
  BookOpen,
  Flame,
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  keywords: string[];
  group: 'navigation' | 'actions' | 'admin' | 'account';
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminAuth();
  const [search, setSearch] = useState('');

  const commands: CommandItem[] = [
    // Navigation
    {
      id: 'home',
      label: 'Accueil',
      description: 'Retour à la page d\'accueil',
      icon: Home,
      action: () => navigate('/'),
      keywords: ['accueil', 'home', 'index'],
      group: 'navigation',
    },
    {
      id: 'dashboard',
      label: 'Mon Dashboard',
      description: 'Trouver un groupe maintenant',
      icon: Sparkles,
      action: () => navigate('/dashboard'),
      keywords: ['dashboard', 'groupe', 'search', 'chercher'],
      group: 'navigation',
    },
    {
      id: 'groups',
      label: 'Mes Groupes',
      description: 'Voir mes groupes actifs',
      icon: Users,
      action: () => navigate('/groups'),
      keywords: ['groupes', 'groups', 'actifs', 'current'],
      group: 'navigation',
    },
    {
      id: 'scheduled',
      label: 'Groupes Programmés',
      description: 'Planifier des sorties',
      icon: Calendar,
      action: () => navigate('/scheduled-groups'),
      keywords: ['programmer', 'scheduled', 'planifier', 'calendar'],
      group: 'navigation',
    },
    {
      id: 'profile',
      label: 'Mon Profil',
      description: 'Voir mes stats et badges',
      icon: User,
      action: () => navigate('/profile'),
      keywords: ['profil', 'profile', 'stats', 'badges', 'level'],
      group: 'navigation',
    },
    {
      id: 'community',
      label: 'Communauté',
      description: 'Stories et témoignages',
      icon: Flame,
      action: () => navigate('/community'),
      keywords: ['communauté', 'community', 'stories', 'témoignages'],
      group: 'navigation',
    },
    {
      id: 'blog',
      label: 'Blog',
      description: 'Articles et guides',
      icon: BookOpen,
      action: () => navigate('/blog'),
      keywords: ['blog', 'articles', 'guides'],
      group: 'navigation',
    },
    {
      id: 'referral',
      label: 'Parrainage',
      description: 'Inviter des amis',
      icon: Gift,
      action: () => navigate('/referral'),
      keywords: ['parrainage', 'referral', 'inviter', 'amis', 'invite'],
      group: 'navigation',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      description: 'Voir mes notifications',
      icon: Bell,
      action: () => navigate('/notifications'),
      keywords: ['notifications', 'alerts', 'alertes'],
      group: 'navigation',
    },

    // Actions
    {
      id: 'create-group',
      label: 'Créer un groupe programmé',
      description: 'Planifier une sortie',
      icon: Calendar,
      action: () => navigate('/scheduled-groups'),
      keywords: ['créer', 'create', 'nouveau', 'new', 'groupe', 'programmer'],
      group: 'actions',
    },
    {
      id: 'find-group',
      label: 'Trouver un groupe maintenant',
      description: 'Recherche instantanée',
      icon: Sparkles,
      action: () => navigate('/dashboard'),
      keywords: ['trouver', 'find', 'search', 'maintenant', 'now', 'instant'],
      group: 'actions',
    },

    // Admin (conditionnels)
    ...(isAdmin ? [
      {
        id: 'admin-dashboard',
        label: 'Admin Dashboard',
        description: 'Tableau de bord admin',
        icon: Shield,
        action: () => navigate('/admin'),
        keywords: ['admin', 'dashboard', 'analytics'],
        group: 'admin' as const,
      },
      {
        id: 'admin-users',
        label: 'Admin Users',
        description: 'Gérer les utilisateurs',
        icon: Users,
        action: () => navigate('/admin/users'),
        keywords: ['admin', 'users', 'utilisateurs', 'manage'],
        group: 'admin' as const,
      },
      {
        id: 'admin-crm',
        label: 'Admin CRM',
        description: 'Campaigns et emails',
        icon: MapPin,
        action: () => navigate('/admin/crm'),
        keywords: ['admin', 'crm', 'campaigns', 'emails', 'marketing'],
        group: 'admin' as const,
      },
    ] : []),

    // Account
    {
      id: 'settings',
      label: 'Paramètres',
      description: 'Modifier mes préférences',
      icon: Settings,
      action: () => navigate('/profile'),
      keywords: ['paramètres', 'settings', 'preferences', 'config'],
      group: 'account',
    },
    {
      id: 'logout',
      label: 'Déconnexion',
      description: 'Se déconnecter',
      icon: LogOut,
      action: () => signOut(),
      keywords: ['logout', 'déconnexion', 'signout', 'quit'],
      group: 'account',
    },
  ];

  // Filter commands based on search
  const filteredCommands = commands.filter(cmd => {
    const searchLower = search.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(searchLower) ||
      cmd.description?.toLowerCase().includes(searchLower) ||
      cmd.keywords.some(k => k.toLowerCase().includes(searchLower))
    );
  });

  // Group commands
  const groupedCommands = {
    navigation: filteredCommands.filter(c => c.group === 'navigation'),
    actions: filteredCommands.filter(c => c.group === 'actions'),
    admin: filteredCommands.filter(c => c.group === 'admin'),
    account: filteredCommands.filter(c => c.group === 'account'),
  };

  const handleSelect = useCallback((command: CommandItem) => {
    command.action();
    onOpenChange(false);
    setSearch('');
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-2xl overflow-hidden">
        <CommandPrimitive
          className="rounded-lg bg-white dark:bg-neutral-900 shadow-2xl"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              onOpenChange(false);
            }
          }}
        >
          {/* Search Input */}
          <div className="flex items-center border-b border-neutral-200 dark:border-neutral-700 px-4">
            <Search className="h-5 w-5 text-neutral-400 mr-2" />
            <CommandPrimitive.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Que cherchez-vous ?"
              className="flex-1 py-4 bg-transparent border-0 focus:outline-none text-base text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
            />
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 px-1.5 font-mono text-[10px] font-medium text-neutral-600 dark:text-neutral-400">
              ESC
            </kbd>
          </div>

          {/* Commands List */}
          <CommandPrimitive.List className="max-h-[400px] overflow-y-auto p-2">
            {filteredCommands.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Aucun résultat pour "{search}"
                </p>
              </div>
            )}

            {/* Navigation Group */}
            {groupedCommands.navigation.length > 0 && (
              <CommandPrimitive.Group>
                <div className="px-2 py-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                  Navigation
                </div>
                {groupedCommands.navigation.map((cmd) => (
                  <CommandPrimitive.Item
                    key={cmd.id}
                    value={cmd.id}
                    onSelect={() => handleSelect(cmd)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
                      "hover:bg-gradient-to-r hover:from-[#fffbe8] hover:to-[#f1c232]/20",
                      "data-[selected=true]:bg-gradient-to-r data-[selected=true]:from-[#fffbe8] data-[selected=true]:to-[#f1c232]/20"
                    )}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-[#f1c232] to-[#c08a15]">
                      <cmd.icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {cmd.label}
                      </p>
                      {cmd.description && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {cmd.description}
                        </p>
                      )}
                    </div>
                  </CommandPrimitive.Item>
                ))}
              </CommandPrimitive.Group>
            )}

            {/* Actions Group */}
            {groupedCommands.actions.length > 0 && (
              <CommandPrimitive.Group>
                <div className="px-2 py-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mt-2">
                  Actions rapides
                </div>
                {groupedCommands.actions.map((cmd) => (
                  <CommandPrimitive.Item
                    key={cmd.id}
                    value={cmd.id}
                    onSelect={() => handleSelect(cmd)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
                      "hover:bg-gradient-to-r hover:from-[#fffbe8] hover:to-[#f1c232]/20",
                      "data-[selected=true]:bg-gradient-to-r data-[selected=true]:from-[#fffbe8] data-[selected=true]:to-[#f1c232]/20"
                    )}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-[#f1c232] to-[#c08a15]">
                      <cmd.icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {cmd.label}
                      </p>
                      {cmd.description && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {cmd.description}
                        </p>
                      )}
                    </div>
                  </CommandPrimitive.Item>
                ))}
              </CommandPrimitive.Group>
            )}

            {/* Admin Group */}
            {groupedCommands.admin.length > 0 && (
              <CommandPrimitive.Group>
                <div className="px-2 py-1.5 text-xs font-semibold text-red-500 dark:text-red-400 uppercase tracking-wide mt-2">
                  Administration
                </div>
                {groupedCommands.admin.map((cmd) => (
                  <CommandPrimitive.Item
                    key={cmd.id}
                    value={cmd.id}
                    onSelect={() => handleSelect(cmd)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
                      "hover:bg-red-50 dark:hover:bg-red-900/20",
                      "data-[selected=true]:bg-red-50 dark:data-[selected=true]:bg-red-900/20"
                    )}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-red-500">
                      <cmd.icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {cmd.label}
                      </p>
                      {cmd.description && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {cmd.description}
                        </p>
                      )}
                    </div>
                  </CommandPrimitive.Item>
                ))}
              </CommandPrimitive.Group>
            )}

            {/* Account Group */}
            {groupedCommands.account.length > 0 && (
              <CommandPrimitive.Group>
                <div className="px-2 py-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mt-2">
                  Compte
                </div>
                {groupedCommands.account.map((cmd) => (
                  <CommandPrimitive.Item
                    key={cmd.id}
                    value={cmd.id}
                    onSelect={() => handleSelect(cmd)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
                      "hover:bg-neutral-100 dark:hover:bg-neutral-800",
                      "data-[selected=true]:bg-neutral-100 dark:data-[selected=true]:bg-neutral-800"
                    )}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-200 dark:bg-neutral-700">
                      <cmd.icon className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {cmd.label}
                      </p>
                      {cmd.description && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {cmd.description}
                        </p>
                      )}
                    </div>
                  </CommandPrimitive.Item>
                ))}
              </CommandPrimitive.Group>
            )}
          </CommandPrimitive.List>

          {/* Footer */}
          <div className="border-t border-neutral-200 dark:border-neutral-700 px-4 py-2 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800">↑</kbd>
                <kbd className="px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800">↓</kbd>
                <span className="ml-1">Naviguer</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800">↵</kbd>
                <span>Sélectionner</span>
              </div>
            </div>
            <span>⌘K / Ctrl+K pour ouvrir</span>
          </div>
        </CommandPrimitive>
      </DialogContent>
    </Dialog>
  );
}

