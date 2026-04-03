import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Truck,
  Clock,
  Star,
  ShieldCheck,
  Calculator,
  CheckCircle,
  Leaf,
  HeartHandshake,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SmartImage from '@/components/SmartImage';
import { useCart } from '@/contexts/CartContext';
import type { Product, Category } from '@/types/product';

/* -- Helpers -- */

const formatPrice = (price: number) =>
  new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    minimumFractionDigits: 0,
  }).format(price);

/* -- Reveal (simple fade-in on scroll) -- */

function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true);
      },
      { threshold: 0.08 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* -- Gradient placeholders for categories -- */

const categoryGradients = [
  'linear-gradient(135deg, #1B6B28 0%, #0D3B16 100%)',
  'linear-gradient(135deg, #145520 0%, #1B6B28 100%)',
  'linear-gradient(135deg, #0D3B16 0%, #1B6B28 100%)',
  'linear-gradient(135deg, #1B6B28 0%, #145520 100%)',
  'linear-gradient(135deg, #145520 0%, #0D3B16 100%)',
  'linear-gradient(135deg, #0D3B16 0%, #145520 100%)',
  'linear-gradient(135deg, #1B6B28 0%, #0D3B16 100%)',
  'linear-gradient(135deg, #145520 0%, #1B6B28 100%)',
];

/* -- Product Card (shared design) -- */

function ProductCard({ product }: { product: Product }) {
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
      className="group block bg-white rounded-xl border border-[var(--grus-border)] overflow-hidden hover:shadow-md transition-all duration-200"
    >
      {/* Image */}
      <div className="relative aspect-square bg-[var(--grus-sand)] p-4">
        {product.image ? (
          <SmartImage
            src={product.image}
            alt={product.title}
            className="w-full h-full object-contain group-hover:scale-[1.03] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
            Ingen billede
          </div>
        )}
        {isOnSale && (
          <span className="absolute top-2 right-2 bg-[var(--grus-accent)] text-white text-xs font-bold rounded-lg px-2 py-1">
            Tilbud
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--grus-green)]">
          {product.category}
        </p>
        <h3 className="text-sm font-medium text-[var(--grus-dark)] line-clamp-2 mt-1 min-h-[2.5rem] leading-snug">
          {product.title}
        </h3>
        <div className="mt-2 flex items-baseline gap-2">
          {isOnSale ? (
            <>
              <span className="text-base font-bold text-[var(--grus-accent)]">
                {hasVariants ? 'Fra ' : ''}
                {formatPrice(product.salePrice!)}
              </span>
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(product.basePrice)}
              </span>
            </>
          ) : (
            <span className="text-base font-bold text-[var(--grus-dark)]">
              {hasVariants ? 'Fra ' : ''}
              {formatPrice(effectivePrice)}
            </span>
          )}
        </div>
        {product.deliveryIncluded && (
          <p className="text-xs text-gray-400 mt-0.5">inkl. levering</p>
        )}
      </div>

      {/* Button */}
      <div className="px-4 pb-4 mt-auto">
        {hasVariants ? (
          <span className="block w-full text-center border border-[var(--grus-green)] text-[var(--grus-green)] py-2.5 rounded-lg text-sm font-semibold group-hover:bg-[var(--grus-green-light)] transition-colors">
            Se produkt &rarr;
          </span>
        ) : (
          <button
            onClick={handleAddToCart}
            className="w-full bg-[var(--grus-green)] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[var(--grus-green-hover)] transition-colors cursor-pointer"
          >
            Læg i kurv
          </button>
        )}
      </div>
    </Link>
  );
}

/* ================================================================
   HOME PAGE
   ================================================================ */

export default function Home() {
  useEffect(() => {
    document.title = 'Gruslevering.dk - Grus, sand & sten leveret til døren';
  }, []);

  const { data: products = [], isLoading: loadingProducts } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => fetch('/api/products').then((r) => r.json()),
  });

  const { data: categories = [], isLoading: loadingCategories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => fetch('/api/categories').then((r) => r.json()),
  });

  const parentCategories = categories
    .filter((c) => c.parentId === null)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const featuredProducts = products.slice(0, 8);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* ===== SECTION 1: HERO BANNER ===== */}
      <section className="mt-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div
            className="relative rounded-2xl overflow-hidden min-h-[320px] lg:min-h-[440px] flex items-center"
            style={{
              background: 'linear-gradient(135deg, #1B6B28 0%, #145520 50%, #0D3B16 100%)',
            }}
          >
            {/* Subtle radial highlight */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  'radial-gradient(ellipse at 80% 50%, rgba(255,255,255,0.2) 0%, transparent 60%)',
              }}
            />

            <div className="relative z-10 px-8 lg:px-14 py-16 lg:py-20 max-w-2xl">
              {/* Badge */}
              <span className="inline-flex items-center gap-1.5 bg-white/95 text-[var(--grus-dark)] text-xs font-semibold px-3 py-1.5 rounded-full mb-5 shadow-sm">
                <Truck className="w-3.5 h-3.5" />
                Fri levering
              </span>

              {/* Heading */}
              <h1 className="font-display font-bold text-white text-3xl sm:text-4xl lg:text-5xl leading-tight mb-4 max-w-lg">
                Grus, sand & sten leveret til døren
              </h1>

              {/* Subtext */}
              <p className="text-white/80 text-base lg:text-lg mb-8 max-w-md">
                Bestil materialer online og få leveret direkte til din adresse i hele Danmark
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 bg-white text-[var(--grus-dark)] font-semibold px-6 py-3 rounded-lg shadow-sm hover:shadow-md transition-all"
                >
                  Se alle produkter
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/volumenberegner"
                  className="inline-flex items-center gap-2 bg-white/15 backdrop-blur text-white border border-white/30 font-semibold px-6 py-3 rounded-lg hover:bg-white/25 transition-all"
                >
                  <Calculator className="w-4 h-4" />
                  Beregn mængde
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 2: USP STRIP ===== */}
      <section className="py-5 border-y border-[var(--grus-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center sm:justify-between gap-4 sm:gap-2">
            {[
              { icon: Truck, text: 'Fri levering' },
              { icon: Clock, text: '3-5 hverdages levering' },
              { icon: Star, text: '4.8/5 Trustpilot' },
              { icon: ShieldCheck, text: 'Sikker betaling' },
            ].map((usp) => (
              <div key={usp.text} className="flex items-center gap-2 px-2">
                <usp.icon className="w-4 h-4 text-[var(--grus-green)] flex-shrink-0" />
                <span className="text-sm text-gray-600 font-medium whitespace-nowrap">
                  {usp.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION 3: CATEGORY CARDS ===== */}
      <section className="py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mb-8">
              <h2 className="font-display font-bold text-[var(--grus-dark)] text-2xl sm:text-3xl">
                Udforsk vores sortiment
              </h2>
              <div className="w-12 h-0.5 bg-[var(--grus-green)] mt-2 mb-8" />
            </div>
          </Reveal>

          {loadingCategories ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[4/3] rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {parentCategories.map((cat, i) => (
                <Reveal key={cat.id} delay={i * 50}>
                  <Link
                    href={`/shop/${cat.slug}`}
                    className="group relative aspect-[4/3] rounded-xl overflow-hidden block"
                  >
                    {cat.image ? (
                      <SmartImage
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                      />
                    ) : (
                      <div
                        className="w-full h-full group-hover:scale-[1.03] transition-transform duration-300"
                        style={{ background: categoryGradients[i % categoryGradients.length] }}
                      />
                    )}
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    {/* Text */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-white font-semibold text-lg leading-tight">
                        {cat.name}
                      </p>
                      <p className="text-white/70 text-sm mt-0.5">
                        {cat.count} produkter
                      </p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== SECTION 4: FEATURED PRODUCTS ===== */}
      <section className="py-12 lg:py-16 bg-[var(--grus-sand)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="font-display font-bold text-[var(--grus-dark)] text-2xl sm:text-3xl">
                  Populære produkter
                </h2>
                <div className="w-12 h-0.5 bg-[var(--grus-green)] mt-2" />
              </div>
              <Link
                href="/shop"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-[var(--grus-green)] hover:text-[var(--grus-green-hover)] transition-colors"
              >
                Se alle
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </Reveal>

          {loadingProducts ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden border border-[var(--grus-border)]">
                  <div className="aspect-square bg-gray-100 animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 w-16 rounded bg-gray-100 animate-pulse" />
                    <div className="h-4 w-3/4 rounded bg-gray-100 animate-pulse" />
                    <div className="h-5 w-1/3 rounded bg-gray-100 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {featuredProducts.map((p, i) => (
                <Reveal key={p.id} delay={i * 40}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          )}

          {/* Mobile "see all" */}
          <Reveal delay={100}>
            <div className="text-center mt-6 sm:hidden">
              <Link
                href="/shop"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--grus-green)]"
              >
                Se alle produkter
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== SECTION 5: VOLUME CALCULATOR CTA ===== */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="bg-[var(--grus-green-light)] rounded-2xl p-8 lg:p-12 flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
              {/* Left: Text (60%) */}
              <div className="flex-[3] text-center lg:text-left">
                <h2 className="font-display font-bold text-[var(--grus-dark)] text-2xl sm:text-3xl mb-3">
                  Beregn hvor meget du har brug for
                </h2>
                <p className="text-gray-600 text-sm sm:text-base max-w-lg mb-6">
                  Brug vores volumenberegner til at finde ud af præcis hvor mange bigbags du skal
                  bestille. Indtast dine mål og få svar med det samme.
                </p>
                <Link
                  href="/volumenberegner"
                  className="inline-flex items-center gap-2 bg-[var(--grus-green)] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[var(--grus-green-hover)] transition-colors"
                >
                  Prøv beregneren
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Right: Icon (40%) */}
              <div className="flex-[2] flex items-center justify-center">
                <div className="w-28 h-28 lg:w-36 lg:h-36 bg-[var(--grus-green)] rounded-3xl flex items-center justify-center shadow-lg">
                  <Calculator className="w-14 h-14 lg:w-20 lg:h-20 text-white" />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ===== SECTION 6: WHY CHOOSE US ===== */}
      <section className="py-12 lg:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-10">
              <h2 className="font-display font-bold text-[var(--grus-dark)] text-2xl sm:text-3xl">
                Hvorfor vælge Gruslevering.dk?
              </h2>
              <div className="w-12 h-0.5 bg-[var(--grus-green)] mt-2 mx-auto" />
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: CheckCircle,
                title: 'Nem bestilling',
                description:
                  'Bestil materialer online på få minutter. Vælg produkt, mængde og leveringsadresse - så klarer vi resten.',
              },
              {
                icon: Leaf,
                title: 'Kvalitetsmaterialer',
                description:
                  'Vi leverer kun materialer af højeste kvalitet fra pålidelige danske leverandører.',
              },
              {
                icon: HeartHandshake,
                title: 'Personlig service',
                description:
                  'Har du spørgsmål? Vores team er altid klar til at hjælpe dig med at finde det rigtige produkt.',
              },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 80}>
                <div className="text-center p-6">
                  <div className="w-14 h-14 bg-[var(--grus-green-light)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-7 h-7 text-[var(--grus-green)]" />
                  </div>
                  <h3 className="font-display font-semibold text-[var(--grus-dark)] text-lg mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION 7: FOOTER CTA ===== */}
      <section className="py-16 lg:py-20" style={{ backgroundColor: 'var(--grus-dark)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <h2 className="font-display font-bold text-white text-2xl sm:text-3xl lg:text-4xl mb-4">
              Klar til at komme i gang?
            </h2>
            <p className="text-white/60 text-base sm:text-lg mb-8 max-w-md mx-auto">
              Udforsk vores sortiment og bestil materialer med fri levering til hele Danmark
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-[var(--grus-green)] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[var(--grus-green-hover)] transition-colors"
              >
                Se produkter
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/kontakt"
                className="inline-flex items-center gap-2 border border-white/30 text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/10 transition-colors"
              >
                Kontakt os
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
