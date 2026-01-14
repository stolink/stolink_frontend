import { useState, useEffect, useRef, startTransition } from "react";
import type { Character } from "@/types";

/**
 * 캐릭터 이미지 프리로딩 및 캐싱 훅
 * Canvas에서 사용할 HTMLImageElement를 미리 로드하여 성능 향상
 */
export function useImageCache(characters: Character[]) {
  const [cache, setCache] = useState<Map<string, HTMLImageElement>>(new Map());
  const cacheRef = useRef(cache);

  // ref를 최신 상태로 동기화
  useEffect(() => {
    cacheRef.current = cache;
  }, [cache]);

  useEffect(() => {
    const currentCache = cacheRef.current;
    const newCache = new Map<string, HTMLImageElement>();
    const promises: Promise<void>[] = [];

    characters.forEach((char) => {
      const imageUrl = char.imageUrl;
      if (!imageUrl) return;

      // 이미 캐시된 이미지는 재사용
      if (currentCache.has(imageUrl)) {
        newCache.set(imageUrl, currentCache.get(imageUrl)!);
        return;
      }

      // 새 이미지 로드
      promises.push(
        new Promise<void>((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous"; // CORS 처리

          img.onload = () => {
            newCache.set(imageUrl, img);
            resolve();
          };

          img.onerror = () => {
            console.warn(`[useImageCache] Error: ${imageUrl}`);
            resolve();
          };

          img.src = imageUrl;
        }),
      );
    });

    // 모든 이미지 로드 완료 후 캐시 업데이트
    if (promises.length > 0) {
      Promise.all(promises).then(() => {
        setCache((prev) => new Map([...prev, ...newCache]));
      });
    } else if (newCache.size > 0) {
      // 이미 모든 이미지가 캐시되어 있었던 경우에도 동기화가 필요할 수 있음
      startTransition(() => {
        setCache((prev) => {
          const next = new Map(prev);
          newCache.forEach((v, k) => next.set(k, v));
          return next;
        });
      });
    }
  }, [characters]);

  return cache;
}
