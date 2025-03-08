"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  objectFit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 85,
  objectFit = 'cover',
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(!priority);
  const [error, setError] = useState<Error | null>(null);

  const handleLoad = () => {
    setIsLoading(false);
    if (onLoad) onLoad();
  };

  const handleError = (error: Error) => {
    setIsLoading(false);
    setError(error);
    if (onError) onError(error);
  };

  // Skip loading state for cached images
  useEffect(() => {
    if (src) {
      const img = new window.Image();
      img.src = src;
      if (img.complete) {
        setIsLoading(false);
      }
    }
  }, [src]);

  // Show error state if image failed to load
  if (error) {
    return (
      <div 
        className={cn(
          'flex items-center justify-center bg-muted rounded-md',
          className
        )} 
        style={{ width, height }}
      >
        <span className="text-sm text-muted-foreground">
          Failed to load image
        </span>
      </div>
    );
  }

  return (
    <div 
      className={cn('relative overflow-hidden', className)} 
      style={{ width, height }}
    >
      {isLoading && (
        <Skeleton 
          className="absolute inset-0 z-10 rounded-md" 
        />
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          'rounded-md transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100'
        )}
        priority={priority}
        sizes={sizes}
        quality={quality}
        onLoad={handleLoad}
        onError={() => handleError(new Error('Failed to load image'))}
        style={{ objectFit }}
      />
    </div>
  );
}