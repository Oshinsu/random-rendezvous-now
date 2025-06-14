
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
  
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Sidebar className="border-r glass-effect">
      <SidebarHeader className="p-6 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 gold-gradient rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">R</span>
          </div>
          {state === 'expanded' && (
            <div>
              <span className="font-bold text-xl text-gray-800">Random</span>
              <p className="text-sm text-gray-600">App</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-600 font-medium">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                    className="hover:bg-gray-50 data-[active=true]:bg-amber-50 data-[active=true]:text-amber-700 data-[active=true]:border-r-2 data-[active=true]:border-amber-500"
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
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="gold-gradient text-white font-semibold">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
          {state === 'expanded' && (
            <div className="min-w-0">
              <p className="font-medium text-gray-800 truncate">{userName}</p>
              <p className="text-sm text-gray-600 truncate">{user?.email}</p>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
