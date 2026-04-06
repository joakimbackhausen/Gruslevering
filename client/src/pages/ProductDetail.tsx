import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import {
  Loader2,
  Minus,
  Plus,
  Check,
  ChevronRight,
  ChevronLeft,
  Tag,
  Truck,
  ShieldCheck,
  Package,
  ShoppingCart,
  FileText,
  CreditCard,
  HelpCircle,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SmartImage from '@/components/SmartImage';
import ProductCard from '@/components/ProductCard';
import { useCart } from '@/contexts/CartContext';
import type { Product, TieredPrice } from '@/types/product';

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function formatPriceKr(price: number): string {
  return (
    price.toLocaleString('da-DK', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }) + ' kr.'
  );
}

function formatPriceDecimal(price: number): string {
  return price.toLocaleString('da-DK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Split a plain-text description into HTML paragraphs for readability */
function descriptionToHtml(text: string): string {
  if (!text) return '';
  if (/<[a-z][\s\S]*>/i.test(text)) return text;
  const lines = text.split(/\n\n+/);
  if (lines.length > 1) {
    return lines.map((l) => `<p>${l.trim()}</p>`).join('');
  }
  const sentences = text.match(/[^.!?]+[.!?]+\s*/g);
  if (!sentences || sentences.length <= 3) return `<p>${text}</p>`;
  const chunks: string[] = [];
  for (let i = 0; i < sentences.length; i += 3) {
    chunks.push(sentences.slice(i, i + 3).join('').trim());
  }
  return chunks.map((c) => `<p>${c}</p>`).join('');
}

/* ------------------------------------------------------------------ */
/*  Plantorama-style Accordion Tab Button                             */
/* ------------------------------------------------------------------ */

function AccordionTab({
  title,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-white rounded-[22px] px-5 h-14 text-left transition-colors hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <span className="text-[var(--grus-dark)] opacity-60">{icon}</span>
          <span className="text-base text-[var(--grus-dark)]">{title}</span>
        </div>
        <ChevronRight
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-[3000px]' : 'max-h-0'}`}
      >
        <div className="px-5 pt-4 pb-6">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Related Products Carousel                                         */
/* ------------------------------------------------------------------ */

function RelatedCarousel({ products }: { products: Product[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -260 : 260, behavior: 'smooth' });
  };

  useEffect(() => {
    checkScroll();
  }, [products]);

  if (products.length === 0) return null;

  return (
    <div className="relative group/carousel">
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute -left-4 top-[100px] z-10 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:text-[var(--grus-green)] transition-all opacity-0 group-hover/carousel:opacity-100"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((p) => (
          <div key={p.id} className="shrink-0 w-[220px] sm:w-[240px] snap-start">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute -right-4 top-[100px] z-10 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:text-[var(--grus-green)] transition-all opacity-0 group-hover/carousel:opacity-100"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Product Detail Page (Plantorama 1:1)                         */
/* ------------------------------------------------------------------ */

export default function ProductDetail() {
  const params = useParams<{ id: string }>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, string>
  >({});
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
      .filter(
        (p) => p.categorySlug === product.categorySlug && p.id !== product.id,
      )
      .slice(0, 8);
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
    if (!product?.tieredPricing || product.tieredPricing.length === 0)
      return null;
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
    window.scrollTo(0, 0);
  }, [params.id]);

  const handleAddToCart = () => {
    if (!product) return;
    if (product.variants && product.variants.length > 0 && !allVariantsSelected)
      return;

    const variantString = Object.values(selectedVariants).join(' / ');

    // Resolve WC variation ID from selected variant
    let wcVariationId: number | undefined;
    if (product.variants && product.variants.length > 0) {
      // For single-attribute products (most common), find the matching option
      const group = product.variants[0];
      const selectedOption = group.options.find(
        (o) => o.name === selectedVariants[group.label],
      );
      if (selectedOption?.wcVariationId) {
        wcVariationId = selectedOption.wcVariationId;
      }
    }

    addItem({
      id: product.id,
      wcProductId: product.wcId ?? undefined,
      wcVariationId,
      title: product.title,
      price: currentPrice,
      image: product.image,
      sku: product.sku,
      variant: variantString || undefined,
      variantSelections:
        Object.keys(selectedVariants).length > 0 ? selectedVariants : undefined,
      unit: product.unit,
      tieredPricing: product.tieredPricing,
      quantity,
    });

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  /* Loading */
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

  /* Error / Not found */
  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main
          className="flex-1 flex flex-col items-center justify-center gap-4"
          style={{ paddingTop: 'var(--header-h, 124px)' }}
        >
          <p className="text-lg text-gray-500">
            {error instanceof Error
              ? error.message
              : 'Produktet blev ikke fundet'}
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

  const images =
    product.images.length > 0 ? product.images : [product.image];
  const hasVariants = !!(product.variants && product.variants.length > 0);
  const isOnSale =
    product.salePrice !== null && product.salePrice < product.basePrice;
  const shortDescription = product.description
    ? product.description.split(/[.!?]\s/)[0] + '.'
    : '';

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1" style={{ paddingTop: 'var(--header-h, 124px)' }}>
        {/* Breadcrumbs — Plantorama style: plain text, > separator */}
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10 pt-4 pb-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
            <Link
              href="/"
              className="hover:text-[var(--grus-dark)] transition-colors"
            >
              Forside
            </Link>
            <span className="text-gray-300">&gt;</span>
            <Link
              href="/shop"
              className="hover:text-[var(--grus-dark)] transition-colors"
            >
              Shop
            </Link>
            {product.category && (
              <>
                <span className="text-gray-300">&gt;</span>
                <Link
                  href={`/shop/${product.categorySlug}`}
                  className="hover:text-[var(--grus-dark)] transition-colors"
                >
                  {product.category}
                </Link>
              </>
            )}
            <span className="text-gray-300">&gt;</span>
            <span className="text-[var(--grus-dark)]">{product.title}</span>
          </nav>
        </div>

        {/* Product Section — Plantorama: 50/50 grid, no card wrapper */}
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-10 pb-10">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-[45px]">
            {/* LEFT: Image Gallery */}
            <div>
              {/* Main image — square, subtle border */}
              <div className="relative aspect-square bg-white rounded-2xl overflow-hidden border border-gray-200">
                {images.length > 0 && images[0] ? (
                  <SmartImage
                    key={currentImageIndex}
                    src={images[currentImageIndex]}
                    alt={product.title}
                    className="w-full h-full object-cover"
                    width={700}
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                    Intet billede
                  </div>
                )}
                {isOnSale && (
                  <span className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold rounded-full px-3 py-1">
                    TILBUD
                  </span>
                )}
              </div>

              {/* Thumbnails row */}
              {images.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                  {images.map((src, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-[72px] h-[72px] rounded-xl overflow-hidden border-2 transition-all ${
                        index === currentImageIndex
                          ? 'border-[var(--grus-dark)] opacity-100'
                          : 'border-gray-200 opacity-50 hover:opacity-80'
                      }`}
                    >
                      <SmartImage
                        src={src}
                        alt={`Billede ${index + 1}`}
                        className="w-full h-full object-cover"
                        width={80}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT: Product Info */}
            <div className="flex flex-col">
              {/* Title — large, bold */}
              <h1 className="text-[28px] lg:text-[32px] font-bold text-[var(--grus-dark)] leading-tight">
                {product.title}
              </h1>

              {/* Short description */}
              {shortDescription && shortDescription.length > 5 && (
                <p className="text-base text-[var(--grus-dark)] mt-2.5 leading-relaxed opacity-80">
                  {shortDescription.length > 120
                    ? shortDescription.substring(0, 120) + '...'
                    : shortDescription}
                </p>
              )}

              {/* Price — Plantorama style: 40px bold */}
              <div className="mt-5">
                {hasVariants && !allVariantsSelected ? (
                  <div className="text-[40px] font-bold text-[var(--grus-dark)] leading-none">
                    Fra {formatPriceKr(lowestPrice)}
                  </div>
                ) : (
                  <div>
                    {isOnSale ? (
                      <>
                        <div className="text-[40px] font-bold text-[var(--grus-dark)] leading-none">
                          {formatPriceKr(effectivePrice)}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm line-through text-gray-400">
                            {formatPriceKr(product.basePrice)}
                          </span>
                          <span className="bg-orange-300 text-orange-900 text-xs font-bold rounded-full px-2.5 py-0.5 uppercase">
                            Tilbud
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="text-[40px] font-bold text-[var(--grus-dark)] leading-none">
                        {formatPriceKr(effectivePrice)}
                      </div>
                    )}
                  </div>
                )}
                {product.deliveryIncluded && (
                  <p className="text-sm text-gray-500 mt-2">
                    Inkl. fri levering
                  </p>
                )}
              </div>

              {/* Variant selectors — dropdown style */}
              {hasVariants && (
                <div className="mt-5 space-y-3">
                  {product.variants!.map((group) =>
                    group.options.length > 0 ? (
                      <div key={group.label}>
                        <label className="block text-sm font-medium text-[var(--grus-dark)] mb-1.5">
                          {group.label}
                        </label>
                        <div className="relative">
                          <select
                            value={selectedVariants[group.label] || ''}
                            onChange={(e) =>
                              setSelectedVariants((prev) => ({
                                ...prev,
                                [group.label]: e.target.value,
                              }))
                            }
                            className="w-full appearance-none bg-white border-2 border-gray-200 rounded-[22px] px-5 py-3.5 pr-10 text-base text-[var(--grus-dark)] focus:outline-none focus:border-[var(--grus-green)] transition-all cursor-pointer hover:border-gray-300"
                          >
                            <option value="" disabled>
                              Vælg {group.label.toLowerCase()}
                            </option>
                            {group.options.map((opt) => (
                              <option
                                key={opt.name}
                                value={opt.name}
                                disabled={!opt.inStock}
                              >
                                {opt.name}
                                {opt.priceDiff > 0
                                  ? ` (+${formatPriceDecimal(opt.priceDiff)} kr.)`
                                  : ''}
                                {opt.priceDiff < 0
                                  ? ` (${formatPriceDecimal(opt.priceDiff)} kr.)`
                                  : ''}
                                {!opt.inStock ? ' (Udsolgt)' : ''}
                              </option>
                            ))}
                          </select>
                          <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none rotate-90" />
                        </div>
                      </div>
                    ) : null,
                  )}
                </div>
              )}

              {/* Tiered pricing */}
              {product.tieredPricing && product.tieredPricing.length > 1 && (
                <div className="mt-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 text-[var(--grus-green)]" />
                    <span className="text-sm font-medium text-[var(--grus-dark)]">
                      Mængderabat
                    </span>
                  </div>
                  <div className="border-2 border-gray-200 rounded-2xl overflow-hidden text-sm">
                    <div className="grid grid-cols-3 px-4 py-2.5 bg-gray-50 border-b border-gray-200 font-medium text-gray-500">
                      <span>Antal</span>
                      <span className="text-right">Stk. pris</span>
                      <span className="text-right">Rabat</span>
                    </div>
                    {product.tieredPricing.map(
                      (tier: TieredPrice, idx: number) => {
                        const isActive =
                          quantity >= tier.minQty &&
                          (tier.maxQty === null || quantity <= tier.maxQty);
                        const basePrice =
                          product.salePrice ?? product.basePrice;
                        const savingsPercent =
                          basePrice > 0
                            ? Math.round(
                                ((basePrice - tier.price) / basePrice) * 100,
                              )
                            : 0;
                        return (
                          <div
                            key={idx}
                            className={`grid grid-cols-3 px-4 py-2.5 border-b border-gray-100 last:border-0 ${
                              isActive ? 'bg-green-50' : ''
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
                              className={`text-right ${isActive ? 'font-semibold' : 'text-gray-600'}`}
                            >
                              {formatPriceDecimal(tier.price)} kr.
                            </span>
                            <span
                              className={`text-right ${savingsPercent > 0 ? 'text-[var(--grus-green)] font-medium' : 'text-gray-300'}`}
                            >
                              {savingsPercent > 0
                                ? `\u2212${savingsPercent}%`
                                : '\u2014'}
                            </span>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              )}

              {/* Delivery USPs — Plantorama style: icon + text lines */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-base text-[var(--grus-dark)]">
                  <Truck className="w-5 h-5 text-[var(--grus-dark)] opacity-60 flex-shrink-0" />
                  <span>Fri levering i hele Danmark</span>
                </div>
                <div className="flex items-center gap-3 text-base text-[var(--grus-dark)]">
                  <Package className="w-5 h-5 text-[var(--grus-dark)] opacity-60 flex-shrink-0" />
                  <span>Levering inden for 3-5 hverdage</span>
                </div>
                <div className="flex items-center gap-3 text-base text-[var(--grus-dark)]">
                  <ShieldCheck className="w-5 h-5 text-[var(--grus-dark)] opacity-60 flex-shrink-0" />
                  <span>Sikker betaling</span>
                </div>
              </div>

              {/* Quantity + Add to cart — Plantorama: pill qty, large green button */}
              <div className="mt-6">
                <div className="flex items-stretch gap-4">
                  {/* Quantity selector — pill shaped */}
                  <div className="flex items-center border-2 border-gray-200 rounded-[22px] bg-white">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-12 h-14 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-500 rounded-l-[22px]"
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
                      className="w-[50px] h-14 text-center text-base font-medium focus:outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-12 h-14 flex items-center justify-center hover:bg-gray-50 transition-colors text-gray-500 rounded-r-[22px]"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Add to cart button — Plantorama green pill */}
                  <button
                    onClick={handleAddToCart}
                    disabled={hasVariants && !allVariantsSelected}
                    className={`flex-1 h-14 rounded-[22px] font-medium text-lg transition-all duration-200 flex items-center justify-center gap-2.5 ${
                      addedToCart
                        ? 'bg-[#185735] text-white'
                        : hasVariants && !allVariantsSelected
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-[#185735] text-white hover:bg-[#144a2d] shadow-sm hover:shadow-md'
                    }`}
                  >
                    {addedToCart ? (
                      <>
                        <Check className="w-5 h-5" />
                        Tilf&oslash;jet!
                      </>
                    ) : hasVariants && !allVariantsSelected ? (
                      'Vælg variant'
                    ) : (
                      <>
                        Læg i kurv
                        <ShoppingCart className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>

                {/* Total line */}
                {quantity > 1 && allVariantsSelected && (
                  <p className="text-sm text-gray-500 mt-2 text-right">
                    Total:{' '}
                    <span className="font-semibold text-[var(--grus-dark)]">
                      {formatPriceDecimal(totalPrice)} kr.
                    </span>
                  </p>
                )}
              </div>

              {/* Produktinfo — Plantorama accordion tabs */}
              <div className="mt-10">
                <h3 className="text-xl font-medium text-[var(--grus-dark)] mb-3">
                  Produktinfo
                </h3>
                <div className="space-y-2.5">
                  {product.description && (
                    <AccordionTab
                      title="Beskrivelse"
                      icon={<FileText className="w-5 h-5" />}
                      defaultOpen={false}
                    >
                      <div
                        className="prose prose-sm prose-gray max-w-none text-[15px] text-gray-600 leading-relaxed [&_p]:mb-3 [&_p:last-child]:mb-0"
                        dangerouslySetInnerHTML={{
                          __html: descriptionToHtml(product.description),
                        }}
                      />
                    </AccordionTab>
                  )}

                  <AccordionTab
                    title="Levering"
                    icon={<Truck className="w-5 h-5" />}
                  >
                    <div className="space-y-3 text-[15px] text-gray-600">
                      <p>
                        Vi leverer til hele Danmark, inkl. brofaste øer.
                        Levering sker typisk inden for 3-5 hverdage efter
                        bestilling.
                      </p>
                      <p>
                        Produktet leveres med lastbil og kran direkte til din
                        adresse. Sørg for at der er plads til kranlevering ved
                        leveringsstedet.
                      </p>
                      <p>
                        Har du spørgsmål om levering? Ring til os på{' '}
                        <a
                          href="tel:+4572494444"
                          className="text-[var(--grus-green)] font-medium hover:underline"
                        >
                          +45 72 49 44 44
                        </a>
                      </p>
                    </div>
                  </AccordionTab>

                  <AccordionTab
                    title="Betaling"
                    icon={<CreditCard className="w-5 h-5" />}
                  >
                    <div className="space-y-3 text-[15px] text-gray-600">
                      <p>Vi accepterer følgende betalingsformer:</p>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="px-3 py-1.5 bg-gray-100 rounded-full text-xs font-medium">
                          Visa
                        </span>
                        <span className="px-3 py-1.5 bg-gray-100 rounded-full text-xs font-medium">
                          MasterCard
                        </span>
                        <span className="px-3 py-1.5 bg-gray-100 rounded-full text-xs font-medium">
                          MobilePay
                        </span>
                        <span className="px-3 py-1.5 bg-gray-100 rounded-full text-xs font-medium">
                          Bankoverførsel
                        </span>
                      </div>
                      <p>
                        Betaling trækkes først når varen er afsendt. Du handler
                        sikkert hos os med krypteret forbindelse.
                      </p>
                    </div>
                  </AccordionTab>
                </div>
              </div>
            </div>
          </div>

          {/* Trust banner — Plantorama green */}
          <div className="mt-10 bg-[#c8dfbb] rounded-2xl px-8 py-6 flex items-start gap-4">
            <ShieldCheck className="w-6 h-6 text-[var(--grus-dark)] mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-[var(--grus-dark)]">
                Altid det bedste
              </p>
              <p className="text-sm text-[var(--grus-dark)] opacity-75 mt-1">
                Vi udvælger med omhu de bedste materialer, så du altid får
                kvalitetsprodukter leveret direkte til din dør.
              </p>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-12">
              <h2 className="text-base font-medium text-[var(--grus-dark)] mb-5">
                Lignende produkter
              </h2>
              <RelatedCarousel products={relatedProducts} />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
