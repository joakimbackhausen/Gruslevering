import { useState, useCallback } from 'react';

interface SmartImageProps {
  src: string;
  alt: string;
  className?: string;
}

const FALLBACK_IMAGE = '/placeholder-product.svg';

/**
 * Lazy-loaded image with fallback placeholder.
 * Supports Strapi media URLs and direct gruslevering.dk URLs.
 */
export default function SmartImage({ src, alt, className = '' }: SmartImageProps) {
  const [error, setError] = useState(false);

  const handleError = useCallback(() => {
    setError(true);
  }, []);

  return (
    <img
      src={error ? FALLBACK_IMAGE : src}
      alt={alt}
      onError={handleError}
      className={className}
      loading="lazy"
    />
  );
}
