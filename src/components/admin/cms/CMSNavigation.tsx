import { NavLink } from 'react-router-dom';
import { FileText, Image, Layout, Settings } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const CMSNavigation = () => {
  const navItems = [
    { label: 'Tous', path: '/admin/content', icon: Layout, exact: true },
    { label: 'Textes', path: '/admin/content/texts', icon: FileText },
    { label: 'Images', path: '/admin/content/images', icon: Image },
    { label: 'Templates', path: '/admin/content/templates', icon: Settings },
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