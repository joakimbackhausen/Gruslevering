import { useState, useCallback, useMemo } from 'react';

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  /** Desired display width — used for srcset and proxy resizing */
  width?: number;
  /** Priority image (above the fold) — disables lazy loading */
  priority?: boolean;
}

const FALLBACK_IMAGE = '/placeholder-product.svg';

/**
 * Build an optimised image URL via /api/img proxy.
 * Converts to WebP, resizes, and caches for 7 days.
 */
function optimizedUrl(src: string, w: number): string {
  if (!src || src.startsWith('/') || src.startsWith('data:')) return src;
  return `/api/img?url=${encodeURIComponent(src)}&w=${w}`;
}

/**
 * Lazy-loaded, responsive image with WebP proxy and fallback.
 */
export default function SmartImage({
  src,
  alt,
  className = '',
  width = 400,
  priority = false,
}: SmartImageProps) {
  const [error, setError] = useState(false);

  const handleError = useCallback(() => {
    setError(true);
  }, []);

  // Generate srcset for 1x and 2x
  const { imgSrc, srcSet } = useMemo(() => {
    if (!src || error) return { imgSrc: FALLBACK_IMAGE, srcSet: undefined };
    if (src.startsWith('/') || src.startsWith('data:')) return { imgSrc: src, srcSet: undefined };

    const w1 = width;
    const w2 = Math.min(width * 2, 1600);
    return {
      imgSrc: optimizedUrl(src, w1),
      srcSet: `${optimizedUrl(src, w1)} ${w1}w, ${optimizedUrl(src, w2)} ${w2}w`,
    };
  }, [src, width, error]);

  return (
    <img
      src={imgSrc}
      srcSet={srcSet}
      sizes={`(max-width: 640px) 50vw, ${width}px`}
      alt={alt}
      onError={handleError}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : undefined}
      width={width}
      height={width}
    />
  );
}
