import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Shield } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-red-50 via-white to-orange-50">
        <AdminSidebar />
        <SidebarInset className="flex-1">
          <header className="flex h-16 sm:h-20 shrink-0 items-center gap-3 sm:gap-6 border-b border-red-200/50 px-3 sm:px-4 md:px-8 bg-white/80 backdrop-blur-sm">
            <SidebarTrigger className="text-red-700 hover:bg-red-50 hover:text-red-800 transition-all duration-300 rounded-xl p-1.5 sm:p-2" />
            <div className="ml-auto flex items-center gap-2 sm:gap-4">
              <Shield className="h-8 w-8 text-red-600" />
              <h1 className="text-lg sm:text-2xl font-display font-bold text-red-800">Admin Dashboard</h1>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};