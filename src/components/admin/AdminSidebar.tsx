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
  Newspaper,
  TestTube,
  Bot,
  Bell
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

const adminSections = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/admin", icon: BarChart3, exact: true },
    ]
  },
  {
    label: "Users & Engagement",
    items: [
      { title: "Users Management", url: "/admin/users", icon: Users },
      { title: "Community Stories", url: "/admin/community-stories", icon: MessageSquare },
    ]
  },
  {
    label: "Marketing & Campaigns",
    items: [
      { title: "CRM Campaigns", url: "/admin/crm", icon: Target },
      { title: "Push Notifications", url: "/admin/push-notifications", icon: Bell },
      { title: "Blog SEO", url: "/admin/blog-seo", icon: Newspaper },
    ]
  },
  {
    label: "Operations",
    items: [
      { title: "Groups Monitor", url: "/admin/groups", icon: MapPin },
      { title: "Bar Owners", url: "/admin/bar-owners", icon: Building },
      { title: "Activity Monitor", url: "/admin/activity", icon: Activity },
    ]
  },
  {
    label: "System & Dev",
    items: [
      { title: "API Analytics", url: "/admin/api", icon: Globe },
      { title: "Logs & Audit", url: "/admin/logs", icon: FileText },
      { title: "Test & Diagnostics", url: "/admin/test", icon: TestTube },
      { title: "Settings", url: "/admin/settings", icon: Settings },
    ]
  },
  {
    label: "Content Management",
    items: [
      { title: "Site Content", url: "/admin/content", icon: Edit3 },
      { title: "Messages Templates", url: "/admin/messages", icon: MessageSquare },
      { title: "Chatbot Analytics", url: "/admin/chatbot", icon: Bot },
    ]
  },
];

export function AdminSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-accent text-foreground";

  return (
    <Sidebar className="border-r">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/dashboard">
                    <Home className="h-4 w-4" />
                    <span>Return to App</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {adminSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        end={item.exact}
                        className={getNavCls}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}