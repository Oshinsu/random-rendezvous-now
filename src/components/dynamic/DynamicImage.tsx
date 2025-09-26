import { useDynamicContent } from '@/hooks/useDynamicContent';
import { Skeleton } from '@/components/ui/skeleton';

interface DynamicImageProps {
  contentKey: string;
  fallback?: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const DynamicImage = ({ 
  contentKey, 
  fallback = '', 
  alt = '',
  className,
  style
}: DynamicImageProps) => {
  const { getContent, loading } = useDynamicContent();

  if (loading) {
    return <Skeleton className={`h-32 w-full ${className}`} />;
  }

  const imageSrc = getContent(contentKey, fallback);

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      style={style}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        if (fallback && target.src !== fallback) {
          target.src = fallback;
        }
      }}
    />
  );
};