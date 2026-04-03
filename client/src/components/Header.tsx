import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'wouter';
import { useCart } from '@/contexts/CartContext';
import { useQuery } from '@tanstack/react-query';
import CartDrawer from './CartDrawer';

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
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartPulse, setCartPulse] = useState(false);
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

  // Update CSS var for header height
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

  // Scroll detection
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [location]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // Focus mobile search when menu opens
  useEffect(() => {
    if (mobileOpen && mobileSearchRef.current) {
      setTimeout(() => mobileSearchRef.current?.focus(), 300);
    }
  }, [mobileOpen]);

  // Cart pulse animation
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

  const isActiveCategory = (slug: string) => location === `/shop/${slug}`;

  return (
    <div ref={wrapperRef} className="fixed top-0 left-0 right-0 z-50">
      {/* ── Top info bar (desktop only) ── */}
      <div
        className="hidden lg:block"
        style={{ backgroundColor: 'var(--grus-dark)' }}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-9">
          <div className="flex items-center gap-5">
            <a
              href="tel:+4572494444"
              className="flex items-center gap-1.5 text-white/80 hover:text-white text-xs transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              Ring: 72 49 44 44
            </a>
            <a
              href="mailto:Info@kaervangmaterialer.dk"
              className="flex items-center gap-1.5 text-white/80 hover:text-white text-xs transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              Info@kaervangmaterialer.dk
            </a>
          </div>
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5 text-white/80 text-xs">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              Fri levering i hele Danmark
            </span>
            <span className="flex items-center gap-1 text-white/80 text-xs">
              <span className="text-yellow-400">&#9733;</span>
              Trustpilot 4.8
            </span>
          </div>
        </div>
      </div>

      {/* ── Main header ── */}
      <header
        className={`bg-white transition-shadow duration-200 ${
          scrolled ? 'shadow-md' : ''
        }`}
        style={{ borderBottom: '1px solid var(--grus-border)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[60px] lg:h-[70px]">
          <div className="flex items-center justify-between h-full gap-4">

            {/* Mobile: hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -ml-2 text-[var(--grus-dark)] hover:text-[var(--grus-green)] transition-colors"
              aria-label="Åbn menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 shrink-0"
            >
              {/* Leaf icon */}
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none" className="hidden sm:block">
                <path
                  d="M8 28c0 0 2-12 12-18 0 0-6 8-4 18"
                  stroke="var(--grus-green)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="var(--grus-green-light)"
                />
                <path
                  d="M12 28c2-6 5-10 8-12"
                  stroke="var(--grus-green)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  opacity="0.6"
                />
              </svg>
              <div className="font-display leading-none">
                <span className="text-xl lg:text-[22px] font-bold" style={{ color: 'var(--grus-green)' }}>
                  Gruslevering
                </span>
                <span className="text-xl lg:text-[22px] font-bold text-[var(--grus-dark)]">.dk</span>
              </div>
            </Link>

            {/* Desktop: search bar */}
            <form
              onSubmit={handleSearch}
              className="hidden lg:flex flex-1 max-w-xl mx-8"
            >
              <div className="relative w-full">
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Søg efter produkter..."
                  className="w-full h-10 pl-4 pr-10 rounded-lg bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--grus-green)] focus:ring-2 focus:ring-[var(--grus-green)]/20 transition-all"
                  style={{ borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--grus-border)' }}
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-[var(--grus-stone)] transition-colors"
                  aria-label="Søg"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </button>
              </div>
            </form>

            {/* Right: actions */}
            <div className="flex items-center gap-1 sm:gap-3">
              {/* Mobile search toggle */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="lg:hidden p-2 text-[var(--grus-dark)] hover:text-[var(--grus-green)] transition-colors"
                aria-label="Søg"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>

              {/* Desktop: account link */}
              <Link
                href="/kontakt"
                className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-[var(--grus-dark)] hover:text-[var(--grus-green)] text-sm transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className="text-xs font-medium">Kontakt</span>
              </Link>

              {/* Cart button */}
              <button
                onClick={() => setIsOpen(true)}
                className="relative p-2 text-[var(--grus-dark)] hover:text-[var(--grus-green)] transition-colors"
                aria-label="Kurv"
              >
                <svg
                  width="22" height="22" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                  className={`transition-transform duration-200 ${cartPulse ? 'scale-110' : 'scale-100'}`}
                >
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                {totalItems > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-[11px] font-bold text-white"
                    style={{ backgroundColor: 'var(--grus-green)' }}
                  >
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile search dropdown */}
        {searchOpen && (
          <div className="lg:hidden border-t border-gray-100 px-4 py-3 bg-white">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Søg efter produkter..."
                autoFocus
                className="w-full h-10 pl-4 pr-10 rounded-lg border border-[var(--grus-border)] bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--grus-green)] focus:ring-2 focus:ring-[var(--grus-green)]/20 transition-all"
              />
              <button
                type="submit"
                className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full text-gray-500"
                aria-label="Søg"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
            </form>
          </div>
        )}
      </header>

      {/* ── Green category navigation bar ── */}
      <nav
        className="w-full overflow-x-auto"
        style={{ backgroundColor: 'var(--grus-green)' }}
      >
        <style>{`
          .cat-nav-scroll::-webkit-scrollbar { display: none; }
          .cat-nav-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="cat-nav-scroll flex items-center gap-0.5 overflow-x-auto py-0">
            <Link
              href="/shop"
              className={`shrink-0 px-3.5 py-2.5 text-sm font-medium text-white rounded transition-colors whitespace-nowrap ${
                location === '/shop' ? 'bg-white/25 font-semibold' : 'hover:bg-white/15'
              }`}
            >
              Alle produkter
            </Link>
            {parentCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/shop/${cat.slug}`}
                className={`shrink-0 px-3.5 py-2.5 text-sm font-medium text-white rounded transition-colors whitespace-nowrap ${
                  isActiveCategory(cat.slug) ? 'bg-white/25 font-semibold' : 'hover:bg-white/15'
                }`}
              >
                {cat.name}
              </Link>
            ))}
            <span className="shrink-0 w-px h-5 bg-white/20 mx-1" />
            <Link
              href="/volumenberegner"
              className={`shrink-0 px-3.5 py-2.5 text-sm font-medium text-white rounded transition-colors whitespace-nowrap ${
                location === '/volumenberegner' ? 'bg-white/25 font-semibold' : 'hover:bg-white/15'
              }`}
            >
              Volumenberegner
            </Link>
            <Link
              href="/levering"
              className={`shrink-0 px-3.5 py-2.5 text-sm font-medium text-white rounded transition-colors whitespace-nowrap ${
                location === '/levering' ? 'bg-white/25 font-semibold' : 'hover:bg-white/15'
              }`}
            >
              Levering
            </Link>
            <Link
              href="/om-os"
              className={`shrink-0 px-3.5 py-2.5 text-sm font-medium text-white rounded transition-colors whitespace-nowrap ${
                location === '/om-os' ? 'bg-white/25 font-semibold' : 'hover:bg-white/15'
              }`}
            >
              Om os
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Mobile slide-in menu ── */}
      {/* Backdrop */}
      <div
        className={`lg:hidden fixed inset-0 bg-black/40 z-[60] transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Drawer */}
      <div
        className={`lg:hidden fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white z-[70] transform transition-transform duration-300 ease-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between h-[60px] px-5 border-b border-gray-100">
          <Link href="/" onClick={() => setMobileOpen(false)} className="font-display">
            <span className="text-lg font-bold" style={{ color: 'var(--grus-green)' }}>Gruslevering</span>
            <span className="text-lg font-bold text-[var(--grus-dark)]">.dk</span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Luk menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Mobile search */}
        <div className="px-5 py-3 border-b border-gray-100">
          <form onSubmit={(e) => { handleSearch(e); setMobileOpen(false); }}>
            <div className="relative">
              <input
                ref={mobileSearchRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Søg efter produkter..."
                className="w-full h-10 pl-4 pr-10 rounded-lg border border-[var(--grus-border)] bg-gray-50 text-sm placeholder:text-gray-400 focus:outline-none focus:border-[var(--grus-green)] transition-colors"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                aria-label="Søg"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
            </div>
          </form>
        </div>

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto py-2">
          {/* Categories section */}
          <div className="px-2">
            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Kategorier
            </div>
            <Link
              href="/shop"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location === '/shop'
                  ? 'text-[var(--grus-green)] bg-[var(--grus-green-light)]'
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
                    ? 'text-[var(--grus-green)] bg-[var(--grus-green-light)] font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{cat.name}</span>
                <span className="text-xs text-gray-400">{cat.count}</span>
              </Link>
            ))}
          </div>

          {/* Divider */}
          <div className="my-2 mx-5 h-px bg-gray-100" />

          {/* Other links */}
          <div className="px-2">
            <Link
              href="/volumenberegner"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location === '/volumenberegner'
                  ? 'text-[var(--grus-green)] bg-[var(--grus-green-light)]'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="2" width="16" height="20" rx="2" />
                <line x1="8" y1="6" x2="16" y2="6" />
                <line x1="8" y1="10" x2="10" y2="10" />
                <line x1="14" y1="10" x2="16" y2="10" />
                <line x1="8" y1="14" x2="10" y2="14" />
                <line x1="14" y1="14" x2="16" y2="14" />
                <line x1="8" y1="18" x2="16" y2="18" />
              </svg>
              Volumenberegner
            </Link>
            <Link
              href="/levering"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location === '/levering'
                  ? 'text-[var(--grus-green)] bg-[var(--grus-green-light)]'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
              Levering
            </Link>
            <Link
              href="/om-os"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location === '/om-os'
                  ? 'text-[var(--grus-green)] bg-[var(--grus-green-light)]'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              Om os
            </Link>
            <Link
              href="/kontakt"
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location === '/kontakt'
                  ? 'text-[var(--grus-green)] bg-[var(--grus-green-light)]'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              Kontakt
            </Link>
          </div>
        </div>

        {/* Contact info at bottom */}
        <div className="border-t border-gray-100 px-5 py-4">
          <a
            href="tel:+4572494444"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            +45 72 49 44 44
          </a>
          <a
            href="mailto:Info@kaervangmaterialer.dk"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors mt-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            Info@kaervangmaterialer.dk
          </a>
          <p className="text-xs text-gray-400 mt-2">
            Tylstrupvej 1, 9382 Tylstrup
          </p>
        </div>
      </div>

      <CartDrawer />
    </div>
  );
}
