
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import RandomLogo from './RandomLogo';
import { useIsMobile } from '@/hooks/use-mobile';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-neutral-50 via-white to-brand-50">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <header className="flex h-16 sm:h-20 shrink-0 items-center gap-3 sm:gap-6 border-b border-neutral-200/50 px-3 sm:px-4 md:px-8 glass-morphism">
            <SidebarTrigger className="text-neutral-700 hover:bg-brand-50 hover:text-brand-700 transition-all duration-300 rounded-xl p-1.5 sm:p-2" />
            <div className="ml-auto flex items-center gap-2 sm:gap-4">
              <RandomLogo size={isMobile ? 35 : 47} withAura />
              <h1 className="text-lg sm:text-2xl font-display font-bold gradient-text ml-1 drop-shadow-glow-gold">Random</h1>
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
