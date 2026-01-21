"use client";

import { useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

/**
 * 安全的 useLiveQuery Hook，防止内存泄漏
 * 在组件卸载时自动清理订阅
 */
export function useSafeLiveQuery<T>(
  querier: () => Promise<T> | T,
  deps?: any[]
): T | undefined {
  const mountedRef = useRef(true);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      // 执行清理函数
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, []);

  // 包装 querier 以添加挂载状态检查
  const safeQuerier = () => {
    if (!mountedRef.current) {
      return undefined as T;
    }
    return querier();
  };

  const result = useLiveQuery(safeQuerier, deps);

  // 只在组件仍然挂载时返回结果
  return mountedRef.current ? result : undefined;
}

/**
 * 带有错误处理的安全 useLiveQuery Hook
 */
export function useSafeLiveQueryWithError<T>(
  querier: () => Promise<T> | T,
  deps?: any[],
  onError?: (error: Error) => void
): { data: T | undefined; error: Error | null; loading: boolean } {
  const mountedRef = useRef(true);
  const errorRef = useRef<Error | null>(null);
  const loadingRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const safeQuerier = async () => {
    if (!mountedRef.current) {
      return undefined as T;
    }

    try {
      loadingRef.current = true;
      errorRef.current = null;
      const result = await querier();
      loadingRef.current = false;
      return result;
    } catch (error) {
      if (mountedRef.current) {
        const err = error instanceof Error ? error : new Error(String(error));
        errorRef.current = err;
        loadingRef.current = false;

        if (onError) {
          onError(err);
        }
      }
      return undefined as T;
    }
  };

  const result = useLiveQuery(safeQuerier, deps);

  return {
    data: mountedRef.current ? result : undefined,
    error: errorRef.current,
    loading: loadingRef.current
  };
}

/**
 * 用于图片数据的专用 Hook，包含内存优化
 */
export function useImageData(imageId: string | undefined) {
  const mountedRef = useRef(true);
  const imageCache = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      // 清理图片缓存
      imageCache.current.clear();
    };
  }, []);

  const querier = async () => {
    if (!imageId || !mountedRef.current) {
      return undefined;
    }

    // 检查缓存
    if (imageCache.current.has(imageId)) {
      return imageCache.current.get(imageId);
    }

    // 从数据库获取
    const { imagesRepo } = await import('@/lib/db');
    const image = await imagesRepo.getById(imageId);

    if (image && mountedRef.current) {
      // 缓存图片数据
      imageCache.current.set(imageId, image.dataUrl);
      return image.dataUrl;
    }

    return undefined;
  };

  return useSafeLiveQuery(querier, [imageId]);
}