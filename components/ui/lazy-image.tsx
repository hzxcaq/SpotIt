"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Package } from 'lucide-react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: React.ReactNode;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  threshold?: number;
}

export function LazyImage({
  src,
  alt,
  className = "",
  placeholder,
  onLoad,
  onError,
  threshold = 0.1
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // 清理函数
  const cleanup = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const element = imgRef.current;
    if (!element) return;

    // 创建 Intersection Observer
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          cleanup(); // 一旦进入视口就停止观察
        }
      },
      { threshold }
    );

    observerRef.current.observe(element);

    return cleanup;
  }, [threshold, cleanup]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    const error = new Error(`Failed to load image: ${src}`);
    onError?.(error);
  }, [src, onError]);

  const defaultPlaceholder = (
    <div className="flex items-center justify-center bg-muted text-muted-foreground">
      <Package className="size-8" />
    </div>
  );

  return (
    <div ref={imgRef} className={className}>
      {hasError ? (
        <div className="flex items-center justify-center bg-muted text-muted-foreground">
          <Package className="size-8" />
        </div>
      ) : isInView ? (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      ) : (
        placeholder || defaultPlaceholder
      )}
    </div>
  );
}

/**
 * 专门用于物品缩略图的优化组件
 */
interface ItemThumbnailProps {
  imageUrl?: string;
  itemName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ItemThumbnail({
  imageUrl,
  itemName,
  size = 'md',
  className = ""
}: ItemThumbnailProps) {
  const sizeClasses = {
    sm: 'size-8',
    md: 'size-12',
    lg: 'size-16'
  };

  const iconSizes = {
    sm: 'size-4',
    md: 'size-6',
    lg: 'size-8'
  };

  const baseClasses = `${sizeClasses[size]} rounded-lg overflow-hidden ${className}`;

  if (!imageUrl) {
    return (
      <div className={`${baseClasses} flex items-center justify-center bg-muted text-muted-foreground`}>
        <Package className={iconSizes[size]} />
      </div>
    );
  }

  return (
    <LazyImage
      src={imageUrl}
      alt={itemName}
      className={baseClasses}
      placeholder={
        <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground animate-pulse">
          <Package className={iconSizes[size]} />
        </div>
      }
    />
  );
}