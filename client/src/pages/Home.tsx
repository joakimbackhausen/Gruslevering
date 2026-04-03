import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  ArrowDown,
  Truck,
  Shield,
  Headphones,
  Calculator,
  ChevronRight,
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

/* ── Reveal (IntersectionObserver scroll animation) ── */

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
      className={`transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ── Gradient placeholders for categories ── */

const categoryGradients = [
  'linear-gradient(135deg, #2d4a2d 0%, #3d6a3a 50%, #4a7a48 100%)',
  'linear-gradient(135deg, #8a7560 0%, #b5a08a 50%, #c8b49a 100%)',
  'linear-gradient(135deg, #6b6b6b 0%, #8a8a8a 50%, #a0a0a0 100%)',
  'linear-gradient(135deg, #5a7a5a 0%, #7a9a78 50%, #8aaa88 100%)',
  'linear-gradient(135deg, #8a7050 0%, #a08868 50%, #b8a080 100%)',
  'linear-gradient(135deg, #4a5a4a 0%, #6a7a68 50%, #7a8a78 100%)',
];

/* ════════════════════════════════════════════════════════
   HOME PAGE
   ════════════════════════════════════════════════════════ */

export default function Home() {
  useEffect(() => {
    document.title = 'Gruslevering.dk — Naturens bedste materialer, leveret til dig';
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
    .slice(0, 6);

  const featuredProducts = products.slice(0, 8);
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--grus-bg)' }}>
      <Header />

      {/* ═══════════════════════════════════════════════════
          SECTION 1 — HERO
          ═══════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center overflow-hidden grain">
        {/* Layered background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(160deg, #1a1f1a 0%, #1a2e1a 40%, #2d4a2d 70%, #3d5a3a 100%)',
          }}
        />
        {/* Radial glow */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 50% 45%, rgba(45,106,48,0.15) 0%, transparent 70%)',
          }}
        />
        {/* Top vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />

        {/* Content */}
        <div className="relative z-10 max-w-[1260px] mx-auto px-5 sm:px-6 w-full pt-40 pb-32 lg:pt-48 lg:pb-40">
          {/* Label */}
          <Reveal>
            <div className="flex items-center gap-4 mb-8">
              <div className="editorial-divider" />
              <span className="text-white/50 text-[11px] font-medium tracking-[0.3em] uppercase">
                Siden 2008
              </span>
            </div>
          </Reveal>

          {/* Title */}
          <Reveal delay={100}>
            <h1 className="font-display font-bold tracking-tight text-white text-5xl sm:text-6xl lg:text-7xl xl:text-8xl leading-[0.95] mb-6 max-w-4xl">
              Naturens bedste
              <br />
              materialer
            </h1>
          </Reveal>

          {/* Subtitle */}
          <Reveal delay={200}>
            <p className="font-display font-light text-white/50 text-2xl sm:text-3xl tracking-tight mb-6 max-w-2xl">
              leveret direkte til dig
            </p>
          </Reveal>

          {/* Description */}
          <Reveal delay={300}>
            <p className="text-white/35 text-lg max-w-lg mb-12 leading-relaxed">
              Grus, sand, sten og havematerialer i bigbags med fri levering i hele Danmark.
              Kvalitet du kan maerke.
            </p>
          </Reveal>

          {/* CTAs */}
          <Reveal delay={400}>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/shop"
                className="group inline-flex items-center gap-3 bg-white text-[var(--grus-dark)] text-base font-medium px-8 py-4 rounded-full hover:bg-white/90 transition-all duration-300"
              >
                Udforsk sortimentet
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
              <Link
                href="/volumenberegner"
                className="inline-flex items-center gap-3 bg-transparent text-white text-base font-medium px-8 py-4 rounded-full border border-white/20 hover:border-white/40 hover:bg-white/5 transition-all duration-300"
              >
                <Calculator className="w-4 h-4" />
                Beregn maengde
              </Link>
            </div>
          </Reveal>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 animate-fade-in" style={{ animationDelay: '1.2s' }}>
          <span className="text-white/25 text-[10px] tracking-[0.3em] uppercase">Scroll</span>
          <ArrowDown className="w-4 h-4 text-white/25 animate-float" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 2 — TRUST BAR (Marquee)
          ═══════════════════════════════════════════════════ */}
      <section className="py-5 overflow-hidden" style={{ backgroundColor: 'var(--grus-warm)' }}>
        <div className="animate-marquee flex whitespace-nowrap">
          {[...Array(3)].map((_, rep) => (
            <div key={rep} className="flex items-center shrink-0">
              {[
                'Fri levering',
                '3\u20135 hverdages levering',
                'Dansk kvalitet siden 2008',
                '4.8\u2605 Trustpilot',
              ].map((item, i) => (
                <span key={i} className="flex items-center">
                  <span className="text-[11px] font-medium tracking-[0.25em] uppercase text-[var(--grus-stone)] px-8">
                    {item}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-[var(--grus-stone)]/40" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 3 — CATEGORIES (Asymmetric Editorial Grid)
          ═══════════════════════════════════════════════════ */}
      <section className="py-24 lg:py-32">
        <div className="max-w-[1260px] mx-auto px-5 sm:px-6">
          {/* Section header */}
          <Reveal>
            <div className="mb-16">
              <div className="flex items-center gap-4 mb-5">
                <div className="editorial-divider" />
                <span className="text-[var(--grus-stone)] text-[11px] font-medium tracking-[0.3em] uppercase">
                  Sortiment
                </span>
              </div>
              <h2 className="font-display font-bold tracking-tight text-[var(--grus-dark)] text-4xl lg:text-5xl xl:text-6xl max-w-xl">
                Udforsk vores materialer
              </h2>
            </div>
          </Reveal>

          {loadingCategories ? (
            <div className="grid grid-cols-2 gap-4 lg:gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`skeleton-shimmer rounded-2xl ${i < 2 ? 'aspect-[3/4]' : 'aspect-square'}`} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 lg:gap-5 auto-rows-auto">
              {/* First two: large, 3 cols each */}
              {parentCategories.slice(0, 2).map((cat, i) => (
                <Reveal key={cat.id} delay={i * 100} className="col-span-1 lg:col-span-3">
                  <Link
                    href={`/shop/${cat.slug}`}
                    className="group relative aspect-[3/4] rounded-2xl overflow-hidden block"
                  >
                    {cat.image ? (
                      <SmartImage
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
                      />
                    ) : (
                      <div
                        className="w-full h-full"
                        style={{ background: categoryGradients[i] }}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent group-hover:from-black/80 transition-all duration-500" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
                      <p className="text-white/40 text-[11px] font-medium tracking-[0.2em] uppercase mb-2">
                        {cat.count} produkter
                      </p>
                      <p className="font-display font-bold text-white text-2xl lg:text-3xl tracking-tight">
                        {cat.name}
                      </p>
                    </div>
                  </Link>
                </Reveal>
              ))}

              {/* Next three: smaller, 2 cols each */}
              {parentCategories.slice(2, 5).map((cat, i) => (
                <Reveal key={cat.id} delay={(i + 2) * 100} className="col-span-1 lg:col-span-2">
                  <Link
                    href={`/shop/${cat.slug}`}
                    className="group relative aspect-square rounded-2xl overflow-hidden block"
                  >
                    {cat.image ? (
                      <SmartImage
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
                      />
                    ) : (
                      <div
                        className="w-full h-full"
                        style={{ background: categoryGradients[i + 2] }}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent group-hover:from-black/80 transition-all duration-500" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 lg:p-6">
                      <p className="text-white/40 text-[10px] font-medium tracking-[0.2em] uppercase mb-1.5">
                        {cat.count} produkter
                      </p>
                      <p className="font-display font-bold text-white text-xl lg:text-2xl tracking-tight">
                        {cat.name}
                      </p>
                    </div>
                  </Link>
                </Reveal>
              ))}

              {/* Last one: full-width banner */}
              {parentCategories.slice(5, 6).map((cat, i) => (
                <Reveal key={cat.id} delay={500} className="col-span-2 lg:col-span-6">
                  <Link
                    href={`/shop/${cat.slug}`}
                    className="group relative aspect-[2/1] lg:aspect-[3/1] rounded-2xl overflow-hidden block"
                  >
                    {cat.image ? (
                      <SmartImage
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                      />
                    ) : (
                      <div
                        className="w-full h-full"
                        style={{ background: categoryGradients[5] }}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent group-hover:from-black/70 transition-all duration-500" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-10">
                      <p className="text-white/40 text-[11px] font-medium tracking-[0.2em] uppercase mb-2">
                        {cat.count} produkter
                      </p>
                      <p className="font-display font-bold text-white text-2xl lg:text-4xl tracking-tight">
                        {cat.name}
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
          SECTION 4 — FEATURED PRODUCTS (Horizontal snap scroll)
          ═══════════════════════════════════════════════════ */}
      <section className="py-24 lg:py-32" style={{ backgroundColor: 'var(--grus-sand)' }}>
        <div className="max-w-[1260px] mx-auto px-5 sm:px-6">
          {/* Section header */}
          <Reveal>
            <div className="flex items-end justify-between mb-12">
              <div>
                <div className="flex items-center gap-4 mb-5">
                  <div className="editorial-divider" />
                  <span className="text-[var(--grus-stone)] text-[11px] font-medium tracking-[0.3em] uppercase">
                    Udvalgte
                  </span>
                </div>
                <h2 className="font-display font-bold tracking-tight text-[var(--grus-dark)] text-4xl lg:text-5xl">
                  Populaere produkter
                </h2>
              </div>
              <Link
                href="/shop"
                className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-[var(--grus-dark)] hover:text-[var(--grus-green)] transition-colors"
              >
                Se alle produkter
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </Reveal>

          {loadingProducts ? (
            <div className="flex gap-5 overflow-hidden">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-72 h-96 skeleton-shimmer rounded-2xl" />
              ))}
            </div>
          ) : (
            <div
              ref={scrollRef}
              className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-thin -mx-5 px-5 sm:-mx-6 sm:px-6"
              style={{ scrollbarWidth: 'thin' }}
            >
              {featuredProducts.map((p, i) => (
                <Reveal key={p.id} delay={i * 60} className={`flex-shrink-0 snap-start ${i === 0 ? 'w-[320px] sm:w-[360px]' : 'w-[260px] sm:w-[290px]'}`}>
                  <Link
                    href={`/produkt/${p.slug || p.id}`}
                    className="group block bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-500 hover:-translate-y-1 h-full"
                  >
                    {/* Image */}
                    <div
                      className={`relative overflow-hidden ${i === 0 ? 'aspect-[3/4]' : 'aspect-[4/3]'}`}
                      style={{ backgroundColor: '#f0ede8' }}
                    >
                      {p.image ? (
                        <SmartImage
                          src={p.image}
                          alt={p.title}
                          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
                        />
                      ) : (
                        <div className="w-full h-full" style={{ backgroundColor: '#f0ede8' }} />
                      )}
                      {/* Category badge */}
                      <span className="absolute top-4 left-4 text-[10px] font-medium tracking-[0.15em] uppercase px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm text-[var(--grus-dark)]">
                        {p.category}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="p-5">
                      <h3 className="font-display font-semibold text-[var(--grus-dark)] text-base leading-snug mb-3 line-clamp-2 group-hover:text-[var(--grus-green)] transition-colors">
                        {p.title}
                      </h3>
                      <p className="text-[var(--grus-dark)] text-lg font-bold tracking-tight">
                        {p.variants && p.variants.length > 0 ? 'Fra ' : ''}
                        {formatPrice(p.salePrice ?? p.basePrice)}
                      </p>
                      {p.deliveryIncluded && (
                        <p className="text-[var(--grus-stone)] text-xs mt-1">inkl. levering</p>
                      )}
                    </div>
                  </Link>
                </Reveal>
              ))}

              {/* "See all" card at end */}
              <div className="flex-shrink-0 snap-start w-[200px] flex items-center justify-center">
                <Link
                  href="/shop"
                  className="group flex flex-col items-center gap-3 text-[var(--grus-dark)] hover:text-[var(--grus-green)] transition-colors"
                >
                  <div className="w-14 h-14 rounded-full border-2 border-current flex items-center justify-center group-hover:bg-[var(--grus-green)] group-hover:border-[var(--grus-green)] group-hover:text-white transition-all duration-300">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium whitespace-nowrap">Se alle</span>
                </Link>
              </div>
            </div>
          )}

          {/* Mobile "see all" link */}
          <Reveal delay={200}>
            <div className="text-center mt-8 sm:hidden">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--grus-dark)] hover:text-[var(--grus-green)] transition-colors"
              >
                Se alle produkter
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 5 — VOLUME CALCULATOR CTA
          ═══════════════════════════════════════════════════ */}
      <section
        className="relative py-24 lg:py-32 overflow-hidden grain"
        style={{ backgroundColor: 'var(--grus-dark)' }}
      >
        <div className="max-w-[1260px] mx-auto px-5 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left: text */}
            <Reveal>
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="editorial-divider" />
                  <span className="text-white/30 text-[11px] font-medium tracking-[0.3em] uppercase">
                    Vaerktoej
                  </span>
                </div>
                <h2 className="font-display font-bold tracking-tight text-white text-4xl lg:text-5xl xl:text-6xl leading-[1.05] mb-6">
                  Hvor meget har
                  <br />
                  du brug for?
                </h2>
                <p className="text-white/40 text-lg leading-relaxed mb-10 max-w-md">
                  Brug vores volumenberegner til at finde ud af praecis hvor mange bigbags du
                  skal bestille. Indtast dine maal og faa svar med det samme.
                </p>
                <Link
                  href="/volumenberegner"
                  className="group inline-flex items-center gap-3 bg-white text-[var(--grus-dark)] text-base font-medium px-8 py-4 rounded-full hover:bg-white/90 transition-all duration-300"
                >
                  Proev beregneren
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </div>
            </Reveal>

            {/* Right: large typographic display */}
            <Reveal delay={150}>
              <div className="hidden lg:flex items-center justify-center">
                <div className="relative">
                  {/* Giant abstract number */}
                  <span
                    className="font-display font-bold text-[200px] xl:text-[260px] leading-none tracking-tighter select-none"
                    style={{ color: 'rgba(255,255,255,0.04)' }}
                  >
                    m&sup3;
                  </span>
                  {/* Accent ring */}
                  <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border border-white/10"
                  />
                  <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full"
                    style={{ backgroundColor: 'var(--grus-green)', opacity: 0.15 }}
                  />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 6 — VALUES / TRUST
          ═══════════════════════════════════════════════════ */}
      <section className="py-24 lg:py-32" style={{ backgroundColor: 'var(--grus-bg)' }}>
        <div className="max-w-[1260px] mx-auto px-5 sm:px-6">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="font-display font-bold tracking-tight text-[var(--grus-dark)] text-4xl lg:text-5xl mb-4">
                Hvorfor vaelge os
              </h2>
              <p className="text-[var(--grus-stone)] text-lg max-w-md mx-auto">
                Vi goer det nemt at faa de materialer du har brug for
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                icon: Shield,
                title: 'Kvalitet',
                description:
                  'Alle vores materialer er noeje udvalgt fra danske leverandoerer. Leveres i praktiske bigbags, klar til brug.',
              },
              {
                icon: Truck,
                title: 'Levering',
                description:
                  'Fri levering til alle faste danske oeer. Bestil i dag og faa dine materialer leveret inden for faa hverdage.',
              },
              {
                icon: Headphones,
                title: 'Service',
                description:
                  'Ring til os for personlig raadgivning om materialevalg og maengder. Vi er altid klar til at hjaelpe.',
              },
            ].map((feature, i) => (
              <Reveal key={feature.title} delay={i * 120}>
                <div className="text-center lg:text-left">
                  {/* Icon */}
                  <div
                    className="w-14 h-14 rounded-2xl mx-auto lg:mx-0 mb-6 flex items-center justify-center"
                    style={{ backgroundColor: 'var(--grus-green)', opacity: 0.9 }}
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-display font-bold text-[var(--grus-dark)] text-xl tracking-tight mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-[var(--grus-stone)] text-[15px] leading-relaxed max-w-sm mx-auto lg:mx-0">
                    {feature.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 7 — CLOSING CTA
          ═══════════════════════════════════════════════════ */}
      <section
        className="relative py-24 lg:py-32 overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #2d6a30 0%, #1a4a1e 60%, #1a2e1a 100%)',
        }}
      >
        {/* Grain */}
        <div className="absolute inset-0 grain" />

        <div className="max-w-[1260px] mx-auto px-5 sm:px-6 text-center relative z-10">
          <Reveal>
            <h2 className="font-display font-bold tracking-tight text-white text-4xl sm:text-5xl lg:text-6xl xl:text-7xl leading-[1] mb-6 max-w-3xl mx-auto">
              Klar til dit
              <br />
              naeste projekt?
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="text-white/40 text-lg max-w-md mx-auto mb-10 leading-relaxed">
              Udforsk vores sortiment og bestil materialer med fri levering til hele Danmark
            </p>
          </Reveal>
          <Reveal delay={200}>
            <Link
              href="/shop"
              className="group inline-flex items-center gap-3 bg-white text-[var(--grus-dark)] text-base font-medium px-10 py-4 rounded-full hover:bg-white/90 transition-all duration-300"
            >
              Se vores produkter
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
