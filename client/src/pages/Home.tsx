import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Truck,
  Clock,
  Star,
  Flag,
  Calculator,
  Quote,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SmartImage from '@/components/SmartImage';
import type { Product, Category } from '@/types/product';

/* ── Helpers ── */

const formatPrice = (price: number) =>
  new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    minimumFractionDigits: 0,
  }).format(price);

/* ── Reveal (simple fade-in on scroll) ── */

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
      className={`transition-opacity duration-700 ease-out ${
        visible ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ── Gradient placeholders for categories ── */

const categoryGradients = [
  'linear-gradient(135deg, #2e7d32 0%, #43a047 100%)',
  'linear-gradient(135deg, #8d6e63 0%, #a1887f 100%)',
  'linear-gradient(135deg, #78909c 0%, #90a4ae 100%)',
  'linear-gradient(135deg, #5d8a5e 0%, #81c784 100%)',
  'linear-gradient(135deg, #a0826d 0%, #bcaaa4 100%)',
  'linear-gradient(135deg, #546e54 0%, #7da67c 100%)',
  'linear-gradient(135deg, #6d7e6d 0%, #95a895 100%)',
  'linear-gradient(135deg, #7e6b5a 0%, #a89484 100%)',
  'linear-gradient(135deg, #4a6b4a 0%, #6d946c 100%)',
  'linear-gradient(135deg, #607060 0%, #889888 100%)',
];

/* ── Testimonials ── */

const testimonials = [
  {
    text: 'Super nemt at bestille online. Gruset blev leveret praecis som aftalt, og kvaliteten var i top. Kan varmt anbefales!',
    stars: 5,
    name: 'Martin H.',
    location: 'Aalborg',
  },
  {
    text: 'Fantastisk service og hurtig levering. Vi brugte volumenberegneren og bestilte praecis den rigtige maengde. Meget tilfreds.',
    stars: 5,
    name: 'Lene K.',
    location: 'Aarhus',
  },
  {
    text: 'Har bestilt flere gange nu. Altid god kvalitet og fair priser. Levering inden for 4 hverdage hver gang.',
    stars: 5,
    name: 'Thomas P.',
    location: 'Koebenhavn',
  },
];

/* ════════════════════════════════════════════════════════
   HOME PAGE
   ════════════════════════════════════════════════════════ */

export default function Home() {
  useEffect(() => {
    document.title = 'Gruslevering.dk - Grus, sand & sten leveret til doeren';
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
    <div className="min-h-screen flex flex-col bg-[#f8faf8]">
      <Header />

      {/* ═══════════════════════════════════════════════════
          SECTION 1 - HERO BANNER
          ═══════════════════════════════════════════════════ */}
      <section className="pt-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div
            className="relative rounded-xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 40%, #1a2332 100%)',
              minHeight: '250px',
            }}
          >
            {/* Subtle pattern overlay */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 70% 50%, rgba(255,255,255,0.15) 0%, transparent 50%)',
              }}
            />

            <div className="relative z-10 px-6 sm:px-10 lg:px-14 py-12 sm:py-16 lg:py-20 max-w-2xl">
              {/* Badge */}
              <span className="inline-flex items-center gap-1.5 bg-white/95 text-[#1a2332] text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
                <Truck className="w-3.5 h-3.5" />
                Fri levering
              </span>

              {/* Heading */}
              <h1 className="font-display font-bold text-white text-3xl sm:text-4xl lg:text-5xl leading-tight mb-4">
                Grus, sand & sten
                <br />
                leveret til doeren
              </h1>

              {/* Subtext */}
              <p className="text-white/80 text-base sm:text-lg mb-8 max-w-md">
                Bestil online og faa leveret i hele Danmark
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 bg-white text-[#1a2332] font-semibold px-6 py-3 rounded-lg shadow hover:shadow-md hover:bg-gray-50 transition-all"
                >
                  Se produkter
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/volumenberegner"
                  className="inline-flex items-center gap-2 border border-white text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/10 transition-all"
                >
                  <Calculator className="w-4 h-4" />
                  Beregn maengde
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 2 - USP STRIP
          ═══════════════════════════════════════════════════ */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap justify-center sm:justify-between gap-4 sm:gap-2">
            {[
              { icon: Truck, text: 'Fri levering i hele DK' },
              { icon: Clock, text: '3-5 hverdages levering' },
              { icon: Star, text: '4.8/5 Trustpilot' },
              { icon: Flag, text: 'Dansk kvalitet siden 2008' },
            ].map((usp) => (
              <div key={usp.text} className="flex items-center gap-2 px-2">
                <usp.icon className="w-4 h-4 text-[#2e7d32] flex-shrink-0" />
                <span className="text-sm text-gray-600 font-medium whitespace-nowrap">
                  {usp.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 3 - PRODUCT CATEGORIES
          ═══════════════════════════════════════════════════ */}
      <section className="py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mb-8">
              <h2 className="font-display font-bold text-[#1a2332] text-2xl sm:text-3xl">
                Udforsk vores sortiment
              </h2>
              <div className="w-12 h-1 bg-[#2e7d32] rounded-full mt-3" />
            </div>
          </Reveal>

          {loadingCategories ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[4/3] rounded-xl skeleton-shimmer" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {parentCategories.map((cat, i) => (
                <Reveal key={cat.id} delay={i * 50}>
                  <Link
                    href={`/shop/${cat.slug}`}
                    className="group relative aspect-[4/3] rounded-xl overflow-hidden block hover:shadow-lg transition-shadow duration-300"
                  >
                    {cat.image ? (
                      <SmartImage
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
                      />
                    ) : (
                      <div
                        className="w-full h-full group-hover:scale-[1.02] transition-transform duration-500 ease-out"
                        style={{ background: categoryGradients[i % categoryGradients.length] }}
                      />
                    )}
                    {/* Dark gradient overlay at bottom */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    {/* Text */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className="text-white font-semibold text-sm sm:text-base leading-tight">
                        {cat.name}
                      </p>
                      <p className="text-white/60 text-xs mt-0.5">
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

      {/* ═══════════════════════════════════════════════════
          SECTION 4 - FEATURED PRODUCTS
          ═══════════════════════════════════════════════════ */}
      <section className="py-12 lg:py-16 bg-[#f8faf8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="font-display font-bold text-[#1a2332] text-2xl sm:text-3xl">
                  Populaere produkter
                </h2>
                <div className="w-12 h-1 bg-[#2e7d32] rounded-full mt-3" />
              </div>
              <Link
                href="/shop"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-[#2e7d32] hover:text-[#1b5e20] transition-colors"
              >
                Se alle
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </Reveal>

          {loadingProducts ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="aspect-square skeleton-shimmer" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 w-16 rounded skeleton-shimmer" />
                    <div className="h-4 w-3/4 rounded skeleton-shimmer" />
                    <div className="h-5 w-1/3 rounded skeleton-shimmer" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {featuredProducts.map((p, i) => (
                <Reveal key={p.id} delay={i * 40}>
                  <Link
                    href={`/produkt/${p.slug || p.id}`}
                    className="group block bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300"
                  >
                    {/* Image area */}
                    <div className="aspect-square bg-gray-50 p-4 flex items-center justify-center overflow-hidden">
                      {p.image ? (
                        <SmartImage
                          src={p.image}
                          alt={p.title}
                          className="w-full h-full object-cover rounded-lg group-hover:scale-[1.03] transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 rounded-lg" />
                      )}
                    </div>

                    {/* Content area */}
                    <div className="p-4">
                      <p className="text-[#2e7d32] text-xs font-medium uppercase tracking-wide mb-1">
                        {p.category}
                      </p>
                      <h3 className="text-sm font-semibold text-[#1a2332] line-clamp-2 leading-snug mb-2 group-hover:text-[#2e7d32] transition-colors">
                        {p.title}
                      </h3>
                      <div className="flex items-baseline gap-2">
                        {p.salePrice && p.salePrice < p.basePrice ? (
                          <>
                            <span className="text-lg font-bold text-[#e65100]">
                              {p.variants && p.variants.length > 0 ? 'Fra ' : ''}
                              {formatPrice(p.salePrice)}
                            </span>
                            <span className="text-sm text-gray-400 line-through">
                              {formatPrice(p.basePrice)}
                            </span>
                          </>
                        ) : (
                          <span className="text-lg font-bold text-[#1a2332]">
                            {p.variants && p.variants.length > 0 ? 'Fra ' : ''}
                            {formatPrice(p.basePrice)}
                          </span>
                        )}
                      </div>
                      {p.deliveryIncluded && (
                        <p className="text-gray-400 text-xs mt-1">inkl. levering</p>
                      )}
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}

          {/* Mobile "see all" */}
          <Reveal delay={100}>
            <div className="text-center mt-6 sm:hidden">
              <Link
                href="/shop"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2e7d32]"
              >
                Se alle produkter
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 5 - VOLUME CALCULATOR BANNER
          ═══════════════════════════════════════════════════ */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="bg-[#e8f5e9] rounded-xl px-6 sm:px-10 py-8 sm:py-10 flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
              {/* Icon */}
              <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-[#2e7d32] rounded-2xl flex items-center justify-center">
                <Calculator className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>

              {/* Text */}
              <div className="flex-1 text-center sm:text-left">
                <h2 className="font-display font-bold text-[#1a2332] text-xl sm:text-2xl mb-2">
                  Beregn hvor meget du har brug for
                </h2>
                <p className="text-gray-600 text-sm sm:text-base max-w-lg">
                  Brug vores volumenberegner til at finde ud af praecis hvor mange bigbags du skal
                  bestille. Indtast dine maal og faa svar med det samme.
                </p>
              </div>

              {/* CTA */}
              <Link
                href="/volumenberegner"
                className="flex-shrink-0 inline-flex items-center gap-2 bg-[#2e7d32] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#1b5e20] transition-colors"
              >
                Proev beregneren
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 6 - TRUST / REVIEWS
          ═══════════════════════════════════════════════════ */}
      <section className="py-12 lg:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-10">
              <h2 className="font-display font-bold text-[#1a2332] text-2xl sm:text-3xl">
                Hvad siger vores kunder?
              </h2>
              <div className="w-12 h-1 bg-[#2e7d32] rounded-full mt-3 mx-auto" />
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} delay={i * 80}>
                <div className="bg-white border border-gray-100 rounded-xl p-6 hover:shadow-sm transition-shadow">
                  {/* Stars */}
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(t.stars)].map((_, s) => (
                      <Star
                        key={s}
                        className="w-4 h-4 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>

                  {/* Quote */}
                  <Quote className="w-5 h-5 text-gray-200 mb-2" />
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    {t.text}
                  </p>

                  {/* Author */}
                  <p className="text-sm font-semibold text-[#1a2332]">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.location}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 7 - FOOTER CTA
          ═══════════════════════════════════════════════════ */}
      <section className="bg-[#1a2332] py-16 lg:py-20">
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
                className="inline-flex items-center gap-2 bg-[#2e7d32] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#1b5e20] transition-colors"
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
