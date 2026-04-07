import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SmartImage from '@/components/SmartImage';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/types/product';

/* ------------------------------------------------------------------ */
/*  Reveal (fade-in on scroll)                                         */
/* ------------------------------------------------------------------ */

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
      ([e]) => { if (e.isIntersecting) setVisible(true); },
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

/* ------------------------------------------------------------------ */
/*  Category tiles (matching gruslevering.dk/nytestforside)             */
/* ------------------------------------------------------------------ */

const CATEGORY_TILES = [
  {
    label: 'Granitskærver',
    href: '/shop/granitskaerver-sten-pyntesten/granitskaerver',
    image: 'https://gruslevering.dk/wp-content/uploads/2019/11/Stort-udvalg-af-grus-sand-og-granitsk%C3%A6rver-2.png',
  },
  {
    label: 'Muld og jord',
    href: '/shop/muldjord',
    image: 'https://gruslevering.dk/wp-content/uploads/2026/02/ChatGPT-Image-26.-feb.-2026-22.48.35-1024x683.png',
  },
  {
    label: 'Plante kasser',
    href: '/shop/granitskaerver-sten-pyntesten/pyntesten-kategori',
    image: 'https://gruslevering.dk/wp-content/uploads/2019/11/Hvide-noeddesten-3264-768x1024.jpeg',
  },
  {
    label: 'Dækbark',
    href: '/shop/traeflis',
    image: 'https://gruslevering.dk/wp-content/uploads/2023/09/AA9AC17E-D91E-429A-8025-D01EBA655143-e1773662030197-773x1024.jpeg',
  },
  {
    label: 'Plantekasser',
    href: '/shop/hus-og-have/hoejbede-og-plantekasser',
    image: 'https://gruslevering.dk/wp-content/uploads/2022/07/44606_BM1.jpeg',
    wide: true,
  },
];

/* ------------------------------------------------------------------ */
/*  Bestseller product slugs                                            */
/* ------------------------------------------------------------------ */

const BESTSELLER_SLUGS = [
  'granitskaerver-sort-11-16-mm',
  'pyntesten-hvide-16-32-mm',
  'pinjebark',
  'stobemix-0-8mm-1000kg-125kg-cement',
  'topdressing-vaekst',
  'hojbedsmuld-hg',
  'harpet-muld-hg-100-organisk-jord',
  'stenmel-sort-0-2mm',
];

/* ------------------------------------------------------------------ */
/*  Haveguide articles                                                  */
/* ------------------------------------------------------------------ */

const HAVEGUIDE_ARTICLES = [
  {
    title: 'Komplet guide til muld og jord',
    desc: 'Vælg den rigtige jord til dit haveprojekt',
    href: 'https://gruslevering.dk/komplet-guide-til-muld-og-jord/',
    image: 'https://gruslevering.dk/wp-content/uploads/2026/02/ChatGPT-Image-17.-feb.-2026-18.44.55-e1771493007832.png',
  },
  {
    title: 'Sådan etablerer du en ny græsplæne',
    desc: 'Trin for trin – 100% korrekt',
    href: 'https://gruslevering.dk/saadan-etablerer-du-en-ny-graesplaene/',
    image: 'https://gruslevering.dk/wp-content/uploads/2026/02/ok-e1773057103439.png',
  },
  {
    title: 'Granitskærver – den komplette guide 2026',
    desc: 'Alt om valg, anvendelse og vedligeholdelse',
    href: 'https://gruslevering.dk/granitskaerver-guide/',
    image: 'https://gruslevering.dk/wp-content/uploads/2025/11/graa-granit-18-25mm.jpg',
  },
  {
    title: 'Flis: Guide til bunddækkematerialer',
    desc: 'Valg, anvendelse og pleje',
    href: 'https://gruslevering.dk/flis-pinjebark-bundaekke-daekbark-kakaoflis/',
    image: 'https://gruslevering.dk/wp-content/uploads/2025/10/Pinjebark-20-40-pose-e1770390187304.png',
  },
];

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

  // Pick bestseller products by slug
  const bestsellers = useMemo(() => {
    if (products.length === 0) return [];
    return BESTSELLER_SLUGS
      .map((slug) => products.find((p) => p.slug === slug))
      .filter((p): p is Product => p !== undefined);
  }, [products]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main style={{ paddingTop: 'var(--header-h, 164px)' }}>

        {/* ═══ HERO BANNER ═══ */}
        <section className="px-4 sm:px-6 lg:px-8 pt-2">
          <div className="max-w-[1400px] mx-auto">
            <div className="relative rounded-2xl overflow-hidden min-h-[280px] sm:min-h-[380px] lg:min-h-[480px] flex items-center">
              <img
                src="/api/img?url=https%3A%2F%2Fgruslevering.dk%2Fwp-content%2Fuploads%2F2026%2F03%2Fimage.jpg&w=600"
                srcSet="/api/img?url=https%3A%2F%2Fgruslevering.dk%2Fwp-content%2Fuploads%2F2026%2F03%2Fimage.jpg&w=400 400w, /api/img?url=https%3A%2F%2Fgruslevering.dk%2Fwp-content%2Fuploads%2F2026%2F03%2Fimage.jpg&w=600 600w, /api/img?url=https%3A%2F%2Fgruslevering.dk%2Fwp-content%2Fuploads%2F2026%2F03%2Fimage.jpg&w=1400 1400w"
                sizes="(max-width: 640px) 100vw, 1400px"
                alt="Grus, sten og jord leveret til døren"
                className="absolute inset-0 w-full h-full object-cover"
                fetchPriority="high"
                decoding="sync"
                width={1400}
                height={500}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />

              <div className="relative z-10 px-6 sm:px-10 lg:px-16 py-10 lg:py-16 max-w-2xl">
                <h1 className="font-display font-extrabold text-white text-[26px] sm:text-[36px] lg:text-[50px] leading-[1.1] mb-3 tracking-tight drop-shadow-lg">
                  Grus, sten & jord
                  <br />leveret direkte til d&oslash;ren
                </h1>
                <p className="text-white/80 text-sm sm:text-base lg:text-lg mb-6 max-w-md leading-relaxed drop-shadow">
                  Bigbags i h&oslash;j kvalitet &middot; Fri levering i hele<br className="hidden sm:block" /> Skarpe priser
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/shop"
                    className="inline-flex items-center gap-2 font-bold text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all text-[#2B5B2B] bg-[#f5c518]"
                  >
                    Se produkter
                  </Link>
                  <Link
                    href="/volumenberegner"
                    className="inline-flex items-center gap-2 font-bold text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all text-gray-900 bg-white/90 hover:bg-white"
                  >
                    Beregn m&aelig;ngde
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ CATEGORY TILES (matching gruslevering.dk/nytestforside exactly) ═══ */}
        <section className="px-4 sm:px-6 lg:px-8 mt-4">
          <div className="max-w-[1400px] mx-auto">
            {/* Top row: 4 tiles */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              {CATEGORY_TILES.filter((t) => !t.wide).map((tile, i) => (
                <Reveal key={tile.label} delay={i * 60}>
                  <Link
                    href={tile.href}
                    className="group relative aspect-[3/4] sm:aspect-[4/5] rounded-lg overflow-hidden block hover:shadow-lg transition-all duration-300"
                  >
                    <SmartImage
                      src={tile.image}
                      alt={tile.label}
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                      width={400}
                      sizes="(max-width: 640px) 45vw, 25vw"
                    />
                    <div className="absolute top-0 left-0 right-0 p-4 lg:p-5">
                      <p className="text-gray-900 font-extrabold text-base sm:text-lg lg:text-xl leading-tight uppercase tracking-wide"
                         style={{ textShadow: '0 1px 3px rgba(255,255,255,0.6)' }}>
                        {tile.label}
                      </p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
            {/* Bottom row: wide tile spanning 3 of 4 columns (centered) */}
            {CATEGORY_TILES.filter((t) => t.wide).map((tile) => (
              <Reveal key={tile.label} delay={250}>
                <div className="mt-3 lg:mt-4 lg:px-[12.5%]">
                  <Link
                    href={tile.href}
                    className="group relative rounded-lg overflow-hidden block hover:shadow-lg transition-all duration-300 aspect-[16/7] sm:aspect-[16/6]"
                  >
                    <SmartImage
                      src={tile.image}
                      alt={tile.label}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                      width={900}
                      sizes="(max-width: 640px) 95vw, 75vw"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-white font-extrabold text-xl sm:text-2xl lg:text-3xl uppercase tracking-wide drop-shadow-lg">
                        {tile.label}
                      </p>
                    </div>
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ═══ HVORFOR KUNDERNE VÆLGER OS (light green card like nytestforside) ═══ */}
        <section className="py-10 lg:py-14 px-4 sm:px-6 lg:px-8">
          <div className="max-w-[1400px] mx-auto">
            <Reveal>
              <div className="rounded-2xl py-10 px-6 sm:px-10 lg:px-14" style={{ backgroundColor: '#e8f0e4' }}>
                <h2 className="font-display font-bold text-gray-900 text-xl sm:text-2xl lg:text-[28px] text-center mb-8">
                  Hvorfor kunderne v&aelig;lger os
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-5 gap-x-8 max-w-4xl mx-auto">
                  {[
                    { icon: '🚚', text: 'Gratis levering i hele Danmark' },
                    { icon: '🇩🇰', text: 'Dansk familieejet siden 2008' },
                    { icon: '💰', text: 'Prisgaranti p\u00e5 mange produkter' },
                    { icon: '🔨', text: 'Kun kvalitetsmaterialer' },
                    { icon: '🚛', text: 'Express \u2013 Kran eller mobiltruck' },
                    { icon: '⭐', text: '4.8 \u2605 Trustpilot' },
                  ].map((usp) => (
                    <div key={usp.text} className="flex items-center gap-2.5">
                      <span className="text-lg shrink-0">{usp.icon}</span>
                      <span className="text-sm sm:text-[15px] text-gray-800">{usp.text}</span>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-gray-500 text-center mt-6">
                  * 98% af ordre bliver leveret indenfor 48 timer.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ═══ BESTSELLERE ═══ */}
        <section className="pb-12 lg:pb-16">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
              <h2 className="font-display font-bold text-gray-900 text-xl sm:text-2xl lg:text-[28px] mb-6">
                Bestsellere
              </h2>
            </Reveal>

            {loadingProducts ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
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
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {bestsellers.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                <div className="text-center mt-8">
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

        {/* ═══ MEST LÆSTE FRA DEN STORE HAVEGUIDE ═══ */}
        <section className="py-12 lg:py-16 bg-[#f7f7f5]">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
              <h2 className="font-display font-bold text-gray-900 text-xl sm:text-2xl lg:text-[28px] mb-8">
                Mest l&aelig;ste fra den store haveguide
              </h2>
            </Reveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
              {HAVEGUIDE_ARTICLES.map((article, i) => (
                <Reveal key={article.title} delay={i * 80}>
                  <a
                    href={article.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100"
                  >
                    <div className="aspect-[16/10] overflow-hidden">
                      <SmartImage
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500"
                        width={350}
                        sizes="(max-width: 640px) 95vw, (max-width: 1024px) 45vw, 25vw"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-[var(--grus-green)] transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{article.desc}</p>
                    </div>
                  </a>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ SEO TEXT SECTIONS ═══ */}
        <section className="py-12 lg:py-16">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl">
              <h2 className="font-display font-bold text-gray-900 text-xl sm:text-2xl mb-4">
                Gruslevering.dk &ndash; din leverand&oslash;r af billig grus, sand, granit og jord i bigbags
              </h2>
              <div className="prose prose-sm prose-gray max-w-none text-gray-600 leading-relaxed space-y-4">
                <p>
                  Gruslevering.dk er K&aelig;rvang Materialers online platform for levering af grus, sand, muld, granit, flis og pinjebark i bigbags og i poser, hvilket vil sige, at alt p&aring; siden er til direkte levering i bigbags med fragtmand, kranbil eller medbringer truck. K&aelig;rvang Materialer ApS har siden 2008 handlet med sand, grus, granitsk&aelig;rver, muld, flis, spagnum, st&oslash;beprodukter osv. S&oslash;ger du billig grus til din indk&oslash;rsel, haven eller n&aelig;ste byggeri, s&aring; hj&aelig;lper vi gerne &ndash; hos os handler du med folk som selv har arbejdet med produkterne til daglig. Du er velkommen til at bruge vores <Link href="/volumenberegner" className="text-[var(--grus-green)] hover:underline font-medium">m&aelig;ngdeberegner</Link>, der kan vejlede dig i k&oslash;bet. Vores store erfaring betyder, at vi kan vejlede dig til det rigtige produkt eller m&aelig;ngde, og derfor er du som kunde altid velkommen til at kontakte os p&aring; telefon alle hverdage kl. 8.00&ndash;16.00 eller p&aring; mail: <a href="mailto:info@kaervangmaterialer.dk" className="text-[var(--grus-green)] hover:underline font-medium">info@kaervangmaterialer.dk</a>.
                </p>
                <p>
                  For at g&oslash;re det s&aring; overskueligt som muligt er alle priser p&aring; bigbags her p&aring; siden inkl. gratis levering, s&aring; du slipper for u&oslash;nskede till&aelig;g, n&aring;r du kommer til betaling.
                </p>

                <h3 className="font-display font-bold text-gray-900 text-lg mt-8 mb-2">
                  Egen produktion af topdressing og muld
                </h3>
                <p>
                  Vores topdressing- og plantemuldsprodukter produceres af K&aelig;rvang Materialer og leveres over hele landet til private, anl&aelig;gsgartnere, entrepren&oslash;rer, kommuner m.m. At vi selv producerer og ops&aelig;kker de forskellige haveprodukter betyder, at vi springer flere mellemled over og derved kan tilbyde nogle af landets billigste priser p&aring; sand, grus, granitsk&aelig;rver, flis, muld, spagnum, topdressing m.m., direkte leveret i bigbags til dig som kunde.
                </p>

                <h3 className="font-display font-bold text-gray-900 text-lg mt-8 mb-2">
                  Direkte tiplevering af grus og granit
                </h3>
                <p>
                  Fra vores lagre i Nordjylland tilbyder vi direkte tiplevering af grus og granit. Vi r&aring;der over forskellige tipbiler og en kranbil, som laster lige fra 15 til 39 tons pr. l&aelig;s. Tiplevering henvender sig til de st&oslash;rre leverancer, og priser afh&aelig;nger af m&aelig;ngde og leveringssted. Kontakt os gerne for tilbud p&aring; dit projekt.
                </p>

                <h3 className="font-display font-bold text-gray-900 text-lg mt-8 mb-2">
                  Skovl selv / hent selv
                </h3>
                <p>
                  Bor du i n&aelig;rheden af Gruslevering.dk &ndash; K&aelig;rvang Materialer &ndash; som er beliggende i 9382 Tylstrup, 15 km nord for Aalborg, er du velkommen til selv at afhente grus, sand, jord, granitsk&aelig;rver, topdressing mm. Vi tilbyder gratis l&aelig;sning, eller du kan benytte vores skovl selv-koncept. Pladsen er bemandet:
                </p>
                <ul className="list-none space-y-1 pl-0">
                  <li><strong>Hverdage:</strong> kl. 8.00&ndash;16.00</li>
                  <li><strong>H&oslash;js&aelig;son</strong> (for&aring;r og sommer): l&oslash;rdag og s&oslash;ndag kl. 9.00&ndash;14.00</li>
                  <li><strong>Lavs&aelig;son</strong> (efter&aring;r og vinter): l&oslash;rdag kl. 9.00&ndash;14.00</li>
                </ul>
                <p>Afhentning uden for &aring;bningstid kan ske efter aftale p&aring; telefon.</p>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
