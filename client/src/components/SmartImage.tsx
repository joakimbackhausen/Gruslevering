import { useState, useCallback, useMemo } from 'react';

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
  /** Desired display width — used for srcset and proxy resizing */
  width?: number;
  /** Custom sizes attribute for responsive images */
  sizes?: string;
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
  sizes,
  priority = false,
}: SmartImageProps) {
  const [error, setError] = useState(false);

  const handleError = useCallback(() => {
    setError(true);
  }, []);

  // Generate srcset for responsive loading
  const { imgSrc, srcSet, imgSizes } = useMemo(() => {
    if (!src || error) return { imgSrc: FALLBACK_IMAGE, srcSet: undefined, imgSizes: undefined };
    if (src.startsWith('/') || src.startsWith('data:')) return { imgSrc: src, srcSet: undefined, imgSizes: undefined };

    const w1 = Math.min(width, 400);
    const w2 = Math.min(width, 800);
    const w3 = Math.min(width * 2, 1600);

    // For small display sizes, only generate 1x and 2x
    if (width <= 250) {
      return {
        imgSrc: optimizedUrl(src, width),
        srcSet: `${optimizedUrl(src, width)} ${width}w, ${optimizedUrl(src, Math.min(width * 2, 800))} ${Math.min(width * 2, 800)}w`,
        imgSizes: sizes || `(max-width: 640px) 50vw, ${width}px`,
      };
    }

    return {
      imgSrc: optimizedUrl(src, w1),
      srcSet: `${optimizedUrl(src, w1)} ${w1}w, ${optimizedUrl(src, w2)} ${w2}w, ${optimizedUrl(src, w3)} ${w3}w`,
      imgSizes: sizes || `(max-width: 640px) 50vw, ${width}px`,
    };
  }, [src, width, error, sizes]);

  return (
    <img
      src={imgSrc}
      srcSet={srcSet}
      sizes={imgSizes}
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
