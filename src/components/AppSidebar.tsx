
import { Home, Users, User, Settings, Calendar, Star } from 'lucide-react';
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
  
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Sidebar className="border-r border-amber-200/20 bg-white/80 backdrop-blur-sm">
      <SidebarHeader className="p-6 border-b border-amber-200/20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">R</span>
          </div>
          {state === 'expanded' && (
            <div className="flex flex-col">
              <span className="font-heading font-bold text-xl bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
                Random
              </span>
              <span className="text-xs text-gray-500">Votre aventure commence ici</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-amber-700 font-semibold">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                    className="hover:bg-amber-50 data-[active=true]:bg-gradient-to-r data-[active=true]:from-amber-100 data-[active=true]:to-amber-50 data-[active=true]:text-amber-800 data-[active=true]:font-semibold"
                  >
                    <NavLink to={item.url} className="flex items-center space-x-3">
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-amber-700 font-semibold">
            Quick Stats
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-3 py-2 space-y-2">
              <div className="flex items-center justify-between bg-amber-50 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">Aventures</span>
                </div>
                <span className="text-amber-700 font-bold">0</span>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-amber-200/20">
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8 ring-2 ring-amber-200">
            <AvatarFallback className="bg-gradient-to-br from-amber-400 to-amber-600 text-white text-sm">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
          {state === 'expanded' && (
            <div className="flex flex-col min-w-0">
              <p className="font-medium text-gray-800 truncate">{userName}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
