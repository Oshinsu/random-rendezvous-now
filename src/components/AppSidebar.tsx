
import { Home, Users, User, ExternalLink, Calendar, Shield, Building, Gift } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useBarOwnerAuth } from '@/hooks/useBarOwnerAuth';
import LanguageToggle from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTranslation } from 'react-i18next';
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

export function AppSidebar() {
  const { user } = useAuth();
  const { isAdmin } = useAdminAuth();
  const { isBarOwner } = useBarOwnerAuth();
  const { state } = useSidebar();
  const { t } = useTranslation();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const userName = user?.user_metadata?.first_name || 'Utilisateur';
  const isCollapsed = state === 'collapsed';
  
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Navigation items with translations
  const navigationItems = [
    { title: t('navigation.search_group'), url: '/dashboard', icon: Home },
    { title: t('navigation.my_group'), url: '/groups', icon: Users },
    { title: t('navigation.scheduled_groups'), url: '/scheduled-groups', icon: Calendar },
    { title: t('navigation.profile'), url: '/profile', icon: User },
    { title: t('navigation.referral'), url: '/referral', icon: Gift },
    { title: t('navigation.home_page'), url: '/', icon: ExternalLink },
  ];

  return (
    <Sidebar 
      className="border-r border-neutral-200/50 glass-morphism transition-all duration-300 ease-in-out"
      collapsible="icon"
    >
      <SidebarHeader className="p-6 border-b border-neutral-200/50 dark:border-neutral-700/50">
        <div className="flex items-center space-x-4">
          <RandomLogo size={48} withAura animated className="shadow-lg" />
          {!isCollapsed && (
            <div>
              <span className="font-display text-2xl font-bold gradient-text">Random</span>
              <p className="text-sm font-heading text-neutral-600 dark:text-neutral-400 font-medium">Aventures</p>
            </div>
          )}
        </div>
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
                    className="mx-0 rounded-2xl hover:bg-brand-50 data-[active=true]:bg-gradient-to-r data-[active=true]:from-brand-500 data-[active=true]:to-brand-600 data-[active=true]:text-white data-[active=true]:shadow-medium transition-all duration-300 group h-12 focus-visible:ring-4 focus-visible:ring-brand-500/30"
                    tooltip={isCollapsed ? item.title : undefined}
                  >
                    <NavLink to={item.url} className="flex items-center space-x-4 py-3 px-4 w-full relative">
                      <item.icon className="h-5 w-5 flex-shrink-0 group-data-[active=true]:text-white" />
                      {!isCollapsed && <span className="font-heading font-semibold">{item.title}</span>}
                      {isActive(item.url) && !isCollapsed && (
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full animate-pulse"></span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              {/* Bar Owner Link - Visible to approved bar owners OR admins */}
              {(isBarOwner || isAdmin) && (
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive('/bar-dashboard')}
                    className="mx-0 rounded-2xl hover:bg-brand-50 dark:hover:bg-brand-900/20 data-[active=true]:bg-gradient-to-r data-[active=true]:from-brand-500 data-[active=true]:to-brand-600 data-[active=true]:text-white data-[active=true]:shadow-medium transition-all duration-300 group h-12"
                    tooltip={isCollapsed ? t('navigation.bar_owner_space') : undefined}
                  >
                    <NavLink to="/bar-dashboard" className="flex items-center space-x-4 py-3 px-4 w-full">
                      <Building className="h-5 w-5 flex-shrink-0 group-data-[active=true]:text-white" />
                      {!isCollapsed && <span className="font-heading font-semibold">{t('navigation.bar_owner_space')}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              
              {/* Admin Link - Only visible to admins */}
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive('/admin')}
                    className="mx-0 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 data-[active=true]:bg-gradient-to-r data-[active=true]:from-red-500 data-[active=true]:to-red-600 data-[active=true]:text-white data-[active=true]:shadow-medium transition-all duration-300 group h-12"
                    tooltip={isCollapsed ? t('navigation.admin_panel') : undefined}
                  >
                    <NavLink to="/admin" className="flex items-center space-x-4 py-3 px-4 w-full">
                      <Shield className="h-5 w-5 flex-shrink-0 group-data-[active=true]:text-white text-red-600 dark:text-red-400" />
                      {!isCollapsed && <span className="font-heading font-semibold text-red-700 dark:text-red-400">{t('navigation.admin_panel')}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-6 border-t border-neutral-200/50 dark:border-neutral-700/50">
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12 ring-2 ring-brand-200 dark:ring-brand-700 shadow-medium">
              <AvatarFallback className="bg-gradient-to-br from-brand-500 to-brand-600 text-white font-heading font-bold">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="font-heading font-semibold text-neutral-800 dark:text-neutral-100 truncate">{userName}</p>
                <p className="text-sm font-body text-neutral-600 dark:text-neutral-400 truncate">{user?.email}</p>
              </div>
            )}
          </div>
          <div className="flex items-center justify-center gap-3 px-3 py-2">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
