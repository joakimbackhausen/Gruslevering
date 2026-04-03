import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import {
  Loader2,
  Minus,
  Plus,
  Check,
  ChevronRight,
  Tag,
  Truck,
  ShieldCheck,
  Package,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/contexts/CartContext';
import type { Product, TieredPrice } from '@/types/product';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    minimumFractionDigits: 0,
  }).format(price);

function formatPriceDecimal(price: number): string {
  return price.toLocaleString('da-DK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function ProductCard({ product }: { product: Product }) {
  const productUrl = `/produkt/${product.slug || product.id}`;
  const hasVariants = product.variants && product.variants.length > 0;
  const effectivePrice = product.salePrice ?? product.basePrice;
  const isOnSale = product.salePrice !== null && product.salePrice < product.basePrice;

  return (
    <Link
      href={productUrl}
      className="group block bg-white rounded-xl overflow-hidden transition-all duration-200 hover:shadow-md"
      style={{ border: '1px solid var(--grus-border)' }}
    >
      <div className="relative aspect-square p-3" style={{ backgroundColor: 'var(--grus-sand)' }}>
        {product.image ? (
          <img
            src={product.image}
            alt={product.title}
            loading="lazy"
            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
            Ingen billede
          </div>
        )}
        {isOnSale && (
          <span className="absolute top-2 right-2 bg-[var(--grus-accent)] text-white text-xs font-medium rounded-md px-2 py-0.5">
            Tilbud
          </span>
        )}
      </div>
      <div className="p-4">
        <span className="text-xs text-[var(--grus-green)] font-medium uppercase tracking-wide">
          {product.category}
        </span>
        <h3 className="text-sm font-semibold text-[var(--grus-dark)] mt-1 line-clamp-2 leading-snug">
          {product.title}
        </h3>
        <div className="mt-2">
          {isOnSale ? (
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-[var(--grus-dark)]">
                {formatPrice(product.salePrice!)}
              </span>
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(product.basePrice)}
              </span>
            </div>
          ) : (
            <span className="text-base font-bold text-[var(--grus-dark)]">
              {hasVariants ? 'Fra ' : ''}
              {formatPrice(effectivePrice)}
            </span>
          )}
        </div>
      </div>
      <div className="px-4 pb-4">
        <span className="text-sm text-[var(--grus-green)] font-medium group-hover:underline">
          Se produkt
        </span>
      </div>
    </Link>
  );
}

export default function ProductDetail() {
  const params = useParams<{ id: string }>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [addedToCart, setAddedToCart] = useState(false);
  const { addItem } = useCart();

  const {
    data: product,
    isLoading,
    error,
  } = useQuery<Product>({
    queryKey: ['product', params.id],
    queryFn: async () => {
      const res = await fetch(`/api/products/${params.id}`);
      if (!res.ok) throw new Error('Produktet blev ikke fundet');
      return res.json();
    },
    enabled: !!params.id,
  });

  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    queryFn: async () => {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    },
  });

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return allProducts
      .filter((p) => p.categorySlug === product.categorySlug && p.id !== product.id)
      .slice(0, 4);
  }, [allProducts, product]);

  const currentPrice = useMemo(() => {
    if (!product) return 0;
    let price = product.salePrice ?? product.basePrice;
    for (const group of product.variants ?? []) {
      const selected = selectedVariants[group.label];
      const option = group.options.find((o) => o.name === selected);
      if (option) price += option.priceDiff;
    }
    return price;
  }, [product, selectedVariants]);

  const allVariantsSelected = useMemo(() => {
    if (!product?.variants || product.variants.length === 0) return true;
    return product.variants.every((group) => selectedVariants[group.label]);
  }, [product, selectedVariants]);

  const tieredPrice = useMemo((): number | null => {
    if (!product?.tieredPricing || product.tieredPricing.length === 0) return null;
    const tier = product.tieredPricing.find(
      (t) => quantity >= t.minQty && (t.maxQty === null || quantity <= t.maxQty),
    );
    return tier ? tier.price : null;
  }, [product, quantity]);

  const effectivePrice = tieredPrice ?? currentPrice;
  const totalPrice = effectivePrice * quantity;

  const lowestPrice = useMemo(() => {
    if (!product) return 0;
    const base = product.salePrice ?? product.basePrice;
    if (!product.variants || product.variants.length === 0) return base;
    let minAdd = 0;
    for (const group of product.variants) {
      const minOption = group.options.reduce(
        (min, o) => (o.priceDiff < min ? o.priceDiff : min),
        Infinity,
      );
      if (minOption !== Infinity) minAdd += minOption;
    }
    return base + minAdd;
  }, [product]);

  useEffect(() => {
    setCurrentImageIndex(0);
    setSelectedVariants({});
    setQuantity(1);
  }, [params.id]);

  const handleAddToCart = () => {
    if (!product) return;
    if (product.variants && product.variants.length > 0 && !allVariantsSelected) return;

    const variantString = Object.values(selectedVariants).join(' / ');
    addItem({
      id: product.id,
      title: product.title,
      price: effectivePrice,
      image: product.image,
      sku: product.sku,
      variant: variantString || undefined,
      variantSelections:
        Object.keys(selectedVariants).length > 0 ? selectedVariants : undefined,
      unit: product.unit,
      tieredPricing: product.tieredPricing,
    });

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main
          className="flex-1 flex items-center justify-center"
          style={{ paddingTop: 'var(--header-h, 124px)' }}
        >
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </main>
        <Footer />
      </div>
    );
  }

  // Error / Not found
  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main
          className="flex-1 flex flex-col items-center justify-center gap-4"
          style={{ paddingTop: 'var(--header-h, 124px)' }}
        >
          <p className="text-lg text-gray-500">
            {error instanceof Error ? error.message : 'Produktet blev ikke fundet'}
          </p>
          <Link
            href="/shop"
            className="text-sm font-medium text-[var(--grus-green)] hover:underline"
          >
            Tilbage til shop
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const images = product.images.length > 0 ? product.images : [product.image];
  const hasVariants = !!(product.variants && product.variants.length > 0);
  const isOnSale =
    product.salePrice !== null && product.salePrice < product.basePrice;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1" style={{ paddingTop: 'var(--header-h, 124px)' }}>
        {/* Breadcrumbs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
          <nav className="flex items-center gap-1 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-700 transition-colors">
              Forside
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/shop" className="hover:text-gray-700 transition-colors">
              Shop
            </Link>
            {product.category && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <Link
                  href={`/shop/${product.categorySlug}`}
                  className="hover:text-gray-700 transition-colors"
                >
                  {product.category}
                </Link>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-[var(--grus-dark)] font-medium truncate max-w-[200px]">
              {product.title}
            </span>
          </nav>
        </div>

        {/* Two columns */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid lg:grid-cols-[55fr_45fr] gap-8 lg:gap-12">
            {/* LEFT: Image Gallery */}
            <div className="min-w-0">
              {/* Main image */}
              <div className="aspect-square rounded-xl p-4 overflow-hidden" style={{ backgroundColor: 'var(--grus-sand)' }}>
                {images.length > 0 && images[0] ? (
                  <img
                    key={currentImageIndex}
                    src={images[currentImageIndex]}
                    alt={product.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                    Intet billede
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                  {images.map((src, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        index === currentImageIndex
                          ? 'ring-2 ring-[var(--grus-green)] border-[var(--grus-green)]'
                          : 'border-[var(--grus-border)] hover:border-gray-300 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={src}
                        alt={`Billede ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT: Product Info */}
            <div className="lg:sticky lg:top-32 lg:self-start">
              {/* Category badge */}
              {product.category && (
                <Link href={`/shop/${product.categorySlug}`}>
                  <span className="inline-block text-xs bg-[var(--grus-green-light)] text-[var(--grus-green)] px-3 py-1 rounded-full font-medium">
                    {product.category}
                  </span>
                </Link>
              )}

              {/* Title */}
              <h1 className="font-display text-2xl lg:text-3xl font-bold text-[var(--grus-dark)] mt-3 leading-tight">
                {product.title}
              </h1>

              {/* SKU */}
              {product.sku && (
                <p className="text-xs text-gray-400 mt-1">SKU: {product.sku}</p>
              )}

              {/* Price */}
              <div className="mt-4">
                {hasVariants && !allVariantsSelected ? (
                  <div className="text-3xl font-bold text-[var(--grus-dark)]">
                    Fra {formatPrice(lowestPrice)}
                  </div>
                ) : (
                  <div>
                    {isOnSale ? (
                      <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-bold text-[var(--grus-dark)]">
                          {formatPrice(effectivePrice)}
                        </span>
                        <span className="text-lg line-through text-gray-400">
                          {formatPrice(product.basePrice)}
                        </span>
                      </div>
                    ) : (
                      <div className="text-3xl font-bold text-[var(--grus-dark)]">
                        {formatPrice(effectivePrice)}
                      </div>
                    )}
                  </div>
                )}
                {product.deliveryIncluded && (
                  <p className="flex items-center gap-1.5 text-sm text-[var(--grus-green)] font-medium mt-2">
                    <Check className="w-4 h-4" />
                    Inkl. fri levering
                  </p>
                )}
              </div>

              {/* Variant selectors */}
              {hasVariants && (
                <div className="mt-6 space-y-5">
                  {product.variants!.map((group) =>
                    group.options.length > 0 ? (
                      <div key={group.label}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {group.label}
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {group.options.map((opt) => {
                            const isSelected =
                              selectedVariants[group.label] === opt.name;
                            const isOOS = !opt.inStock;
                            return (
                              <button
                                key={opt.name}
                                onClick={() =>
                                  setSelectedVariants((prev) => ({
                                    ...prev,
                                    [group.label]: opt.name,
                                  }))
                                }
                                disabled={isOOS}
                                className={`py-2.5 px-4 rounded-lg border text-sm font-medium text-center transition-all ${
                                  isSelected
                                    ? 'bg-[var(--grus-green)] text-white border-[var(--grus-green)]'
                                    : isOOS
                                      ? 'bg-white border-[var(--grus-border)] text-gray-300 opacity-40 line-through cursor-not-allowed'
                                      : 'bg-white border-[var(--grus-border)] text-gray-700 hover:border-[var(--grus-green)]'
                                }`}
                              >
                                <span>{opt.name}</span>
                                {opt.priceDiff !== 0 && !isOOS && (
                                  <span className="block text-xs mt-0.5 opacity-70">
                                    {opt.priceDiff > 0 ? '+' : ''}
                                    {formatPrice(opt.priceDiff)}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null,
                  )}
                </div>
              )}

              {/* Tiered pricing */}
              {product.tieredPricing && product.tieredPricing.length > 1 && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-4 h-4 text-[var(--grus-green)]" />
                    <span className="text-sm font-semibold text-[var(--grus-dark)]">
                      Spar ved at købe flere
                    </span>
                  </div>
                  <div className="border border-[var(--grus-border)] rounded-lg overflow-hidden">
                    <div className="grid grid-cols-3 text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-2.5 bg-gray-50 border-b border-[var(--grus-border)]">
                      <span>Antal</span>
                      <span className="text-right">Pris pr. stk</span>
                      <span className="text-right">Rabat</span>
                    </div>
                    {product.tieredPricing.map((tier: TieredPrice, idx: number) => {
                      const isActive =
                        quantity >= tier.minQty &&
                        (tier.maxQty === null || quantity <= tier.maxQty);
                      const basePrice = product.salePrice ?? product.basePrice;
                      const savingsPercent =
                        basePrice > 0
                          ? Math.round(((basePrice - tier.price) / basePrice) * 100)
                          : 0;
                      return (
                        <div
                          key={idx}
                          className={`grid grid-cols-3 px-4 py-3 text-sm border-b border-gray-100 last:border-0 transition-colors ${
                            isActive ? 'bg-[var(--grus-green-light)]' : 'bg-white'
                          }`}
                        >
                          <span
                            className={
                              isActive
                                ? 'font-semibold text-[var(--grus-green)]'
                                : 'text-gray-600'
                            }
                          >
                            {tier.maxQty === null
                              ? `${tier.minQty}+`
                              : tier.minQty === tier.maxQty
                                ? `${tier.minQty}`
                                : `${tier.minQty}\u2013${tier.maxQty}`}
                          </span>
                          <span
                            className={`text-right ${
                              isActive ? 'font-semibold text-[var(--grus-dark)]' : 'text-gray-600'
                            }`}
                          >
                            {formatPriceDecimal(tier.price)} kr
                          </span>
                          <span
                            className={`text-right ${
                              savingsPercent > 0
                                ? 'text-[var(--grus-green)] font-medium'
                                : 'text-gray-300'
                            }`}
                          >
                            {savingsPercent > 0
                              ? `\u2212${savingsPercent}%`
                              : '\u2014'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity + Add to cart */}
              <div className="mt-6 space-y-3">
                {/* Quantity selector */}
                <div className="flex items-center border border-[var(--grus-border)] rounded-lg overflow-hidden w-fit">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-11 h-11 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-500"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="w-14 h-11 text-center text-sm font-medium border-x border-[var(--grus-border)] focus:outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-11 h-11 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-500"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Add to cart button */}
                <button
                  onClick={handleAddToCart}
                  disabled={hasVariants && !allVariantsSelected}
                  className={`w-full py-3.5 px-6 rounded-xl font-semibold text-base transition-all duration-200 ${
                    addedToCart
                      ? 'bg-[var(--grus-green)] text-white'
                      : hasVariants && !allVariantsSelected
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-[var(--grus-green)] text-white hover:bg-[var(--grus-green-hover)] shadow-sm hover:shadow-md'
                  }`}
                >
                  {addedToCart ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <Check className="w-5 h-5" />
                      Tilføjet til kurv
                    </span>
                  ) : hasVariants && !allVariantsSelected ? (
                    'Vælg variant'
                  ) : (
                    `Læg i kurv \u2014 ${formatPrice(totalPrice)}`
                  )}
                </button>
              </div>

              {/* Delivery info box */}
              <div className="bg-[var(--grus-green-light)] rounded-xl p-4 mt-6 space-y-2.5">
                <div className="flex items-center gap-2.5 text-sm text-gray-700">
                  <Truck className="w-4 h-4 text-[var(--grus-green)] flex-shrink-0" />
                  <span>Fri levering i hele Danmark</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-gray-700">
                  <Package className="w-4 h-4 text-[var(--grus-green)] flex-shrink-0" />
                  <span>Typisk 3-5 hverdages levering</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-gray-700">
                  <ShieldCheck className="w-4 h-4 text-[var(--grus-green)] flex-shrink-0" />
                  <span>Leveres i bigbag med kran</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description section */}
          {product.description && (
            <div className="border-t border-[var(--grus-border)] mt-12 pt-8">
              <h2 className="font-display text-xl lg:text-2xl font-bold text-[var(--grus-dark)] mb-4">
                Produktbeskrivelse
              </h2>
              <div
                className="prose prose-gray max-w-3xl text-sm text-gray-600 leading-relaxed [&_br]:my-1 prose-headings:font-display prose-headings:text-[var(--grus-dark)]"
                dangerouslySetInnerHTML={{
                  __html: product.description
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/<br\s*\/?>/gi, '<br />'),
                }}
              />
            </div>
          )}

          {/* Related products */}
          {relatedProducts.length > 0 && (
            <div className="border-t border-[var(--grus-border)] mt-12 pt-8">
              <h2 className="font-display text-xl lg:text-2xl font-bold text-[var(--grus-dark)] mb-6">
                Andre kunder købte også
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                {relatedProducts.map((rp) => (
                  <ProductCard key={rp.id} product={rp} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
