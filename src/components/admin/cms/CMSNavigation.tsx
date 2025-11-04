import { NavLink } from 'react-router-dom';
import { Layout, Target, Zap, Globe, LayoutDashboard } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const CMSNavigation = () => {
  const navItems = [
    { label: '📊 Dashboard', path: '/admin/content', icon: LayoutDashboard, exact: true },
    { label: '🎯 Hero', path: '/admin/content/hero', icon: Layout, section: 'hero' },
    { label: '✨ Benefits', path: '/admin/content/benefits', icon: Target, section: 'benefits' },
    { label: '⚡ How It Works', path: '/admin/content/how-it-works', icon: Zap, section: 'how_it_works' },
    { label: '🌍 Footer', path: '/admin/content/footer', icon: Globe, section: 'footer' },
  ];

  return (
    <Card className="p-1 bg-muted/30">
      <nav className="flex gap-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-background text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`
            }
          >
            <item.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </Card>
  );
};