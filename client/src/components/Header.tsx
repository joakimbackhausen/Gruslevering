import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react';
import { Link, useLocation } from 'wouter';
import { useCart } from '@/contexts/CartContext';
import { useQuery } from '@tanstack/react-query';

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

interface Category {
  id: number;
  slug: string;
  name: string;
  image: string;
  count: number;
  url: string;
  parentId: number | null;
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

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    queryFn: () => fetch('/api/categories').then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  const parentCategories = categories.filter((c) => c.parentId === null && c.count > 0);

  // Build children lookup for dropdown menus
  const childrenByParentId = useMemo(() => {
    const map: Record<number, Category[]> = {};
    for (const c of categories) {
      if (c.parentId !== null) {
        if (!map[c.parentId]) map[c.parentId] = [];
        map[c.parentId].push(c);
      }
    }
    return map;
  }, [categories]);

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

  const isActiveCategory = (slug: string) => location === `/shop/${slug}` || location.startsWith(`/shop/${slug}/`);
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

          {/* ═══ Category navigation row with dropdowns (matches gruslevering.dk menu) ═══ */}
          {!scrolled && (
          <div className="hidden lg:flex items-center justify-center gap-0 pb-2">
            {(() => {
              // Only show the main menu categories from gruslevering.dk, in exact order
              const menuSlugs = [
                'granitskaerver-sten-pyntesten',
                'sand-grus',
                'stobematerialer',
                'muldjord',
                'traeflis',
                'stroelse',
                'braendsel',
                'hus-og-have',
              ];
              return menuSlugs
                .map(slug => parentCategories.find(c => c.slug === slug))
                .filter((c): c is Category => c !== undefined);
            })().map((cat) => {
              const children = childrenByParentId[cat.id] || [];
              const hasChildren = children.length > 0;

              return (
                <div key={cat.id} className="relative group">
                  <Link
                    href={`/shop/${cat.slug}`}
                    className={`flex items-center gap-1 px-3 py-1.5 text-[14px] font-medium rounded-md transition-colors ${
                      isActiveCategory(cat.slug)
                        ? 'text-[var(--grus-green)] bg-green-50'
                        : 'text-gray-700 hover:text-[var(--grus-green)] hover:bg-gray-50'
                    }`}
                  >
                    {cat.name}
                    {hasChildren && (
                      <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-[var(--grus-green)] transition-transform group-hover:rotate-180" />
                    )}
                  </Link>
                  {/* Dropdown */}
                  {hasChildren && (
                    <div className="absolute top-full left-0 pt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                      <div className="bg-white rounded-lg shadow-lg border border-gray-200 py-1.5 min-w-[200px]">
                        <Link
                          href={`/shop/${cat.slug}`}
                          className="block px-4 py-2 text-sm text-gray-700 hover:text-[var(--grus-green)] hover:bg-green-50 transition-colors font-medium"
                        >
                          Alle {cat.name.toLowerCase()}
                        </Link>
                        <div className="h-px bg-gray-100 mx-3 my-1" />
                        {children.map((child) => (
                          <Link
                            key={child.id}
                            href={`/shop/${cat.slug}/${child.slug}`}
                            className="block px-4 py-2 text-sm text-gray-600 hover:text-[var(--grus-green)] hover:bg-green-50 transition-colors"
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
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
        <div className="flex-1 overflow-y-auto py-2">
          <div className="px-2">
            <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Kategorier
            </div>
            <Link
              href="/shop"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActiveRoute('/shop')
                  ? 'text-[var(--grus-green)] bg-green-50'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Alle produkter
            </Link>
            {parentCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/shop/${cat.slug}`}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActiveCategory(cat.slug)
                    ? 'text-[var(--grus-green)] bg-green-50 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{cat.name}</span>
                <span className="text-xs text-gray-400">{cat.count}</span>
              </Link>
            ))}
          </div>

          <div className="my-2 mx-5 h-px bg-gray-100" />

          <div className="px-2">
            {[
              { href: '/volumenberegner', label: 'Volumenberegner' },
              { href: '/levering', label: 'Levering' },
              { href: '/om-os', label: 'Om os' },
              { href: '/kontakt', label: 'Kontakt' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
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
