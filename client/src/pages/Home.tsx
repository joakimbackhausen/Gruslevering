import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { Loader2, ArrowRight, Truck, Zap, Flag, Star, ShoppingCart, Calculator, Shield, MapPin, Phone, ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SmartImage from '@/components/SmartImage';
import { useCart } from '@/contexts/CartContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Product, Category } from '@/types/product';

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK', minimumFractionDigits: 0 }).format(price);
};

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold: 0.08 });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`transition-all duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${v ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const { addItem } = useCart();

  useEffect(() => { document.title = 'Gruslevering.dk - Grus, sand og sten leveret til doeren'; }, []);

  useEffect(() => {
    (async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/categories'),
        ]);
        const prodData = await prodRes.json();
        const catData = await catRes.json();
        if (Array.isArray(prodData)) setProducts(prodData);
        if (Array.isArray(catData)) setCategories(catData);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const parentCategories = categories
    .filter((c) => c.parentId === null)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const featuredProducts = products.slice(0, 8);

  // Carousel: show 4 on desktop, 2 on tablet, 1 on mobile
  const getVisibleCount = () => {
    if (typeof window === 'undefined') return 4;
    if (window.innerWidth >= 1024) return 4;
    if (window.innerWidth >= 640) return 2;
    return 1;
  };

  const maxIndex = Math.max(0, featuredProducts.length - getVisibleCount());

  const categoryColors = [
    'from-emerald-600 to-emerald-800',
    'from-amber-600 to-amber-800',
    'from-slate-600 to-slate-800',
    'from-sky-600 to-sky-800',
    'from-orange-600 to-orange-800',
    'from-teal-600 to-teal-800',
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {/* ═══ SECTION 1: HERO ═══ */}
      <section className="relative overflow-hidden">
        <div className="relative min-h-[85vh] flex items-center">
          {/* Background gradient (no hero image yet) */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #1a3a1a 30%, #2d7a2d 60%, #3f9b3f 100%)',
            }}
          />
          {/* Subtle texture overlay */}
          <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          {/* Dark gradient overlay for bottom fade */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

          <div className="relative z-10 max-w-[1260px] mx-auto px-5 sm:px-6 w-full pt-32 pb-24">
            <Reveal>
              <p className="text-white/60 text-[14px] font-medium tracking-[0.25em] uppercase mb-6">
                Gruslevering.dk — Siden 2008
              </p>
            </Reveal>
            <Reveal delay={100}>
              <h1 className="text-white text-[40px] sm:text-[56px] lg:text-[72px] font-bold leading-[1.08] mb-6 max-w-3xl">
                Grus, sand og sten
                <br />
                <span className="text-[#7dd87d]">— leveret til doeren</span>
              </h1>
            </Reveal>
            <Reveal delay={200}>
              <p className="text-white/70 text-[18px] sm:text-[20px] max-w-xl mb-10 leading-relaxed">
                Bestil materialer i bigbags med fri levering i hele Danmark. Kvalitetsmaterialer til enhver opgave.
              </p>
            </Reveal>
            <Reveal delay={300}>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/shop"
                  className="group inline-flex items-center gap-2.5 text-white text-[16px] font-semibold px-8 py-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                  style={{ backgroundColor: 'var(--grus-green)', }}
                >
                  Se produkter <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
                <Link
                  href="/volumenberegner"
                  className="inline-flex items-center gap-2.5 bg-white/[0.1] backdrop-blur-md text-white text-[16px] font-semibold px-8 py-4 rounded-lg border border-white/[0.2] hover:bg-white/[0.18] transition-all duration-300"
                >
                  <Calculator className="w-5 h-5" /> Beregn maengde
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 2: USP BAR ═══ */}
      <section style={{ backgroundColor: 'var(--grus-green)' }}>
        <div className="max-w-[1260px] mx-auto px-5 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/20">
            {[
              { icon: Truck, text: 'Fri levering i hele DK' },
              { icon: Zap, text: 'Hurtig levering' },
              { icon: Flag, text: 'Dansk virksomhed siden 2008' },
              { icon: Star, text: '4.8/5 paa Trustpilot' },
            ].map((usp, i) => (
              <div key={i} className="flex items-center justify-center gap-3 py-5 px-4 text-white">
                <usp.icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-[13px] sm:text-[14px] font-medium">{usp.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 3: POPULAERE KATEGORIER ═══ */}
      <section className="py-16 lg:py-24">
        <div className="max-w-[1260px] mx-auto px-5 sm:px-6">
          <Reveal>
            <div className="text-center mb-12">
              <h2 className="text-[32px] lg:text-[42px] font-bold text-[#1a1a2e] mb-3">Udforsk vores sortiment</h2>
              <p className="text-gray-500 text-[17px] max-w-lg mx-auto">Find de rigtige materialer til dit projekt</p>
            </div>
          </Reveal>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              {parentCategories.map((cat, i) => (
                <Reveal key={cat.id} delay={i * 80}>
                  <Link
                    href={`/shop/${cat.slug}`}
                    className="group relative aspect-[4/3] rounded-xl overflow-hidden block"
                  >
                    {cat.image ? (
                      <SmartImage
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700 ease-out"
                      />
                    ) : (
                      <div className={`w-full h-full bg-gradient-to-br ${categoryColors[i % categoryColors.length]}`} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent group-hover:from-black/80 transition-all duration-500" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <p className="text-white/50 text-[12px] font-medium tracking-[0.15em] uppercase mb-1">{cat.count} produkter</p>
                      <p className="text-white font-bold text-[20px] lg:text-[22px] leading-tight">{cat.name}</p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══ SECTION 4: UDVALGTE PRODUKTER (Carousel) ═══ */}
      <section className="py-16 lg:py-24 bg-[#f7f7f5]">
        <div className="max-w-[1260px] mx-auto px-5 sm:px-6">
          <Reveal>
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-[13px] font-semibold tracking-[0.2em] uppercase mb-2" style={{ color: 'var(--grus-green)' }}>Udvalgte</p>
                <h2 className="text-[32px] lg:text-[42px] font-bold text-[#1a1a2e]">Populaere produkter</h2>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() => setCarouselIndex((prev) => Math.max(0, prev - 1))}
                  disabled={carouselIndex === 0}
                  className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-white disabled:opacity-30 transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCarouselIndex((prev) => Math.min(maxIndex, prev + 1))}
                  disabled={carouselIndex >= maxIndex}
                  className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-white disabled:opacity-30 transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </Reveal>

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
          ) : (
            <>
              <div className="overflow-hidden">
                <div
                  className="flex gap-5 transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${carouselIndex * (100 / getVisibleCount() + 1.25)}%)` }}
                >
                  {featuredProducts.map((p, i) => (
                    <div
                      key={p.id}
                      className="flex-shrink-0"
                      style={{ width: `calc(${100 / getVisibleCount()}% - ${(getVisibleCount() - 1) * 20 / getVisibleCount()}px)` }}
                    >
                      <Reveal delay={i * 60}>
                        <Card className="group overflow-hidden border-gray-100 hover:shadow-lg transition-all duration-300">
                          <Link href={`/produkt/${p.id}`}>
                            <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                              {p.image ? (
                                <SmartImage src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              ) : <div className="w-full h-full bg-gray-100" />}
                              <span
                                className="absolute top-3 left-3 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full"
                                style={{ backgroundColor: 'var(--grus-green)' }}
                              >
                                {p.category}
                              </span>
                            </div>
                          </Link>
                          <CardContent className="p-4">
                            <Link href={`/produkt/${p.id}`}>
                              <h3 className="text-[15px] font-semibold text-[#1a1a2e] leading-snug mb-3 line-clamp-2 hover:opacity-70 transition-opacity">{p.title}</h3>
                            </Link>
                            <div className="flex items-end justify-between pt-3 border-t border-gray-100">
                              <div>
                                <p className="text-[17px] font-bold text-[#1a1a2e] tracking-tight">
                                  {p.variants && p.variants.length > 0 ? 'Fra ' : ''}{formatPrice(p.salePrice ?? p.basePrice)}
                                </p>
                                <p className="text-[11px] text-gray-400 mt-0.5">inkl. levering</p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  addItem({
                                    id: String(p.id),
                                    title: p.title,
                                    price: p.salePrice ?? p.basePrice,
                                    image: p.image,
                                    sku: p.sku,
                                  });
                                }}
                                className="inline-flex items-center gap-1.5 text-white text-[13px] font-semibold px-4 py-2 rounded-lg transition-all duration-200"
                                style={{ backgroundColor: 'var(--grus-green)' }}
                              >
                                <ShoppingCart className="w-3.5 h-3.5" /> Koeb
                              </button>
                            </div>
                          </CardContent>
                        </Card>
                      </Reveal>
                    </div>
                  ))}
                </div>
              </div>

              <Reveal delay={200}>
                <div className="text-center mt-10">
                  <Link
                    href="/shop"
                    className="inline-flex items-center gap-2 text-[15px] font-semibold transition-colors"
                    style={{ color: 'var(--grus-green)' }}
                  >
                    Se alle produkter <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </Reveal>
            </>
          )}
        </div>
      </section>

      {/* ═══ SECTION 5: VOLUMENBEREGNER CTA ═══ */}
      <section
        className="py-16 lg:py-24 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--grus-green) 0%, #1a5a1a 100%)' }}
      >
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="max-w-[1260px] mx-auto px-5 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <Reveal>
              <div>
                <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center mb-6">
                  <Calculator className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-[32px] lg:text-[42px] font-bold text-white mb-4 leading-tight">
                  Hvor meget skal du bruge?
                </h2>
                <p className="text-white/80 text-[17px] leading-relaxed mb-8 max-w-lg">
                  Brug vores volumenberegner til at finde ud af praecis hvor mange bigbags du skal bestille. Indtast maal og faa et praecist estimat med det samme.
                </p>
                <Link
                  href="/volumenberegner"
                  className="group inline-flex items-center gap-2.5 bg-white text-[16px] font-semibold px-8 py-4 rounded-lg hover:bg-gray-50 transition-all duration-300 shadow-lg"
                  style={{ color: 'var(--grus-green)' }}
                >
                  Proev beregneren <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </div>
            </Reveal>
            <Reveal delay={150}>
              <div className="hidden lg:flex items-center justify-center">
                <div className="w-64 h-64 rounded-full bg-white/10 flex items-center justify-center">
                  <div className="w-48 h-48 rounded-full bg-white/10 flex items-center justify-center">
                    <Calculator className="w-20 h-20 text-white/60" />
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══ SECTION 6: HVORFOR VAELGE OS ═══ */}
      <section className="py-16 lg:py-24">
        <div className="max-w-[1260px] mx-auto px-5 sm:px-6">
          <Reveal>
            <div className="text-center mb-14">
              <h2 className="text-[32px] lg:text-[42px] font-bold text-[#1a1a2e] mb-3">Hvorfor vaelge os</h2>
              <p className="text-gray-500 text-[17px] max-w-lg mx-auto">Vi goer det nemt at faa de materialer du har brug for</p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: 'Kvalitetsmaterialer',
                description: 'Alle vores materialer er noeje udvalgt og leveres i praktiske bigbags, klar til brug.',
              },
              {
                icon: MapPin,
                title: 'Levering til hele DK',
                description: 'Vi leverer frit til alle faste danske oeer. Bestil i dag og faa levering inden for faa dage.',
              },
              {
                icon: Phone,
                title: 'Personlig service',
                description: 'Ring til os for raadgivning om materialevalg og maengder. Vi hjaelper dig gerne.',
              },
            ].map((feature, i) => (
              <Reveal key={feature.title} delay={i * 100}>
                <Card className="text-center p-8 border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div
                    className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                    style={{ backgroundColor: 'var(--grus-green-light)' }}
                  >
                    <feature.icon className="w-7 h-7" style={{ color: 'var(--grus-green)' }} />
                  </div>
                  <h3 className="text-[20px] font-bold text-[#1a1a2e] mb-3">{feature.title}</h3>
                  <p className="text-gray-500 text-[15px] leading-relaxed">{feature.description}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SECTION 7: CTA ═══ */}
      <section className="py-16 lg:py-24 bg-[#1a1a2e] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        <div className="max-w-[1260px] mx-auto px-5 sm:px-6 text-center relative z-10">
          <Reveal>
            <h2 className="text-[34px] lg:text-[48px] font-bold text-white mb-5 leading-tight">
              Klar til at bestille?
            </h2>
            <p className="text-white/50 text-[17px] max-w-md mx-auto mb-10 leading-relaxed">
              Udforsk vores sortiment og bestil materialer med fri levering til hele Danmark
            </p>
            <Link
              href="/shop"
              className="group inline-flex items-center gap-2.5 text-white text-[16px] font-semibold px-10 py-4.5 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
              style={{ backgroundColor: 'var(--grus-green)' }}
            >
              Se vores produkter <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </Reveal>
        </div>
      </section>

      <Footer />
    </div>
  );
}
