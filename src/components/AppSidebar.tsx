
import { Home, Users, User, Settings, Calendar, Star, Crown, Gem } from 'lucide-react';
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
  { title: 'Mes Cercles', url: '/groups', icon: Users },
  { title: 'Profil', url: '/profile', icon: User },
];

export function AppSidebar() {
  const { user } = useAuth();
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const userName = user?.user_metadata?.first_name || 'Membre VIP';
  
  const getInitials = (name?: string) => {
    if (!name) return 'M';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Sidebar className="border-r-2 border-yellow-200/30 glass-luxury backdrop-blur-lg">
      <SidebarHeader className="p-8 border-b-2 border-yellow-200/30">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center shadow-2xl luxury-shimmer">
            <Crown className="text-white font-bold text-2xl h-8 w-8" />
          </div>
          {state === 'expanded' && (
            <div className="flex flex-col">
              <span className="font-luxury font-black text-3xl bg-gradient-to-r from-yellow-600 to-yellow-800 bg-clip-text text-transparent">
                Prestige
              </span>
              <span className="text-sm text-gray-600 font-elegant font-medium">Votre expérience exclusive</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-yellow-800 font-luxury font-bold text-lg">
            Navigation Premium
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                    className="hover:bg-yellow-50 data-[active=true]:bg-gradient-to-r data-[active=true]:from-yellow-100 data-[active=true]:to-yellow-50 data-[active=true]:text-yellow-900 data-[active=true]:font-bold data-[active=true]:border-l-4 data-[active=true]:border-yellow-500 my-2 py-4 rounded-xl"
                  >
                    <NavLink to={item.url} className="flex items-center space-x-4 font-elegant font-semibold text-lg">
                      <item.icon className="h-7 w-7" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-yellow-800 font-luxury font-bold text-lg">
            Statistiques VIP
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-4 py-3 space-y-3">
              <div className="flex items-center justify-between glass-gold rounded-2xl p-4 shadow-lg">
                <div className="flex items-center space-x-3">
                  <Gem className="h-6 w-6 text-yellow-700" />
                  <span className="text-lg font-elegant font-bold text-yellow-900">Expériences</span>
                </div>
                <span className="text-yellow-800 font-luxury font-black text-xl">0</span>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-6 border-t-2 border-yellow-200/30">
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12 ring-4 ring-yellow-300 shadow-lg">
            <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-white text-lg font-luxury font-bold">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
          {state === 'expanded' && (
            <div className="flex flex-col min-w-0">
              <p className="font-luxury font-bold text-gray-900 truncate text-lg">{userName}</p>
              <p className="text-sm text-gray-600 truncate font-elegant">{user?.email}</p>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
