import { Link } from 'wouter';
import SmartImage from '@/components/SmartImage';
import { useCart } from '@/contexts/CartContext';
import type { Product } from '@/types/product';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    minimumFractionDigits: 0,
  }).format(price);

/**
 * Shared product card used across Home, Shop, and other pages.
 * Matches the Plantorama-style design from the homepage.
 */
export default function ProductCard({ product }: { product: Product }) {
  const productUrl = `/produkt/${product.slug || product.id}`;
  const hasVariants = product.variants && product.variants.length > 0;
  const effectivePrice = product.salePrice ?? product.basePrice;
  const isOnSale = product.salePrice !== null && product.salePrice < product.basePrice;

  const { addItem, setIsOpen } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasVariants) return;
    addItem({
      id: product.id,
      wcProductId: product.wcId ?? undefined,
      title: product.title,
      price: effectivePrice,
      image: product.image,
      sku: product.sku,
      unit: product.unit,
      tieredPricing: product.tieredPricing,
    });
    setIsOpen(true);
  };

  return (
    <Link
      href={productUrl}
      className="group block bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gray-200 hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {product.image ? (
          <SmartImage
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
            width={250}
            sizes="(max-width: 640px) 45vw, 260px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300 text-sm">
            Ingen billede
          </div>
        )}
        {isOnSale && (
          <span className="absolute top-2 left-2 bg-[var(--grus-accent)] text-white text-[11px] font-bold rounded-md px-2 py-0.5">
            TILBUD
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3 pb-2">
        <h3 className="text-[13px] font-medium text-gray-800 line-clamp-2 min-h-[2.5em] leading-snug">
          {product.title}
        </h3>
        <div className="mt-1.5 flex items-baseline gap-2">
          {isOnSale ? (
            <>
              <span className="text-[15px] font-bold text-[var(--grus-accent)]">
                {hasVariants ? 'Fra ' : ''}
                {formatPrice(product.salePrice!)}
              </span>
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(product.basePrice)}
              </span>
            </>
          ) : (
            <span className="text-[15px] font-bold text-gray-900">
              {hasVariants ? 'Fra ' : ''}
              {formatPrice(effectivePrice)}
            </span>
          )}
        </div>
        {product.deliveryIncluded && (
          <p className="text-[11px] text-green-600 mt-0.5 font-medium">inkl. levering</p>
        )}
      </div>

      {/* Button */}
      <div className="px-3 pb-3">
        {hasVariants ? (
          <span
            className="block w-full text-center py-2.5 rounded-lg text-[13px] font-semibold text-white transition-colors"
            style={{ backgroundColor: 'var(--grus-green)' }}
          >
            Vælg variant &rarr;
          </span>
        ) : (
          <button
            onClick={handleAddToCart}
            className="w-full py-2.5 rounded-lg text-[13px] font-semibold text-white transition-colors cursor-pointer"
            style={{ backgroundColor: 'var(--grus-green)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--grus-green-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--grus-green)')}
          >
            Læg i kurv
          </button>
        )}
      </div>
    </Link>
  );
}
