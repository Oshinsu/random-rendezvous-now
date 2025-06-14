
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Crown } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-white via-yellow-50/20 to-yellow-100/10">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <header className="flex h-20 shrink-0 items-center gap-4 border-b-2 border-yellow-200/30 glass-luxury backdrop-blur-lg px-8 shadow-lg">
            <SidebarTrigger className="text-yellow-800 hover:bg-yellow-100 p-3 rounded-xl transition-all duration-300" />
            <div className="ml-auto flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <Crown className="h-8 w-8 text-yellow-600 luxury-shimmer" />
                <div className="text-xl text-yellow-800 font-luxury font-bold">
                  Bienvenue dans l'Expérience Premium
                </div>
              </div>
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

export default AppLayout;
