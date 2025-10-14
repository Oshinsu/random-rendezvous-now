import { NavLink, useLocation } from "react-router-dom";
import { 
  BarChart3, 
  Users, 
  MapPin, 
  Activity, 
  Settings,
  Home,
  FileText,
  Globe,
  MessageSquare,
  Shield,
  Edit3,
  Building,
  Target,
  Newspaper
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const adminItems = [
  { title: "Dashboard", url: "/admin", icon: BarChart3, exact: true },
  { title: "CRM B2C", url: "/admin/crm", icon: Target },
  { title: "Blog SEO", url: "/admin/blog-seo", icon: Newspaper },
  { title: "Utilisateurs", url: "/admin/users", icon: Users },
  { title: "Groupes", url: "/admin/groups", icon: MapPin },
  { title: "Gérants de Bar", url: "/admin/bar-owners", icon: Building },
  { title: "Messages", url: "/admin/messages", icon: MessageSquare },
  { title: "Contenu Site", url: "/admin/content", icon: Edit3 },
  { title: "Audit", url: "/admin/audit", icon: Shield },
  { title: "Activité", url: "/admin/activity", icon: Activity },
  { title: "Logs", url: "/admin/logs", icon: FileText },
  { title: "Analytics API", url: "/admin/api", icon: Globe },
  { title: "Paramètres", url: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string, exact = false) => 
    exact ? currentPath === path : currentPath.startsWith(path);

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-red-100 text-red-800 font-medium" : "hover:bg-red-50 text-red-700";

  return (
    <Sidebar className="w-60">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-red-800">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/dashboard" className="hover:bg-red-50 text-red-700">
                    <Home className="mr-2 h-4 w-4" />
                    <span>Retour App</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-red-800">Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.exact}
                      className={getNavCls}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}