import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Minus, Plus, Check, ChevronRight, Layers } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import type { Product, TieredPrice } from "@/types/product";

function formatPrice(price: number): string {
  return price.toLocaleString("da-DK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPriceShort(price: number): string {
  return price.toLocaleString("da-DK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export default function ProductDetail() {
  const params = useParams<{ id: string }>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, string>
  >({});
  const [addedToCart, setAddedToCart] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(true);
  const { addItem } = useCart();
  const relatedScrollRef = useRef<HTMLDivElement>(null);

  const {
    data: product,
    isLoading,
    error,
  } = useQuery<Product>({
    queryKey: ["product", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/products/${params.id}`);
      if (!res.ok) throw new Error("Produktet blev ikke fundet");
      return res.json();
    },
    enabled: !!params.id,
  });

  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
  });

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return allProducts
      .filter(
        (p) => p.categorySlug === product.categorySlug && p.id !== product.id
      )
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
    if (!product?.tieredPricing || product.tieredPricing.length === 0)
      return null;
    const tier = product.tieredPricing.find(
      (t) => quantity >= t.minQty && (t.maxQty === null || quantity <= t.maxQty)
    );
    return tier ? tier.price : null;
  }, [product, quantity]);

  const effectivePrice = tieredPrice ?? currentPrice;
  const totalPrice = effectivePrice * quantity;

  // Lowest variant price for "Fra X kr"
  const lowestPrice = useMemo(() => {
    if (!product) return 0;
    const base = product.salePrice ?? product.basePrice;
    if (!product.variants || product.variants.length === 0) return base;
    let minAdd = 0;
    for (const group of product.variants) {
      const minOption = group.options.reduce(
        (min, o) => (o.priceDiff < min ? o.priceDiff : min),
        Infinity
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

  const handleImageSwitch = (index: number) => {
    if (index === currentImageIndex) return;
    setImageLoaded(false);
    setCurrentImageIndex(index);
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (product.variants && product.variants.length > 0 && !allVariantsSelected)
      return;

    const variantString = Object.values(selectedVariants).join(" / ");
    addItem({
      id: product.id,
      title: product.title,
      price: effectivePrice,
      image: product.image,
      sku: product.sku,
      variant: variantString || undefined,
      variantSelections:
        Object.keys(selectedVariants).length > 0
          ? selectedVariants
          : undefined,
      unit: product.unit,
      tieredPricing: product.tieredPricing,
    });

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  // ---------- Loading state ----------
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--grus-warm)]">
        <Header />
        <main className="flex-1 flex items-center justify-center pt-20 lg:pt-[124px]">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--grus-dark)]" />
        </main>
        <Footer />
      </div>
    );
  }

  // ---------- Error / Not found ----------
  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--grus-warm)]">
        <Header />
        <main
          className="flex-1 flex flex-col items-center justify-center gap-6"
          style={{ paddingTop: "var(--header-h, 124px)" }}
        >
          <p className="text-lg text-stone-500 font-display">
            {error instanceof Error
              ? error.message
              : "Produktet blev ikke fundet"}
          </p>
          <Link
            href="/shop"
            className="text-xs uppercase tracking-[0.15em] text-stone-400 hover:text-[var(--grus-dark)] transition-colors"
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

  return (
    <div className="min-h-screen flex flex-col bg-[var(--grus-warm)]">
      <Header />

      <main
        className="flex-1"
        style={{ paddingTop: "var(--header-h, 124px)" }}
      >
        {/* Breadcrumbs */}
        <div className="max-w-[1320px] mx-auto px-5 sm:px-8 pt-8 pb-2">
          <nav className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-stone-400">
            <Link
              href="/"
              className="hover:text-[var(--grus-dark)] transition-colors"
            >
              Forside
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link
              href="/shop"
              className="hover:text-[var(--grus-dark)] transition-colors"
            >
              Shop
            </Link>
            {product.category && (
              <>
                <ChevronRight className="w-3 h-3" />
                <Link
                  href={`/shop/${product.categorySlug}`}
                  className="hover:text-[var(--grus-dark)] transition-colors"
                >
                  {product.category}
                </Link>
              </>
            )}
            <ChevronRight className="w-3 h-3" />
            <span className="text-stone-600 truncate max-w-[200px]">
              {product.title}
            </span>
          </nav>
        </div>

        {/* Two-column layout */}
        <div className="max-w-[1320px] mx-auto px-5 sm:px-8 py-8 lg:py-12">
          <div className="grid lg:grid-cols-[55fr_45fr] gap-8 lg:gap-16">
            {/* ====================== LEFT: Image Gallery ====================== */}
            <div className="min-w-0">
              {/* Main image */}
              <div className="relative w-full aspect-[4/5] rounded-2xl overflow-hidden bg-[var(--grus-warm)] border border-stone-200/60">
                {images.length > 0 && images[0] ? (
                  <img
                    key={currentImageIndex}
                    src={images[currentImageIndex]}
                    alt={product.title}
                    onLoad={() => setImageLoaded(true)}
                    className="w-full h-full object-cover transition-opacity duration-500 ease-out"
                    style={{ opacity: imageLoaded ? 1 : 0 }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-300 text-sm">
                    Intet billede
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-3 mt-4 overflow-x-auto pb-1">
                  {images.map((src, index) => (
                    <button
                      key={index}
                      onClick={() => handleImageSwitch(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all duration-200 ${
                        index === currentImageIndex
                          ? "ring-2 ring-[var(--grus-dark)] ring-offset-2"
                          : "opacity-60 hover:opacity-100"
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

            {/* ====================== RIGHT: Product Info ====================== */}
            <div className="lg:sticky lg:top-32 lg:self-start">
              {/* Editorial divider */}
              <div className="w-8 h-px bg-stone-300 mb-4" />

              {/* Category */}
              {product.category && (
                <Link href={`/shop/${product.categorySlug}`}>
                  <span className="text-xs uppercase tracking-[0.15em] text-stone-400 hover:text-[var(--grus-dark)] transition-colors">
                    {product.category}
                  </span>
                </Link>
              )}

              {/* Title */}
              <h1 className="font-display text-3xl lg:text-4xl font-semibold tracking-tight text-[var(--grus-dark)] mt-2 leading-[1.15]">
                {product.title}
              </h1>

              {/* SKU */}
              {product.sku && (
                <p className="text-xs text-stone-400 mt-1">
                  SKU: {product.sku}
                </p>
              )}

              {/* Price area */}
              <div className="mt-6">
                {hasVariants && !allVariantsSelected ? (
                  <div className="text-2xl font-display font-bold text-[var(--grus-dark)]">
                    Fra {formatPrice(lowestPrice)} kr
                  </div>
                ) : (
                  <div>
                    {product.salePrice &&
                    product.salePrice < product.basePrice ? (
                      <div className="flex items-baseline gap-3">
                        <span className="text-2xl font-display font-bold text-[var(--grus-accent)]">
                          {formatPrice(effectivePrice)} kr
                        </span>
                        <span className="text-lg line-through text-stone-400">
                          {formatPrice(product.basePrice)} kr
                        </span>
                      </div>
                    ) : (
                      <div className="text-2xl font-display font-bold text-[var(--grus-dark)]">
                        {formatPrice(effectivePrice)} kr
                      </div>
                    )}
                  </div>
                )}
                {product.deliveryIncluded && (
                  <p className="text-xs text-stone-400 mt-1.5">
                    Inkl. fri levering
                  </p>
                )}
              </div>

              {/* Variant selectors */}
              {hasVariants && (
                <div className="mt-8 space-y-6">
                  {product.variants!.map((group) =>
                    group.options.length > 0 ? (
                      <div key={group.label}>
                        <label className="block text-xs uppercase tracking-[0.15em] font-medium text-[var(--grus-dark)] mb-3">
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
                                className={`min-w-[100px] py-3 px-5 rounded-lg border text-sm font-medium text-center transition-all duration-150 ${
                                  isSelected
                                    ? "border-[var(--grus-dark)] bg-[var(--grus-dark)] text-white"
                                    : isOOS
                                      ? "border-stone-200 bg-white text-stone-300 opacity-40 line-through cursor-not-allowed"
                                      : "border-stone-200 bg-white text-[var(--grus-dark)] hover:border-stone-400"
                                }`}
                              >
                                <span>{opt.name}</span>
                                {opt.priceDiff !== 0 && !isOOS && (
                                  <span className="block text-[11px] mt-0.5 opacity-60">
                                    {opt.priceDiff > 0 ? "+" : ""}
                                    {formatPriceShort(opt.priceDiff)} kr
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null
                  )}
                </div>
              )}

              {/* Tiered pricing */}
              {product.tieredPricing && product.tieredPricing.length > 1 && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Layers className="w-3.5 h-3.5 text-stone-400" />
                    <span className="text-xs uppercase tracking-[0.15em] font-medium text-[var(--grus-dark)]">
                      Maengderabat
                    </span>
                  </div>
                  <div className="border border-stone-200/80 rounded-lg overflow-hidden">
                    {/* Table header */}
                    <div className="grid grid-cols-3 text-[11px] uppercase tracking-[0.12em] text-stone-400 px-4 py-2.5 border-b border-stone-100 bg-white/50">
                      <span>Antal</span>
                      <span className="text-right">Pris pr. stk</span>
                      <span className="text-right">Rabat</span>
                    </div>
                    {/* Rows */}
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
                                ((basePrice - tier.price) / basePrice) * 100
                              )
                            : 0;
                        return (
                          <div
                            key={idx}
                            className={`grid grid-cols-3 px-4 py-3 text-sm transition-colors border-b border-stone-50 last:border-0 ${
                              isActive
                                ? "bg-[var(--grus-green)]/5"
                                : "bg-white"
                            }`}
                          >
                            <span
                              className={
                                isActive
                                  ? "font-semibold text-[var(--grus-dark)]"
                                  : "text-stone-600"
                              }
                            >
                              {tier.maxQty === null
                                ? `${tier.minQty}+`
                                : tier.minQty === tier.maxQty
                                  ? `${tier.minQty}`
                                  : `${tier.minQty}\u2013${tier.maxQty}`}
                            </span>
                            <span
                              className={`text-right ${isActive ? "font-semibold text-[var(--grus-dark)]" : "text-stone-600"}`}
                            >
                              {formatPrice(tier.price)} kr
                            </span>
                            <span
                              className={`text-right ${savingsPercent > 0 ? "text-[var(--grus-green)]" : "text-stone-300"}`}
                            >
                              {savingsPercent > 0
                                ? `\u2212${savingsPercent}%`
                                : "\u2014"}
                            </span>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

              {/* Quantity + Add to cart */}
              <div className="mt-8 space-y-3">
                {/* Quantity selector */}
                <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden w-fit">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-11 h-11 flex items-center justify-center hover:bg-stone-50 transition-colors text-stone-500"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="w-14 h-11 text-center text-sm font-medium border-x border-stone-200 focus:outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-11 h-11 flex items-center justify-center hover:bg-stone-50 transition-colors text-stone-500"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Add to cart button */}
                <button
                  onClick={handleAddToCart}
                  disabled={hasVariants && !allVariantsSelected}
                  className={`w-full py-4 rounded-xl font-display text-sm uppercase tracking-[0.15em] transition-all duration-200 ${
                    addedToCart
                      ? "bg-[var(--grus-green)] text-white"
                      : hasVariants && !allVariantsSelected
                        ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                        : "bg-[var(--grus-dark)] text-white hover:bg-[var(--grus-green)]"
                  }`}
                >
                  {addedToCart ? (
                    <span className="inline-flex items-center justify-center gap-2">
                      <Check className="w-4 h-4" />
                      Tilfojet til kurv
                    </span>
                  ) : hasVariants && !allVariantsSelected ? (
                    "Vaelg stoerrelse"
                  ) : (
                    `Laeg i kurv \u2014 ${formatPrice(totalPrice)} kr`
                  )}
                </button>
              </div>

              {/* Delivery info */}
              {product.deliveryIncluded && (
                <p className="mt-6 text-sm text-stone-400">
                  Fri levering i hele Danmark &bull; Typisk 3-5 hverdage
                </p>
              )}
            </div>
          </div>

          {/* ====================== Description ====================== */}
          {product.description && (
            <div className="mt-16 pt-16 border-t border-stone-200/60">
              <div className="w-8 h-px bg-stone-300 mb-4" />
              <h2 className="font-display text-2xl font-semibold tracking-tight text-[var(--grus-dark)] mb-6">
                Beskrivelse
              </h2>
              <div
                className="prose prose-stone max-w-3xl text-[15px] text-stone-600 leading-relaxed [&_br]:my-1 prose-headings:font-display prose-headings:text-[var(--grus-dark)]"
                dangerouslySetInnerHTML={{
                  __html: product.description
                    .replace(/&lt;/g, "<")
                    .replace(/&gt;/g, ">")
                    .replace(/<br\s*\/?>/gi, "<br />"),
                }}
              />
            </div>
          )}

          {/* ====================== Related Products ====================== */}
          {relatedProducts.length > 0 && (
            <div className="mt-16 pt-16 border-t border-stone-200/60">
              <div className="w-8 h-px bg-stone-300 mb-4" />
              <h2 className="font-display text-2xl font-semibold tracking-tight text-[var(--grus-dark)] mb-8">
                Andre produkter du maaske kan lide
              </h2>
              <div
                ref={relatedScrollRef}
                className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 overflow-x-auto lg:overflow-visible snap-x snap-mandatory lg:snap-none"
                style={{
                  gridAutoFlow: "column",
                  gridAutoColumns: "minmax(160px, 1fr)",
                }}
              >
                {relatedProducts.map((rp) => (
                  <Link key={rp.id} href={`/produkt/${rp.slug || rp.id}`}>
                    <div className="snap-start bg-white rounded-2xl border border-stone-200/60 overflow-hidden hover:shadow-lg hover:shadow-stone-200/50 transition-all duration-300 group cursor-pointer">
                      <div className="aspect-[4/5] bg-[var(--grus-warm)] overflow-hidden">
                        <img
                          src={rp.image}
                          alt={rp.title}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                        />
                      </div>
                      <div className="p-4 lg:p-5">
                        {rp.category && (
                          <span className="text-[10px] uppercase tracking-[0.15em] text-stone-400">
                            {rp.category}
                          </span>
                        )}
                        <h3 className="text-sm font-medium text-[var(--grus-dark)] mt-1 line-clamp-2 leading-snug">
                          {rp.title}
                        </h3>
                        <div className="mt-2 text-sm font-display font-semibold text-[var(--grus-dark)]">
                          {formatPrice(rp.salePrice ?? rp.basePrice)} kr
                        </div>
                      </div>
                    </div>
                  </Link>
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
