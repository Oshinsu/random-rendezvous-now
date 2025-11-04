/**
 * Image optimization utilities for Supabase Storage
 * Provides responsive images with WebP format and quality optimization
 */

interface ImageOptions {
  width?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'origin';
}

/**
 * Get optimized image URL with Supabase Storage transformations
 */
export const getOptimizedImageUrl = (
  url: string, 
  options: ImageOptions = {}
): string => {
  if (!url) return '';
  
  // Don't optimize local assets
  if (url.startsWith('/src/') || url.startsWith('/assets/')) {
    return url;
  }
  
  const { width = 800, quality = 80, format = 'webp' } = options;
  
  // Supabase Storage image transformation
  if (url.includes('supabase.co')) {
    const params = new URLSearchParams();
    if (width) params.append('width', width.toString());
    if (quality) params.append('quality', quality.toString());
    if (format !== 'origin') params.append('format', format);
    
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${params.toString()}`;
  }
  
  // Unsplash optimization (native parameters)
  if (url.includes('unsplash.com')) {
    const urlObj = new URL(url);
    urlObj.searchParams.set('w', width.toString());
    urlObj.searchParams.set('q', quality.toString());
    if (format === 'webp') urlObj.searchParams.set('fm', 'webp');
    return urlObj.toString();
  }
  
  // Return URL as-is for other sources
  return url;
};

/**
 * Generate responsive image srcSet for different screen sizes
 */
export const getResponsiveImageSrcSet = (url: string): string => {
  if (!url || url.startsWith('/src/') || url.startsWith('/assets/')) {
    return '';
  }
  
  // Only generate srcSet for optimizable sources
  if (!url.includes('supabase.co') && !url.includes('unsplash.com')) {
    return '';
  }
  
  return [
    `${getOptimizedImageUrl(url, { width: 400, quality: 75 })} 400w`,
    `${getOptimizedImageUrl(url, { width: 800, quality: 80 })} 800w`,
    `${getOptimizedImageUrl(url, { width: 1200, quality: 85 })} 1200w`,
    `${getOptimizedImageUrl(url, { width: 1600, quality: 85 })} 1600w`,
  ].join(', ');
};

/**
 * Get sizes attribute for responsive images
 */
export const getImageSizes = (priority?: boolean): string => {
  if (priority) {
    return '100vw'; // Full width for priority images (hero)
  }
  return '(max-width: 640px) 400px, (max-width: 1024px) 800px, 1200px';
};
