import { useState, useMemo, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  ArrowLeft,
  Phone,
  Mail,
  Tag,
  ShoppingCart,
  Minus,
  Plus,
  Check,
  Truck,
  Package,
} from "lucide-react";
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
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [addedToCart, setAddedToCart] = useState(false);
  const { addItem } = useCart();

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

  // Fetch related products from same category
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
      .filter((p) => p.categorySlug === product.categorySlug && p.id !== product.id)
      .slice(0, 4);
  }, [allProducts, product]);

  // Calculate current price based on variant selections
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

  // Check if all required variants are selected
  const allVariantsSelected = useMemo(() => {
    if (!product?.variants || product.variants.length === 0) return true;
    return product.variants.every((group) => selectedVariants[group.label]);
  }, [product, selectedVariants]);

  // Get tiered price for current quantity
  const tieredPrice = useMemo((): number | null => {
    if (!product?.tieredPricing || product.tieredPricing.length === 0) return null;
    const tier = product.tieredPricing.find(
      (t) => quantity >= t.minQty && (t.maxQty === null || quantity <= t.maxQty)
    );
    return tier ? tier.price : null;
  }, [product, quantity]);

  const effectivePrice = tieredPrice ?? currentPrice;
  const totalPrice = effectivePrice * quantity;

  // Reset image index when product changes
  useEffect(() => {
    setCurrentImageIndex(0);
    setSelectedVariants({});
    setQuantity(1);
  }, [params.id]);

  const handleAddToCart = () => {
    if (!product) return;
    if (product.variants && product.variants.length > 0 && !allVariantsSelected) return;

    const variantString = Object.values(selectedVariants).join(" / ");
    addItem({
      id: product.id,
      title: product.title,
      price: effectivePrice,
      image: product.image,
      sku: product.sku,
      variant: variantString || undefined,
      variantSelections: Object.keys(selectedVariants).length > 0 ? selectedVariants : undefined,
      unit: product.unit,
      tieredPricing: product.tieredPricing,
    });

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f5f5f5]">
        <Header />
        <main className="flex-1 flex items-center justify-center pt-20 lg:pt-[124px]">
          <Loader2 className="w-10 h-10 animate-spin text-[#E30613]" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f5f5f5]">
        <Header />
        <main
          className="flex-1 flex flex-col items-center justify-center gap-4"
          style={{ paddingTop: "var(--header-h, 124px)" }}
        >
          <p className="text-xl text-gray-500">
            {error instanceof Error ? error.message : "Produktet blev ikke fundet"}
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-[#1a1a1a] font-medium hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
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
    <div className="min-h-screen flex flex-col bg-[#f5f5f5]">
      <Header />

      {/* Fixed breadcrumb bar */}
      <div
        className="fixed left-0 right-0 z-[45] bg-white"
        style={{
          top: "var(--header-h, 124px)",
          borderTop: "0.7px solid #e5e7eb",
          borderBottom: "0.7px solid #e5e7eb",
        }}
      >
        <div className="max-w-[1224px] mx-auto px-5 sm:px-8 py-3">
          <nav className="flex items-center gap-2 text-[14px] text-gray-500">
            <Link href="/" className="hover:text-[#1a1a1a] transition-colors">
              Forside
            </Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-[#1a1a1a] transition-colors">
              Shop
            </Link>
            {product.category && (
              <>
                <span>/</span>
                <Link
                  href={`/shop/${product.categorySlug}`}
                  className="hover:text-[#1a1a1a] transition-colors"
                >
                  {product.category}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-[#1a1a1a] font-medium truncate max-w-[200px]">
              {product.title}
            </span>
          </nav>
        </div>
      </div>

      <main
        className="flex-1"
        style={{ paddingTop: "calc(var(--header-h, 124px) + 48px)" }}
      >
        <div className="max-w-[1224px] mx-auto px-5 sm:px-8 py-8 lg:py-12">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* LEFT: Image Gallery */}
            <div className="min-w-0">
              {/* Main image */}
              <div className="relative w-full aspect-square bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group">
                {images.length > 0 && images[0] ? (
                  <img
                    key={currentImageIndex}
                    src={images[currentImageIndex]}
                    alt={product.title}
                    className="w-full h-full object-cover transition-opacity duration-300 animate-in fade-in"
                    style={{ animationDuration: "300ms" }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
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
                      className={`flex-shrink-0 w-[72px] h-[72px] rounded-xl overflow-hidden border-2 transition-all ${
                        index === currentImageIndex
                          ? "border-[#16a34a] shadow-md"
                          : "border-transparent opacity-70 hover:opacity-100"
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
            <div className="space-y-5">
              {/* Category badge */}
              {product.category && (
                <Link href={`/shop/${product.categorySlug}`}>
                  <span className="inline-flex items-center gap-1.5 bg-[#16a34a] text-white text-[12px] font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
                    {product.category}
                  </span>
                </Link>
              )}

              {/* Title */}
              <h1 className="text-[26px] sm:text-[32px] font-bold text-[#1a1a1a] leading-tight">
                {product.title}
              </h1>

              {/* SKU */}
              {product.sku && (
                <p className="text-[13px] text-gray-400">SKU: {product.sku}</p>
              )}

              {/* Price section */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                {hasVariants && !allVariantsSelected ? (
                  <div className="text-[28px] font-bold text-[#1a1a1a]">
                    Fra {formatPrice(product.salePrice ?? product.basePrice)} {product.currency || "DKK"}
                  </div>
                ) : (
                  <div>
                    {product.salePrice && product.salePrice < product.basePrice ? (
                      <div className="flex items-baseline gap-3">
                        <span className="text-[32px] font-bold text-[#16a34a]">
                          {formatPrice(effectivePrice)} {product.currency || "DKK"}
                        </span>
                        <span className="text-[18px] text-gray-400 line-through">
                          {formatPrice(product.basePrice)} {product.currency || "DKK"}
                        </span>
                      </div>
                    ) : (
                      <div className="text-[32px] font-bold text-[#16a34a]">
                        {formatPrice(effectivePrice)} {product.currency || "DKK"}
                      </div>
                    )}
                  </div>
                )}
                {product.deliveryIncluded && (
                  <p className="text-[13px] text-gray-500 mt-1">Inkl. levering</p>
                )}
              </div>

              {/* Variant selectors - visual grid buttons */}
              {hasVariants && (
                <div className="space-y-4">
                  {product.variants!.map((group) =>
                    group.options.length > 0 ? (
                      <div key={group.label}>
                        <label className="block text-[14px] font-semibold text-[#1a1a1a] mb-2">
                          {group.label}
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {group.options.map((opt) => {
                            const isSelected = selectedVariants[group.label] === opt.name;
                            return (
                              <button
                                key={opt.name}
                                onClick={() =>
                                  setSelectedVariants((prev) => ({
                                    ...prev,
                                    [group.label]: opt.name,
                                  }))
                                }
                                disabled={!opt.inStock}
                                className={`px-4 py-2.5 rounded-xl text-[14px] font-medium border-2 transition-all ${
                                  isSelected
                                    ? "border-[#16a34a] bg-[#16a34a]/5 text-[#16a34a]"
                                    : opt.inStock
                                      ? "border-gray-200 bg-white text-[#1a1a1a] hover:border-gray-300"
                                      : "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                                }`}
                              >
                                {opt.name}
                                {opt.priceDiff !== 0 && (
                                  <span className="ml-1 text-[12px] text-gray-400">
                                    ({opt.priceDiff > 0 ? "+" : ""}{formatPriceShort(opt.priceDiff)} kr)
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

              {/* Tiered pricing table */}
              {product.tieredPricing && product.tieredPricing.length > 1 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="text-[14px] font-semibold text-[#1a1a1a] mb-3">
                    Kob flere, spar mere
                  </h3>
                  <table className="w-full text-[14px]">
                    <thead>
                      <tr className="text-gray-500 border-b border-gray-100">
                        <th className="text-left pb-2 font-medium">Antal</th>
                        <th className="text-right pb-2 font-medium">Pris pr. stk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.tieredPricing.map((tier: TieredPrice, idx: number) => {
                        const isActive =
                          quantity >= tier.minQty &&
                          (tier.maxQty === null || quantity <= tier.maxQty);
                        return (
                          <tr
                            key={idx}
                            className={`border-b border-gray-50 last:border-0 transition-colors ${
                              isActive ? "bg-[#16a34a]/5" : ""
                            }`}
                          >
                            <td className={`py-2 ${isActive ? "font-semibold text-[#16a34a]" : "text-[#1a1a1a]"}`}>
                              {tier.maxQty === null
                                ? `${tier.minQty}+`
                                : tier.minQty === tier.maxQty
                                  ? `${tier.minQty}`
                                  : `${tier.minQty}-${tier.maxQty}`}
                            </td>
                            <td className={`py-2 text-right ${isActive ? "font-semibold text-[#16a34a]" : "text-[#1a1a1a]"}`}>
                              {formatPrice(tier.price)} kr
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Quantity selector */}
              <div className="flex items-center gap-3">
                <span className="text-[14px] font-semibold text-[#1a1a1a]">Antal:</span>
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-14 h-10 text-center text-[15px] font-semibold border-x border-gray-200 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Add to cart button */}
              <button
                onClick={handleAddToCart}
                disabled={hasVariants && !allVariantsSelected}
                className={`w-full inline-flex items-center justify-center gap-2 text-white text-[16px] font-semibold px-6 py-4 rounded-full transition-all ${
                  addedToCart
                    ? "bg-[#16a34a]"
                    : hasVariants && !allVariantsSelected
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-[#16a34a] hover:bg-[#15803d] shadow-lg shadow-green-500/20 hover:shadow-green-500/30"
                }`}
              >
                {addedToCart ? (
                  <>
                    <Check className="w-5 h-5" />
                    Tilfojet!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    {hasVariants && !allVariantsSelected
                      ? "Vaelg variant"
                      : `Laeg i kurv \u2014 ${formatPrice(totalPrice)} kr`}
                  </>
                )}
              </button>

              {/* Delivery info cards */}
              {product.deliveryIncluded && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3.5">
                    <Truck className="w-5 h-5 text-[#16a34a] flex-shrink-0" />
                    <span className="text-[13px] text-[#1a1a1a] font-medium">
                      Fri levering i hele Danmark
                    </span>
                  </div>
                  <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-3.5">
                    <Package className="w-5 h-5 text-[#16a34a] flex-shrink-0" />
                    <span className="text-[13px] text-[#1a1a1a] font-medium">
                      Leveres i bigbags
                    </span>
                  </div>
                </div>
              )}

              {/* Contact card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-semibold text-[15px] text-[#1a1a1a] mb-4">
                  Har du sporgsmal til dette produkt?
                </h2>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a href="tel:+4521479746" className="flex-1">
                    <button className="w-full inline-flex items-center justify-center gap-2 bg-[#E30613] text-white text-[14px] font-semibold px-6 py-3 rounded-full hover:bg-[#C00511] transition-colors">
                      <Phone className="w-4 h-4" />
                      Ring: +45 21 47 97 46
                    </button>
                  </a>
                  <a
                    href={`mailto:mk@impetu.dk?subject=Foresporgsel: ${product.title} (SKU: ${product.sku})&body=Hej,%0D%0A%0D%0AJeg er interesseret i folgende produkt:%0D%0A%0D%0A${product.title}%0D%0ASKU: ${product.sku}%0D%0APris: ${formatPrice(effectivePrice)} ${product.currency || "DKK"}%0D%0A%0D%0AMed venlig hilsen`}
                    className="flex-1"
                  >
                    <button className="w-full inline-flex items-center justify-center gap-2 border-2 border-gray-200 text-[#1a1a1a] text-[14px] font-semibold px-6 py-3 rounded-full hover:bg-gray-50 transition-colors">
                      <Mail className="w-4 h-4" />
                      mk@impetu.dk
                    </button>
                  </a>
                </div>
                <p className="text-[13px] text-gray-400 mt-4 text-center">
                  Kontakt: Mads Kroon
                </p>
              </div>
            </div>
          </div>

          {/* Description Section */}
          {product.description && (
            <div className="mt-10 lg:mt-14">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:p-8">
                <h2 className="font-semibold text-[18px] text-[#1a1a1a] mb-4">
                  Beskrivelse
                </h2>
                <div
                  className="prose prose-sm prose-gray max-w-none text-[15px] text-gray-600 leading-relaxed [&_br]:my-1"
                  dangerouslySetInnerHTML={{
                    __html: product.description
                      .replace(/&lt;/g, "<")
                      .replace(/&gt;/g, ">")
                      .replace(/<br\s*\/?>/gi, "<br />"),
                  }}
                />
              </div>
            </div>
          )}

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-10 lg:mt-14">
              <h2 className="font-bold text-[22px] text-[#1a1a1a] mb-6">
                Relaterede produkter
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {relatedProducts.map((rp) => (
                  <Link key={rp.id} href={`/produkt/${rp.slug || rp.id}`}>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group cursor-pointer">
                      <div className="aspect-square bg-gray-100 overflow-hidden">
                        <img
                          src={rp.image}
                          alt={rp.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-4">
                        {rp.category && (
                          <span className="text-[11px] font-semibold text-[#16a34a] uppercase tracking-wide">
                            {rp.category}
                          </span>
                        )}
                        <h3 className="text-[14px] font-semibold text-[#1a1a1a] mt-1 line-clamp-2 leading-snug">
                          {rp.title}
                        </h3>
                        <div className="mt-2 text-[16px] font-bold text-[#1a1a1a]">
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
