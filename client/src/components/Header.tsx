import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { Link, useLocation } from 'wouter';
import { useCart } from '@/contexts/CartContext';

const CartDrawer = lazy(() => import('./CartDrawer'));
import {
  Search,
  Menu,
  X,
  ShoppingCart,
  Phone,
  Mail,
  Truck,
  CheckCircle,
  ChevronDown,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Menu structure — matches the curated WordPress nav on gruslevering.dk */
/* ------------------------------------------------------------------ */

interface MenuChild {
  label: string;
  href: string;
}

interface MenuColumn {
  label: string;
  href: string;
  children?: MenuChild[];
}

interface MenuItem {
  label: string;
  href: string;
  columns?: MenuColumn[];
}

const MAIN_MENU: MenuItem[] = [
  {
    label: 'Granitskærver & sten',
    href: '/shop/granitskaerver-sten-pyntesten',
    columns: [
      {
        label: 'Granitskærver',
        href: '/shop/granitskaerver-sten-pyntesten/granitskaerver',
        children: [
          { label: 'Sorte Granitskærver', href: '/shop/granitskaerver-sten-pyntesten/sorte-granitskaerver' },
          { label: 'Grå Granitskærver', href: '/shop/granitskaerver-sten-pyntesten/gra-granitskaerver' },
          { label: 'Røde Granitskærver', href: '/shop/granitskaerver-sten-pyntesten/rode-granitskaerver' },
          { label: 'Ukrudtsduge', href: '/shop/hus-og-have/ukrudtsduge' },
        ],
      },
      {
        label: 'Stenmel',
        href: '/shop/granitskaerver-sten-pyntesten/stenmel',
        children: [
          { label: 'Grå stenmel', href: '/shop/granitskaerver-sten-pyntesten/graa-stenmel-belaegning' },
          { label: 'Sort stenmel', href: '/shop/granitskaerver-sten-pyntesten/sort-stenmel-belaegning' },
        ],
      },
      {
        label: 'Pyntesten',
        href: '/shop/granitskaerver-sten-pyntesten/pyntesten-kategori',
        children: [
          { label: 'Nøddesten', href: '/shop/granitskaerver-sten-pyntesten/noeddesten-draensten' },
          { label: 'Perlesten', href: '/shop/granitskaerver-sten-pyntesten/perlesten-soe-sten' },
          { label: 'Pigsten', href: '/shop/granitskaerver-sten-pyntesten/pigsten-marksten' },
          { label: 'Pyntesten', href: '/shop/granitskaerver-sten-pyntesten/pyntesten' },
        ],
      },
    ],
  },
  {
    label: 'Sand & Grus',
    href: '/shop/sand-grus',
    columns: [
      { label: 'Grus', href: '/shop/sand-grus/grus' },
      { label: 'Sand', href: '/shop/sand-grus/sand' },
    ],
  },
  {
    label: 'Støbeprodukter',
    href: '/shop/stobematerialer',
    columns: [
      { label: 'Støbematerialer', href: '/shop/stobematerialer' },
      { label: 'Støbepakker', href: '/shop/stobematerialer/stobepakker' },
      { label: 'Cement', href: '/shop/hus-og-have/cement' },
    ],
  },
  {
    label: 'Muld',
    href: '/shop/muldjord',
    columns: [
      {
        label: 'Muld og jord',
        href: '/shop/muldjord/muld-muldjord',
        children: [
          { label: 'Harpet muld', href: '/shop/muldjord/harpet-muld' },
          { label: 'Højbedsmuld', href: '/shop/muldjord/hoejbedsmuld' },
          { label: 'Gartnermuld', href: '/shop/muldjord/gartnermuld-jord' },
          { label: 'Allétræs muld', href: '/shop/muldjord/alletraes-muld' },
          { label: 'Rhododendron jord', href: '/shop/muldjord/rhododendronjord' },
          { label: 'Hækjord', href: '/shop/muldjord/haekjord' },
          { label: 'Jordforbedring', href: '/shop/muldjord/jordforbedring' },
          { label: 'Kartoffelmuld', href: '/shop/muldjord/kartoffelmuld' },
          { label: 'Plantemuld', href: '/shop/muldjord/plantemuld' },
          { label: 'Kompost', href: '/shop/muldjord/kompost' },
          { label: 'Køkkenhavemuld', href: '/shop/muldjord/koekkenhavemuld' },
          { label: 'Hestegødning', href: '/shop/muldjord/varmebehandlet-hestegodning' },
          { label: 'Krydderurtemuld', href: '/shop/muldjord/krydderurtemuld' },
          { label: 'Økologisk muld', href: '/shop/muldjord/okologisk-muld' },
        ],
      },
      {
        label: 'Topdressing',
        href: '/shop/topdressing-graesfroe/topdressing',
        children: [
          { label: 'Plænepakker', href: '/shop/topdressing-graesfroe/plaenepakker' },
          { label: 'Topdressing leret jord', href: '/shop/topdressing-graesfroe/optimal-losning-til-tung-undergrund' },
          { label: 'Topdressing sandet jord', href: '/shop/topdressing-graesfroe/topdressing-sandet-jord' },
          { label: 'Topdressing vækst', href: '/shop/topdressing-graesfroe/topdressing-vaekst' },
        ],
      },
      {
        label: 'Spagnum',
        href: '/shop/muldjord/spagnum',
        children: [
          { label: 'Spagnum fra vildmosen', href: '/shop/muldjord/spagnum-fra-vildmosen' },
          { label: 'Spagnum ugødet', href: '/shop/muldjord/spagnum-ugoedet' },
          { label: 'Spagnum', href: '/shop/muldjord/gartner-spagnum' },
          { label: 'Gødet spagnum', href: '/shop/muldjord/godet-spagnum' },
          { label: 'Klyner', href: '/shop/muldjord/klyner' },
        ],
      },
    ],
  },
  {
    label: 'Bunddække',
    href: '/shop/traeflis',
    columns: [
      { label: 'Barkflis', href: '/shop/traeflis/barkflis-flis-daekbark' },
      { label: 'Kakaoflis', href: '/shop/traeflis/kakaoflis-til-haven' },
      { label: 'Flis', href: '/shop/traeflis/flis' },
      { label: 'Pinjebark', href: '/shop/traeflis/pinjebark-bunddaekke' },
    ],
  },
  {
    label: 'Strøelse',
    href: '/shop/stroelse',
    columns: [
      { label: 'Spåner', href: '/shop/stroelse/spaner' },
      { label: 'Tørv', href: '/shop/stroelse/toerv' },
      { label: 'Tørvemix', href: '/shop/stroelse/toervemix' },
      { label: 'Træpiller', href: '/shop/stroelse/traepiller-stroelse-braendsel' },
    ],
  },
  {
    label: 'Brændsel',
    href: '/shop/braendsel',
    columns: [
      { label: 'Træpiller', href: '/shop/braendsel/traepiller-braendsel' },
      { label: 'Ask', href: '/shop/braendsel/ask-braende-braendsel' },
      { label: 'Birkebrænde', href: '/shop/braendsel/birkebraende' },
      { label: 'Bøg', href: '/shop/braendsel/bog' },
      { label: 'Briketter', href: '/shop/braendsel/briketter' },
      { label: 'Eg', href: '/shop/braendsel/eg' },
      { label: 'Elmetræ', href: '/shop/braendsel/elmetrae' },
    ],
  },
  {
    label: 'Hus og have',
    href: '/shop/hus-og-have',
    columns: [
      {
        label: 'Fugle i haven',
        href: '/shop/hus-og-have/fugle-i-haven',
        children: [
          { label: 'Foderautomater', href: '/shop/hus-og-have/foderautomater' },
          { label: 'Fuglepakker', href: '/shop/hus-og-have/fuglepakker' },
          { label: 'Fuglehuse og fuglebade', href: '/shop/hus-og-have/fuglehuse-og-fuglebade' },
          { label: 'Fuglefoder', href: '/shop/hus-og-have/fuglefoder' },
        ],
      },
      {
        label: 'Gødning & græsfrø',
        href: '/shop/hus-og-have/godning-graesfroe',
        children: [
          { label: 'Plante- og grøntsagsgødning', href: '/shop/hus-og-have/plante-og-grontsagsgodning' },
          { label: 'Blomsterfrø', href: '/shop/hus-og-have/blomsterfroe' },
          { label: 'Græsfrø', href: '/shop/hus-og-have/graesfroe' },
          { label: 'Græskanter', href: '/shop/hus-og-have/graeskanter' },
          { label: 'Græsplæne kalk', href: '/shop/hus-og-have/graesplaene-kalk' },
          { label: 'Plænegødning', href: '/shop/hus-og-have/plaenegodning' },
        ],
      },
      {
        label: 'Diverse til haven',
        href: '/shop/hus-og-have/diverse-til-haven',
        children: [
          { label: 'Sandkasser', href: '/shop/hus-og-have/sandkasser' },
          { label: 'Sandkassepakker', href: '/shop/sandkassepakker' },
          { label: 'Tilbehør til sandkasser', href: '/shop/hus-og-have/tilbehor-til-sandkasser' },
          { label: 'Ukrudtsduge', href: '/shop/hus-og-have/ukrudtsduge' },
          { label: 'Højbede og plantekasser', href: '/shop/hus-og-have/hoejbede-og-plantekasser' },
          { label: 'Hegn', href: '/shop/hus-og-have/hegn' },
          { label: 'Borde og Bænke', href: '/shop/hus-og-have/borde-og-baenke' },
          { label: 'Handsker', href: '/shop/hus-og-have/handsker' },
          { label: 'Vandslanger og vandposer', href: '/shop/hus-og-have/vandslanger-og-vandposer' },
          { label: 'Bålfade & pejse', href: '/shop/hus-og-have/baalfade-pejse' },
          { label: 'Vækst & drivhuse', href: '/shop/hus-og-have/vaekst-drivhuse' },
          { label: 'Vandspil og fontæner', href: '/shop/hus-og-have/vandspil-og-fontaener' },
        ],
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Mobile Navigation (accordion-style)                                */
/* ------------------------------------------------------------------ */

function MobileNav({
  location,
  isActiveRoute,
  onClose,
}: {
  location: string;
  isActiveRoute: (path: string) => boolean;
  onClose: () => void;
}) {
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  return (
    <div className="flex-1 overflow-y-auto py-2">
      <div className="px-2">
        <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Kategorier
        </div>
        <Link
          href="/shop"
          onClick={onClose}
          className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            isActiveRoute('/shop')
              ? 'text-[var(--grus-green)] bg-green-50'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          Alle produkter
        </Link>
        {MAIN_MENU.map((item) => {
          const hasColumns = item.columns && item.columns.length > 0;
          const isExpanded = expandedMenu === item.label;
          const isActive = location.startsWith(item.href);

          return (
            <div key={item.label}>
              <div className="flex items-center">
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`flex-1 flex items-center px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'text-[var(--grus-green)] bg-green-50 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </Link>
                {hasColumns && (
                  <button
                    onClick={() => setExpandedMenu(isExpanded ? null : item.label)}
                    className="p-2 rounded-lg text-gray-400 hover:text-[var(--grus-green)] hover:bg-gray-100 transition-colors"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
              {hasColumns && isExpanded && (
                <div className="ml-4 border-l-2 border-gray-100 pl-2 mb-1">
                  {item.columns!.map((col) => (
                    <div key={col.label}>
                      <Link
                        href={col.href}
                        onClick={onClose}
                        className="flex items-center px-3 py-2 text-[13px] font-semibold text-gray-700 hover:text-[var(--grus-green)] transition-colors"
                      >
                        {col.label}
                      </Link>
                      {col.children && col.children.length > 0 && (
                        <div className="ml-3">
                          {col.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={onClose}
                              className="block px-3 py-1.5 text-[12px] text-gray-500 hover:text-[var(--grus-green)] transition-colors"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="my-2 mx-5 h-px bg-gray-100" />

      <div className="px-2">
        {[
          { href: '/volumenberegner', label: 'Mængdeberegner' },
          { href: '/levering', label: 'Levering' },
          { href: '/om-os', label: 'Om os' },
          { href: '/kontakt', label: 'Kontakt' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActiveRoute(item.href)
                ? 'text-[var(--grus-green)] bg-green-50'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartPulse, setCartPulse] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location, navigate] = useLocation();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const { totalItems, setIsOpen } = useCart();
  const prevTotalItems = useRef(totalItems);

  const updateCSSVar = useCallback(() => {
    const h = wrapperRef.current?.getBoundingClientRect().height || 0;
    document.documentElement.style.setProperty('--header-h', `${Math.round(h)}px`);
  }, []);

  useEffect(() => {
    updateCSSVar();
    window.addEventListener('resize', updateCSSVar);
    if (document.fonts?.ready) document.fonts.ready.then(updateCSSVar);
    return () => window.removeEventListener('resize', updateCSSVar);
  }, [updateCSSVar]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [location]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (mobileOpen && mobileSearchRef.current) {
      setTimeout(() => mobileSearchRef.current?.focus(), 300);
    }
  }, [mobileOpen]);

  useEffect(() => {
    if (totalItems > prevTotalItems.current) {
      setCartPulse(true);
      const t = setTimeout(() => setCartPulse(false), 300);
      return () => clearTimeout(t);
    }
    prevTotalItems.current = totalItems;
  }, [totalItems]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  const isActiveRoute = (path: string) => location === path;

  return (
    <div ref={wrapperRef} className="fixed top-0 left-0 right-0 z-50">
      {/* ═══ Row 0: Dark GREEN USP bar (Plantorama-style) ═══ */}
      <div
        className="hidden lg:block text-white"
        style={{ backgroundColor: '#2B5B2B' }}
      >
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center justify-between h-9">
            <div className="flex items-center gap-8 text-[12px] tracking-wide">
              {[
                'FRI LEVERING',
                'HURTIG LEVERING',
                'SIKKER BETALING',
                'DANSK VIRKSOMHED',
              ].map((usp) => (
                <span key={usp} className="flex items-center gap-1.5 text-white/90">
                  <CheckCircle className="w-3.5 h-3.5 text-green-300" />
                  {usp}
                </span>
              ))}
            </div>
            <a
              href="tel:+4572494444"
              className="text-[12px] text-white/80 hover:text-white transition-colors"
            >
              Erhvervskunde? Ring 72 49 44 44
            </a>
          </div>
        </div>
      </div>

      {/* ═══ Row 1: Main header (white, tall like Plantorama) ═══ */}
      <header
        className={`transition-all duration-300 bg-white ${
          scrolled ? 'shadow-md' : ''
        } ${location.startsWith('/shop') || location.startsWith('/produkt') ? 'border-b border-gray-200' : ''}`}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-[56px] lg:h-[90px] gap-4 lg:gap-6">

            {/* MOBILE: hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -ml-2 text-[var(--grus-dark)]"
              aria-label="Åbn menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* LEFT: Logo + brand text */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <img
                src="/images/gruslevering-logo.png"
                alt="Gruslevering.dk"
                className="h-10 lg:h-[52px] w-auto"
              />
              <div className="hidden sm:flex flex-col leading-tight text-gray-900">
                <span className="text-[17px] lg:text-[20px] font-bold tracking-tight">Gruslevering.dk</span>
                <span className="text-[10px] lg:text-[11px] font-medium tracking-wide text-[var(--grus-green)]">Alt til hus & have</span>
              </div>
            </Link>

            {/* CENTER: HUGE search bar (Plantorama-style) */}
            <form
              onSubmit={handleSearch}
              className="hidden lg:flex flex-1 max-w-2xl mx-6"
            >
              <div className="relative w-full flex">
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Søg"
                  className="w-full h-12 pl-5 pr-14 rounded-full text-[15px] bg-white text-gray-900 placeholder:text-gray-400 border-2 border-gray-200 focus:border-[var(--grus-green)] focus:outline-none transition-colors"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1 bottom-1 flex items-center justify-center w-10 h-10 text-gray-500 hover:text-[var(--grus-green)] transition-colors"
                  aria-label="Søg"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </form>

            {/* RIGHT: Icon buttons with labels (Plantorama-style) */}
            <div className="flex items-center gap-1 lg:gap-4">
              {/* Phone - desktop only */}
              <a
                href="tel:+4572494444"
                className="hidden xl:flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors text-gray-600 hover:text-[var(--grus-green)] hover:bg-gray-50"
              >
                <Phone className="w-5 h-5" />
                <span className="text-[11px] font-medium">Kontakt</span>
              </a>

              {/* Levering - desktop only */}
              <Link
                href="/levering"
                className="hidden xl:flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors text-gray-600 hover:text-[var(--grus-green)] hover:bg-gray-50"
              >
                <Truck className="w-5 h-5" />
                <span className="text-[11px] font-medium">Levering</span>
              </Link>

              {/* Mobile search toggle */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="lg:hidden p-2.5 text-gray-600 rounded-lg"
                aria-label="Søg"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Cart button (Plantorama-style: icon + label stacked) */}
              <button
                onClick={() => setIsOpen(true)}
                className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors text-gray-600 hover:text-[var(--grus-green)] hover:bg-gray-50"
                aria-label="Kurv"
              >
                <div className="relative">
                  <ShoppingCart
                    className={`w-[22px] h-[22px] transition-transform duration-200 ${
                      cartPulse ? 'scale-110' : 'scale-100'
                    }`}
                  />
                  {totalItems > 0 && (
                    <span
                      className="absolute -top-2 -right-2.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-[var(--grus-green)] text-white"
                    >
                      {totalItems}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-medium hidden lg:block">Kurv</span>
              </button>
            </div>
          </div>

          {/* ═══ Category navigation row with dropdowns (matches gruslevering.dk WP menu) ═══ */}
          {!scrolled && (
          <div className="hidden lg:flex items-center justify-center gap-0 pb-2">
            {MAIN_MENU.map((item) => {
              const hasColumns = item.columns && item.columns.length > 0;
              // Check if any column has children (= multi-column mega menu)
              const isMegaMenu = item.columns?.some((col) => col.children && col.children.length > 0);

              return (
                <div key={item.label} className="relative group">
                  <Link
                    href={item.href}
                    className={`flex items-center gap-1 px-3 py-1.5 text-[14px] font-medium rounded-md transition-colors ${
                      location.startsWith(item.href)
                        ? 'text-[var(--grus-green)] bg-green-50'
                        : 'text-gray-700 hover:text-[var(--grus-green)] hover:bg-gray-50'
                    }`}
                  >
                    {item.label}
                    {hasColumns && (
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-[var(--grus-green)] transition-transform group-hover:rotate-180" />
                    )}
                  </Link>

                  {/* Dropdown */}
                  {hasColumns && (
                    <div className="absolute top-full left-0 pt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                      {isMegaMenu ? (
                        /* Multi-column mega menu */
                        <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-5 flex gap-8 min-w-max">
                          {item.columns!.map((col) => (
                            <div key={col.label} className="min-w-[180px]">
                              <Link
                                href={col.href}
                                className="block text-[13px] font-bold text-gray-900 hover:text-[var(--grus-green)] transition-colors uppercase tracking-wide mb-2"
                              >
                                {col.label}
                              </Link>
                              {col.children && (
                                <ul className="space-y-0.5">
                                  {col.children.map((child) => (
                                    <li key={child.href}>
                                      <Link
                                        href={child.href}
                                        className="block py-1 text-sm text-gray-600 hover:text-[var(--grus-green)] transition-colors"
                                      >
                                        {child.label}
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* Simple single-column dropdown */
                        <div className="bg-white rounded-lg shadow-lg border border-gray-200 py-1.5 min-w-[200px]">
                          {item.columns!.map((col) => (
                            <Link
                              key={col.href}
                              href={col.href}
                              className="block px-4 py-2 text-sm text-gray-600 hover:text-[var(--grus-green)] hover:bg-green-50 transition-colors"
                            >
                              {col.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            <Link
              href="/volumenberegner"
              className={`px-3 py-1.5 text-[14px] font-medium rounded-md transition-colors ${
                isActiveRoute('/volumenberegner')
                  ? 'text-[var(--grus-green)] bg-green-50'
                  : 'text-gray-700 hover:text-[var(--grus-green)] hover:bg-gray-50'
              }`}
            >
              Mængdeberegner
            </Link>
          </div>
          )}
        </div>

        {/* Mobile search dropdown */}
        {searchOpen && (
          <div className="lg:hidden border-t px-4 py-3 bg-white border-gray-100">
            <form onSubmit={handleSearch} className="flex">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Søg efter produkter..."
                autoFocus
                className="flex-1 h-10 pl-4 pr-4 rounded-l-full border-2 border-r-0 border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--grus-green)] transition-colors"
              />
              <button
                type="submit"
                className="flex items-center justify-center w-11 h-10 bg-[var(--grus-green)] text-white rounded-r-full"
                aria-label="Søg"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Mobile slide-in menu - Backdrop */}
      <div
        className={`lg:hidden fixed inset-0 bg-black/40 z-[60] transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile drawer */}
      <div
        className={`lg:hidden fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white z-[70] transform transition-transform duration-300 ease-out flex flex-col ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer header - Green like Plantorama sticky */}
        <div className="flex items-center justify-between h-[56px] px-5" style={{ backgroundColor: '#2B5B2B' }}>
          <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2">
            <img
              src="/images/gruslevering-logo.png"
              alt="Gruslevering.dk"
              className="h-9 w-auto brightness-0 invert"
            />
            <span className="text-white font-bold text-[15px] tracking-tight">Gruslevering.dk</span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 -mr-2 text-white/70 hover:text-white transition-colors"
            aria-label="Luk menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile search */}
        <div className="px-5 py-3 border-b border-gray-100">
          <form onSubmit={(e) => { handleSearch(e); setMobileOpen(false); }} className="flex">
            <input
              ref={mobileSearchRef}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Søg efter produkter..."
              className="flex-1 h-10 pl-4 pr-4 rounded-l-full border-2 border-r-0 border-gray-200 bg-gray-50 text-sm placeholder:text-gray-400 focus:outline-none focus:border-[var(--grus-green)] transition-colors"
            />
            <button
              type="submit"
              className="flex items-center justify-center w-10 h-10 bg-[var(--grus-green)] text-white rounded-r-full"
              aria-label="Søg"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Navigation links */}
        <MobileNav location={location} isActiveRoute={isActiveRoute} onClose={() => setMobileOpen(false)} />

        {/* Contact info at bottom */}
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
          <a
            href="tel:+4572494444"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Phone className="w-4 h-4 text-[var(--grus-green)]" />
            +45 72 49 44 44
          </a>
          <a
            href="mailto:Info@kaervangmaterialer.dk"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors mt-2"
          >
            <Mail className="w-4 h-4 text-[var(--grus-green)]" />
            Info@kaervangmaterialer.dk
          </a>
          <p className="text-[11px] text-gray-400 mt-3">
            Tylstrupvej 1, 9382 Tylstrup
          </p>
        </div>
      </div>

      <Suspense fallback={null}>
        <CartDrawer />
      </Suspense>
    </div>
  );
}
