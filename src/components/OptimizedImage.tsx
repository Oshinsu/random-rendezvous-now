import { useState } from 'react';
import { getOptimizedImageUrl, getResponsiveImageSrcSet, getImageSizes } from '@/utils/imageOptimization';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  width?: number;
  quality?: number;
}

/**
 * Optimized image component with:
 * - Responsive srcSet for different screen sizes
 * - WebP format for better compression
 * - Lazy loading (except for priority images)
 * - Loading placeholder with fade-in effect
 */
export const OptimizedImage = ({ 
  src, 
  alt, 
  className = '', 
  priority = false,
  width,
  quality
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // For local assets, use them directly
  const isLocalAsset = src.startsWith('/src/') || src.startsWith('/assets/');
  
  if (isLocalAsset) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />
    );
  }
  
  const optimizedSrc = getOptimizedImageUrl(src, { width, quality });
  const srcSet = getResponsiveImageSrcSet(src);
  const sizes = getImageSizes(priority);
  
  return (
    <div className={`relative ${className}`}>
      {/* Loading placeholder */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-br from-brand-100 to-brand-200 animate-pulse rounded-inherit" />
      )}
      
      {/* Optimized image */}
      {!hasError && (
        <img
          src={optimizedSrc}
          srcSet={srcSet || undefined}
          sizes={sizes}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            setHasError(true);
            console.error(`Failed to load optimized image: ${src}`);
          }}
          className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        />
      )}
      
      {/* Fallback for error */}
      {hasError && (
        <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/10 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Image unavailable</p>
        </div>
      )}
    </div>
  );
};
