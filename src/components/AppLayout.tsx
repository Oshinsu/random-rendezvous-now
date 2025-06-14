
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <header className="flex h-16 shrink-0 items-center gap-4 border-b border-slate-200/60 px-6 bg-white/80 backdrop-blur-sm">
            <SidebarTrigger className="text-slate-700 hover:bg-slate-100 transition-colors" />
            <div className="ml-auto">
              <h1 className="text-xl font-semibold bg-gradient-to-r from-amber-600 to-amber-800 bg-clip-text text-transparent">
                Random App
              </h1>
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
