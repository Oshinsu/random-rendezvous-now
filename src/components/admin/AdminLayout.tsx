import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { CommandPalette } from './CommandPalette';
import { NotificationCenter } from './NotificationCenter';
import { AdminBreadcrumbs } from './Breadcrumbs';
import { Keyboard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <CommandPalette />
      <div className="min-h-screen flex w-full bg-gradient-to-br from-red-50 via-white to-orange-50">
        <AdminSidebar />
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="text-primary hover:bg-primary/10" />
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <Keyboard className="h-3 w-3" />
                  Cmd+K
                </Badge>
              </div>
            </div>
            <NotificationCenter />
          </header>
          <main className="flex-1 overflow-auto p-6">
            <AdminBreadcrumbs />
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};