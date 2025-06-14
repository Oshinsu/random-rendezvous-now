
import { Home, Users, User } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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

const navigationItems = [
  { title: 'Dashboard', url: '/dashboard', icon: Home },
  { title: 'Mes Groupes', url: '/groups', icon: Users },
  { title: 'Profil', url: '/profile', icon: User },
];

export function AppSidebar() {
  const { user } = useAuth();
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
      className="border-r border-slate-200/60 bg-white/95 backdrop-blur-sm"
      collapsible="icon"
    >
      <SidebarHeader className="p-4 border-b border-slate-200/60">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg">R</span>
          </div>
          {!isCollapsed && (
            <div>
              <span className="font-bold text-xl text-slate-800">Random</span>
              <p className="text-sm text-slate-600">App</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4">
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="text-slate-600 font-medium px-3 mb-2">
              Navigation
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                    className="mx-2 rounded-lg hover:bg-amber-50 data-[active=true]:bg-amber-100 data-[active=true]:text-amber-800 data-[active=true]:border-l-4 data-[active=true]:border-amber-500 transition-all duration-200"
                    tooltip={isCollapsed ? item.title : undefined}
                  >
                    <NavLink to={item.url} className="flex items-center space-x-3 py-2">
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span className="font-medium">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-slate-200/60">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10 ring-2 ring-amber-200">
            <AvatarFallback className="bg-gradient-to-br from-amber-500 to-amber-600 text-white font-semibold">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="font-medium text-slate-800 truncate">{userName}</p>
              <p className="text-sm text-slate-600 truncate">{user?.email}</p>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
