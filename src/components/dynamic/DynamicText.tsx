import { useDynamicContent } from '@/hooks/useDynamicContent';
import { Skeleton } from '@/components/ui/skeleton';

interface DynamicTextProps {
  contentKey: string;
  fallback?: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  children?: React.ReactNode;
}

export const DynamicText = ({ 
  contentKey, 
  fallback = '', 
  as: Component = 'span',
  className,
  children 
}: DynamicTextProps) => {
  const { getContent, loading } = useDynamicContent();

  if (loading) {
    return <Skeleton className={`h-4 w-24 ${className}`} />;
  }

  const content = getContent(contentKey, fallback);

  return (
    <Component className={className}>
      {content || children}
    </Component>
  );
};