
import { Home, Users, User, ExternalLink, Calendar, Shield, Building, Crown } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import RandomLogo from './RandomLogo';

const navigationItems = [
  { title: 'Chercher un groupe', url: '/dashboard', icon: Home },
  { title: 'Mon groupe', url: '/groups', icon: Users },
  { title: 'Groupes planifiés', url: '/scheduled-groups', icon: Calendar },
  { title: 'Espace Gérant', url: '/bar-dashboard', icon: Building },
  { title: 'Profil', url: '/profile', icon: User },
  { title: 'Mon Abonnement', url: '/subscription', icon: Crown },
  { title: 'Page d\'accueil', url: '/', icon: ExternalLink },
];

export function AppSidebar() {
  const { user } = useAuth();
  const { isAdmin } = useAdminAuth();
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const userName = user?.user_metadata?.first_name || 'Utilisateur';
  const isCollapsed = state === 'collapsed';
  
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Sidebar 
      className="border-r border-neutral-200/50 glass-morphism"
      collapsible="icon"
    >
      <SidebarHeader className="p-6 border-b border-neutral-200/50">
        <NavLink to="/" className="flex items-center space-x-4 hover:opacity-90 transition-opacity">
          <RandomLogo size={48} withAura className="shadow-lg" />
          {!isCollapsed && (
            <div>
              <span className="font-display text-2xl font-bold gradient-text">Random</span>
              <p className="text-sm font-heading text-neutral-600 font-medium">Aventures</p>
            </div>
          )}
        </NavLink>
      </SidebarHeader>

      <SidebarContent className="py-6">
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="text-neutral-600 font-heading font-semibold px-6 mb-4 text-xs uppercase tracking-wider">
              Navigation
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2 px-4">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                    className="mx-0 rounded-2xl hover:bg-brand-50 data-[active=true]:bg-gradient-to-r data-[active=true]:from-brand-500 data-[active=true]:to-brand-600 data-[active=true]:text-white data-[active=true]:shadow-medium transition-all duration-300 group h-12"
                    tooltip={isCollapsed ? item.title : undefined}
                  >
                    <NavLink to={item.url} className="flex items-center space-x-4 py-3 px-4 w-full">
                      <item.icon className="h-5 w-5 flex-shrink-0 group-data-[active=true]:text-white" />
                      {!isCollapsed && <span className="font-heading font-semibold">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              {/* Admin Link - Only visible to admins */}
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive('/admin')}
                    className="mx-0 rounded-2xl hover:bg-red-50 data-[active=true]:bg-gradient-to-r data-[active=true]:from-red-500 data-[active=true]:to-red-600 data-[active=true]:text-white data-[active=true]:shadow-medium transition-all duration-300 group h-12"
                    tooltip={isCollapsed ? "Admin Panel" : undefined}
                  >
                    <NavLink to="/admin" className="flex items-center space-x-4 py-3 px-4 w-full">
                      <Shield className="h-5 w-5 flex-shrink-0 group-data-[active=true]:text-white text-red-600" />
                      {!isCollapsed && <span className="font-heading font-semibold text-red-700">Admin Panel</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-6 border-t border-neutral-200/50">
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12 ring-2 ring-brand-200 shadow-medium">
            <AvatarFallback className="bg-gradient-to-br from-brand-500 to-brand-600 text-white font-heading font-bold">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="font-heading font-semibold text-neutral-800 truncate">{userName}</p>
              <p className="text-sm font-body text-neutral-600 truncate">{user?.email}</p>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
