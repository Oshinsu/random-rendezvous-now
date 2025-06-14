
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-white via-amber-50/30 to-amber-100/20">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-amber-200/20 bg-white/60 backdrop-blur-sm px-4">
            <SidebarTrigger className="text-amber-700 hover:bg-amber-100" />
            <div className="ml-auto flex items-center space-x-4">
              <div className="text-sm text-amber-700">
                Bienvenue dans l'aventure Random
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
