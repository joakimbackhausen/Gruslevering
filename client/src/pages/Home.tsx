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
  ChevronLeft,
  ChevronRight,
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

/* -- Product Card (Plantorama-style) -- */

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
      <div className="relative aspect-square bg-gradient-to-b from-[#f5f5f5] to-[#ececec] p-4">
        {product.image ? (
          <SmartImage
            src={product.image}
            alt={product.title}
            className="w-full h-full object-contain group-hover:scale-[1.03] transition-transform duration-300"
            width={300}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
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
          <span className="block w-full text-center py-2.5 rounded-lg text-[13px] font-semibold text-[var(--grus-green)] bg-green-50 group-hover:bg-green-100 transition-colors">
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

/* ================================================================
   HOME PAGE - Plantorama-style layout
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

  /* Product carousel scroll */
  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollCarousel = (dir: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const amount = carouselRef.current.offsetWidth * 0.8;
    carouselRef.current.scrollBy({
      left: dir === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* ═══ PROMOTIONAL BANNERS (Plantorama-style colored bars) ═══ */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-2 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto w-full mt-2"
        style={{ paddingTop: 'var(--header-h, 164px)' }}
      >
        <Link
          href="/levering"
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white text-[13px] font-semibold transition-all hover:opacity-90 hover:shadow-md"
          style={{ backgroundColor: '#2B5B2B' }}
        >
          <Truck className="w-4 h-4 shrink-0" />
          Fri levering på alle ordrer &ndash; se betingelser her
        </Link>
        <Link
          href="/volumenberegner"
          className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white text-[13px] font-semibold transition-all hover:opacity-90 hover:shadow-md"
          style={{ backgroundColor: '#D4844C' }}
        >
          <Calculator className="w-4 h-4 shrink-0" />
          Beregn hvor meget materiale du skal bruge
        </Link>
      </div>

      {/* ═══ HERO BANNER (Plantorama-style full-width image with text overlay) ═══ */}
      <section className="mt-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1400px] mx-auto">
          <div
            className="relative rounded-2xl overflow-hidden min-h-[300px] sm:min-h-[400px] lg:min-h-[500px] flex items-center"
          >
            {/* Background image */}
            {/* Hero image - delivery truck from gruslevering.dk */}
            <img
              src="/api/img?url=https%3A%2F%2Fgruslevering.dk%2Fwp-content%2Fuploads%2F2026%2F03%2Fimage.jpg&w=1400"
              alt="Grus, sten og jord leveret til døren"
              className="absolute inset-0 w-full h-full object-cover"
              fetchPriority="high"
              decoding="sync"
            />
            {/* Dark overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />

            {/* Content - inspired by gruslevering.dk nytestforside */}
            <div className="relative z-10 px-8 lg:px-16 py-14 lg:py-20 max-w-3xl">
              <h1 className="font-display font-extrabold text-white text-[28px] sm:text-[40px] lg:text-[56px] uppercase leading-[1.05] mb-5 tracking-tight drop-shadow-lg">
                Grus, sten og jord
                <br />
                leveret direkte
                <br />
                til døren
              </h1>

              <p className="text-white/80 text-base lg:text-lg mb-8 max-w-md leading-relaxed drop-shadow">
                Big bags i højkvalitet &ndash; Fri levering i hele landet
              </p>

              {/* CTA */}
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 font-bold text-base lg:text-lg px-8 lg:px-10 py-4 rounded-xl shadow-xl hover:shadow-2xl hover:translate-y-[-2px] transition-all text-white"
                style={{ backgroundColor: '#2B5B2B' }}
              >
                Se alle produkter
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ USP BAR ═══ */}
      <section className="py-6 lg:py-8 border-b border-gray-100">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-y-6 gap-x-4">
            {[
              { icon: '🚚', title: 'Gratis levering', desc: 'På alle bigbag produkter' },
              { icon: '✅', title: 'Kun kvalitet', desc: 'Håndplukkede materialer' },
              { icon: '📦', title: 'Hurtig levering', desc: '3\u20135 hverdages levering' },
              { icon: '🏠', title: 'Til din adresse', desc: 'Levering i hele Danmark' },
              { icon: '💰', title: 'Ingen gebyrer', desc: 'Pris inkl. levering' },
              { icon: '📞', title: 'Kundeservice', desc: 'Ring 72 49 44 44' },
            ].map((usp) => (
              <div key={usp.title} className="flex flex-col items-center text-center">
                <span className="text-2xl mb-2">{usp.icon}</span>
                <span className="text-sm font-semibold text-[var(--grus-dark)]">{usp.title}</span>
                <span className="text-xs text-gray-500 mt-0.5">{usp.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRODUCT CAROUSEL SECTION (Plantorama-style with arrows) ═══ */}
      <section className="py-10 lg:py-14">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-bold text-gray-900 text-xl sm:text-2xl lg:text-[28px]">
                Populære produkter
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => scrollCarousel('left')}
                  className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-400 transition-colors"
                  aria-label="Scroll venstre"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => scrollCarousel('right')}
                  className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:border-gray-400 transition-colors"
                  aria-label="Scroll højre"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </Reveal>

          {loadingProducts ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-100">
                  <div className="aspect-square bg-gray-100 animate-pulse" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-gray-100 animate-pulse" />
                    <div className="h-5 w-1/3 rounded bg-gray-100 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Scrollable carousel */}
              <div
                ref={carouselRef}
                className="flex gap-4 overflow-x-auto scroll-smooth pb-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <style>{`.product-carousel::-webkit-scrollbar { display: none; }`}</style>
                {featuredProducts.map((p) => (
                  <div key={p.id} className="shrink-0 w-[220px] sm:w-[240px] lg:w-[260px]">
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>

              {/* "See all" link */}
              <div className="text-center mt-6">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--grus-green)] hover:text-[var(--grus-green-hover)] transition-colors"
                >
                  Se alle produkter
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ═══ CATEGORY GRID (Plantorama-style big visual tiles) ═══ */}
      <section className="py-12 lg:py-16 bg-[#f7f7f5]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="font-display font-bold text-gray-900 text-xl sm:text-2xl lg:text-[28px] mb-8">
              Udforsk vores sortiment
            </h2>
          </Reveal>

          {loadingCategories ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[4/3] rounded-2xl bg-gray-200 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
              {parentCategories.map((cat, i) => (
                <Reveal key={cat.id} delay={i * 50}>
                  <Link
                    href={`/shop/${cat.slug}`}
                    className="group relative aspect-[4/3] rounded-2xl overflow-hidden block shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    {cat.image ? (
                      <SmartImage
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-500"
                        width={350}
                      />
                    ) : (
                      <div
                        className="w-full h-full group-hover:scale-[1.06] transition-transform duration-500"
                        style={{ background: categoryGradients[i % categoryGradients.length] }}
                      />
                    )}
                    {/* Darker, richer gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/75 transition-all duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-5">
                      <p className="text-white font-bold text-base lg:text-lg leading-tight drop-shadow-md">
                        {cat.name}
                      </p>
                      <p className="text-white/70 text-[13px] mt-1 flex items-center gap-1">
                        {cat.count} produkter
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                      </p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══ VALUE PROPOSITIONS (like gruslevering nytestforside) ═══ */}
      <section className="py-10 lg:py-12 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 lg:gap-4">
            {[
              { emoji: '🚚', title: 'Gratis levering', desc: 'På alle bigbag produkter' },
              { emoji: '✅', title: 'Kun kvalitet', desc: 'Håndplukkede materialer' },
              { emoji: '📦', title: 'Hurtig levering', desc: '3-5 hverdages levering' },
              { emoji: '🏠', title: 'Til din adresse', desc: 'Levering i hele Danmark' },
              { emoji: '💰', title: 'Ingen gebyrer', desc: 'Pris inkl. levering' },
              { emoji: '📞', title: 'Kundeservice', desc: 'Ring 72 49 44 44' },
            ].map((item) => (
              <div key={item.title} className="flex flex-col items-center text-center gap-2">
                <span className="text-2xl lg:text-3xl">{item.emoji}</span>
                <div>
                  <p className="text-sm font-bold text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ VOLUME CALCULATOR CTA (polished) ═══ */}
      <section className="py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1400px] mx-auto">
          <Reveal>
            <div className="relative rounded-2xl overflow-hidden p-8 lg:p-14 flex flex-col lg:flex-row items-center gap-8 lg:gap-14">
              {/* Background */}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #2B5B2B 0%, #1B4520 100%)' }} />
              <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23fff\' fill-opacity=\'1\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'20\' cy=\'20\' r=\'2\'/%3E%3C/g%3E%3C/svg%3E")' }} />

              <div className="flex-[3] text-center lg:text-left relative z-10">
                <span className="inline-block text-green-300 text-xs font-bold uppercase tracking-widest mb-3">Gratis værktøj</span>
                <h2 className="font-display font-bold text-white text-2xl sm:text-3xl lg:text-[34px] mb-3 leading-tight">
                  Beregn hvor meget
                  <br />du har brug for
                </h2>
                <p className="text-white/70 text-[15px] max-w-lg mb-7 leading-relaxed">
                  Brug vores volumenberegner til at finde ud af præcis hvor mange bigbags du skal
                  bestille. Indtast dine mål og få svar med det samme.
                </p>
                <Link
                  href="/volumenberegner"
                  className="inline-flex items-center gap-2 bg-white text-[#2B5B2B] font-bold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  <Calculator className="w-4.5 h-4.5" />
                  Prøv beregneren
                </Link>
              </div>

              <div className="flex-[2] flex items-center justify-center relative z-10">
                <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-3xl bg-white/10 backdrop-blur-sm flex items-center justify-center shadow-2xl border border-white/10">
                  <Calculator className="w-16 h-16 lg:w-20 lg:h-20 text-white/90" />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ WHY CHOOSE US (polished cards) ═══ */}
      <section className="py-12 lg:py-16 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="font-display font-bold text-gray-900 text-xl sm:text-2xl lg:text-[28px] text-center mb-10">
              Hvorfor vælge Gruslevering.dk?
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: CheckCircle,
                title: 'Nem bestilling',
                description:
                  'Bestil materialer online på få minutter. Vælg produkt, mængde og leveringsadresse.',
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
                  'Har du spørgsmål? Vores team er altid klar til at hjælpe dig med at finde det rigtige.',
              },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 80}>
                <div className="text-center p-8 rounded-2xl bg-[#f7f7f5] hover:bg-[#f0f0ec] transition-colors">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: '#2B5B2B' }}>
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="font-display font-bold text-gray-900 text-lg mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-500 text-[14px] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FOOTER CTA ═══ */}
      <section className="py-16 lg:py-20" style={{ backgroundColor: '#2B5B2B' }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
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
                className="inline-flex items-center gap-2 bg-white text-[#2B5B2B] font-bold px-7 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                Se produkter
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/kontakt"
                className="inline-flex items-center gap-2 border-2 border-white/30 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-white/10 transition-colors"
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
