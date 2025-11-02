import { useLocation, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

const routeLabels: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/users': 'Users Management',
  '/admin/crm': 'CRM Campaigns',
  '/admin/push-notifications': 'Push Notifications',
  '/admin/groups': 'Groups Monitor',
  '/admin/bar-owners': 'Bar Owners',
  '/admin/api': 'API Analytics',
  '/admin/logs': 'Logs & Audit',
  '/admin/settings': 'Settings',
  '/admin/content': 'Content Management',
  '/admin/messages': 'Messages Templates',
  '/admin/activity': 'Activity Monitor',
  '/admin/test': 'Test & Diagnostics',
  '/admin/audit': 'Audit Trail',
  '/admin/realtime-monitor': 'Realtime Monitor',
  '/admin/community-stories': 'Community Stories',
  '/admin/blog-seo': 'Blog SEO',
  '/admin/chatbot': 'Chatbot Analytics',
};

export const AdminBreadcrumbs = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  if (pathSegments.length <= 1) return null;

  const breadcrumbItems = pathSegments.map((segment, index) => {
    const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
    const label = routeLabels[path] || segment;
    const isLast = index === pathSegments.length - 1;

    return { path, label, isLast };
  });

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/admin">Admin</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {breadcrumbItems.slice(1).map((item, index) => (
          <div key={item.path} className="flex items-center">
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              {item.isLast ? (
                <span className="text-foreground font-medium">{item.label}</span>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={item.path}>{item.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
