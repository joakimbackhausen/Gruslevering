import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  ArrowLeft,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Tag,
  ShoppingCart,
  Minus,
  Plus,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";

interface Product {
  id: string;
  title: string;
  sku: string;
  price: number;
  currency: string;
  image: string;
  images: string[];
  category: string;
  categorySlug: string;
  description: string;
  variants?: { label: string; options: string[] }[];
  url: string;
}

function formatPrice(price: number): string {
  return price.toLocaleString("da-DK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function MachineDetail() {
  const params = useParams<{ id: string }>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, string>
  >({});
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

  const nextImage = () => {
    if (product && product.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product && product.images.length > 0) {
      setCurrentImageIndex(
        (prev) => (prev - 1 + product.images.length) % product.images.length,
      );
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    const variantParts = Object.entries(selectedVariants)
      .filter(([, v]) => v)
      .map(([, v]) => v);
    const variantLabel =
      variantParts.length > 0 ? variantParts.join(" / ") : undefined;

    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        sku: product.sku,
        variant: variantLabel,
      });
    }
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
            {error instanceof Error
              ? error.message
              : "Produktet blev ikke fundet"}
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
  const priceExVat = product.price;
  const priceInclVat = Math.round(product.price * 1.25);

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
            <Link
              href="/shop"
              className="hover:text-[#1a1a1a] transition-colors"
            >
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
              <div className="relative w-full aspect-[4/3] bg-gray-200 rounded-2xl overflow-hidden">
                {images.length > 0 && images[0] ? (
                  <>
                    <img
                      src={images[currentImageIndex]}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                    {images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5 text-[#1a1a1a]" />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                        >
                          <ChevronRight className="w-5 h-5 text-[#1a1a1a]" />
                        </button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[13px] font-medium">
                          {currentImageIndex + 1} / {images.length}
                        </div>
                      </>
                    )}
                  </>
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
                          ? "border-[#E30613] shadow-md"
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
            <div className="space-y-6">
              {/* Title, SKU & Category */}
              <div>
                <h1 className="text-[30px] sm:text-[36px] font-bold text-[#1a1a1a] leading-tight">
                  {product.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  {product.sku && (
                    <span className="inline-flex items-center gap-1.5 bg-gray-100 text-[13px] text-gray-600 px-3 py-1 rounded-full font-medium">
                      SKU: {product.sku}
                    </span>
                  )}
                  {product.category && (
                    <Link
                      href={`/shop/${product.categorySlug}`}
                      className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-[13px] text-gray-600 px-3 py-1 rounded-full hover:border-gray-300 transition-colors"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      {product.category}
                    </Link>
                  )}
                </div>
              </div>

              {/* Price card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="text-[38px] font-bold text-[#1a1a1a] leading-tight">
                  {formatPrice(priceExVat)} {product.currency || "DKK"}
                </div>
                <div className="text-[14px] text-gray-500 mt-1">
                  (ekskl. moms)
                </div>
                <div className="text-[14px] text-gray-400 mt-0.5">
                  inkl. moms: {formatPrice(priceInclVat)}{" "}
                  {product.currency || "DKK"}
                </div>
              </div>

              {/* Variant selectors */}
              {product.variants &&
                product.variants.length > 0 &&
                product.variants.some((v) => v.options.length > 0) && (
                  <div className="space-y-3">
                    {product.variants.map(
                      (variant) =>
                        variant.options.length > 0 && (
                          <div key={variant.label}>
                            <label className="block text-[14px] font-semibold text-[#1a1a1a] mb-1.5">
                              {variant.label}
                            </label>
                            <select
                              value={selectedVariants[variant.label] || ""}
                              onChange={(e) =>
                                setSelectedVariants((prev) => ({
                                  ...prev,
                                  [variant.label]: e.target.value,
                                }))
                              }
                              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#E30613]/20 focus:border-[#E30613] transition-colors"
                            >
                              <option value="">
                                Vælg {variant.label.toLowerCase()}
                              </option>
                              {variant.options.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </div>
                        ),
                    )}
                  </div>
                )}

              {/* Add to cart */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
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
                      onChange={(e) =>
                        setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                      }
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
                <button
                  onClick={handleAddToCart}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#E30613] text-white text-[15px] font-semibold px-6 py-3.5 rounded-full hover:bg-[#C00511] transition-colors"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Læg i kurv
                </button>
              </div>

              {/* Contact card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-semibold text-[15px] text-[#1a1a1a] mb-4">
                  Har du spørgsmål til dette produkt?
                </h2>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a href="tel:+4521479746" className="flex-1">
                    <button className="w-full inline-flex items-center justify-center gap-2 bg-[#E30613] text-white text-[14px] font-semibold px-6 py-3 rounded-full hover:bg-[#C00511] transition-colors">
                      <Phone className="w-4 h-4" />
                      Ring: +45 21 47 97 46
                    </button>
                  </a>
                  <a
                    href={`mailto:mk@impetu.dk?subject=Forespørgsel: ${product.title} (SKU: ${product.sku})&body=Hej,%0D%0A%0D%0AJeg er interesseret i følgende produkt:%0D%0A%0D%0A${product.title}%0D%0ASKU: ${product.sku}%0D%0APris: ${formatPrice(priceExVat)} ${product.currency || "DKK"}%0D%0A%0D%0AMed venlig hilsen`}
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
        </div>
      </main>

      <Footer />
    </div>
  );
}
