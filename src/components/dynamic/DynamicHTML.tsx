import { useDynamicContent } from '@/hooks/useDynamicContent';
import { Skeleton } from '@/components/ui/skeleton';

interface DynamicHTMLProps {
  contentKey: string;
  fallback?: string;
  className?: string;
  sanitize?: boolean;
}

export const DynamicHTML = ({ 
  contentKey, 
  fallback = '', 
  className,
  sanitize = true
}: DynamicHTMLProps) => {
  const { getContent, loading } = useDynamicContent();

  if (loading) {
    return <Skeleton className={`h-20 w-full ${className}`} />;
  }

  const htmlContent = getContent(contentKey, fallback);

  // Sanitisation basique si activée
  const sanitizedContent = sanitize 
    ? htmlContent
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+="[^"]*"/gi, '')
    : htmlContent;

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};