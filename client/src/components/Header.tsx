import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'wouter';
import { useCart } from '@/contexts/CartContext';
import { useQuery } from '@tanstack/react-query';
import CartDrawer from './CartDrawer';
import {
  Search,
  Menu,
  X,
  ShoppingCart,
  Phone,
  User,
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
  const isActiveRoute = (path: string) => location === path;

  return (
    <div ref={wrapperRef} className="fixed top-0 left-0 right-0 z-50">
      {/* Row 1: Main header */}
      <header
        className={`bg-white transition-shadow duration-200 ${
          scrolled ? 'shadow-md' : ''
        }`}
        style={{ borderBottom: '1px solid var(--grus-border)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[60px] lg:h-[68px] gap-4">

            {/* MOBILE: hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -ml-2 text-[var(--grus-dark)] hover:text-[var(--grus-green)] transition-colors"
              aria-label="Abn menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* LEFT: Logo */}
            <Link href="/" className="flex items-center gap-1.5 shrink-0">
              {/* Leaf icon */}
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none" className="hidden sm:block">
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
              <span className="font-display text-xl font-bold text-[var(--grus-green)]">
                Gruslevering
              </span>
              <span className="font-display text-xl font-bold text-[var(--grus-dark)]">
                .dk
              </span>
            </Link>

            {/* CENTER: Wide search bar (desktop) */}
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
                  placeholder="Søg efter produkter..."
                  className="w-full h-11 pl-4 pr-4 rounded-l-lg border border-r-0 border-[var(--grus-border)] text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--grus-green)] focus:ring-1 focus:ring-[var(--grus-green)] transition-all"
                />
                <button
                  type="submit"
                  className="flex items-center justify-center w-12 h-11 bg-[var(--grus-green)] hover:bg-[var(--grus-green-hover)] text-white rounded-r-lg transition-colors shrink-0"
                  aria-label="Søg"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </form>

            {/* RIGHT: Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Phone (desktop only) */}
              <a
                href="tel:+4572494444"
                className="hidden xl:flex items-center gap-1.5 text-sm text-[var(--grus-dark)] hover:text-[var(--grus-green)] transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span className="font-medium">72 49 44 44</span>
              </a>

              {/* Kontakt (desktop only) */}
              <Link
                href="/kontakt"
                className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-sm text-[var(--grus-dark)] hover:text-[var(--grus-green)] transition-colors"
              >
                <User className="w-4.5 h-4.5" />
                <span className="text-xs font-medium">Kontakt</span>
              </Link>

              {/* Mobile search toggle */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="lg:hidden p-2 text-[var(--grus-dark)] hover:text-[var(--grus-green)] transition-colors"
                aria-label="Søg"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Cart button */}
              <button
                onClick={() => setIsOpen(true)}
                className="relative p-2 text-[var(--grus-dark)] hover:text-[var(--grus-green)] transition-colors"
                aria-label="Kurv"
              >
                <ShoppingCart
                  className={`w-[22px] h-[22px] transition-transform duration-200 ${
                    cartPulse ? 'scale-110' : 'scale-100'
                  }`}
                />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full text-[11px] font-bold text-white bg-[var(--grus-green)]">
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
            <form onSubmit={handleSearch} className="flex">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Søg efter produkter..."
                autoFocus
                className="flex-1 h-10 pl-4 pr-4 rounded-l-lg border border-r-0 border-[var(--grus-border)] bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[var(--grus-green)] transition-all"
              />
              <button
                type="submit"
                className="flex items-center justify-center w-11 h-10 bg-[var(--grus-green)] text-white rounded-r-lg"
                aria-label="Søg"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Row 2: Green category navigation bar */}
      <nav className="w-full" style={{ backgroundColor: 'var(--grus-green)' }}>
        <style>{`
          .cat-nav-scroll::-webkit-scrollbar { display: none; }
          .cat-nav-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="cat-nav-scroll flex items-center overflow-x-auto">
            <Link
              href="/shop"
              className={`shrink-0 px-4 py-2.5 text-sm font-medium text-white rounded transition-colors whitespace-nowrap ${
                isActiveRoute('/shop') ? 'bg-white/20 font-semibold' : 'hover:bg-white/15'
              }`}
            >
              Alle produkter
            </Link>
            {parentCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/shop/${cat.slug}`}
                className={`shrink-0 px-4 py-2.5 text-sm font-medium text-white rounded transition-colors whitespace-nowrap ${
                  isActiveCategory(cat.slug) ? 'bg-white/20 font-semibold' : 'hover:bg-white/15'
                }`}
              >
                {cat.name}
              </Link>
            ))}
            <span className="shrink-0 w-px h-5 bg-white/25 mx-1.5" />
            <Link
              href="/levering"
              className={`shrink-0 px-4 py-2.5 text-sm font-medium text-white rounded transition-colors whitespace-nowrap ${
                isActiveRoute('/levering') ? 'bg-white/20 font-semibold' : 'hover:bg-white/15'
              }`}
            >
              Levering
            </Link>
            <Link
              href="/volumenberegner"
              className={`shrink-0 px-4 py-2.5 text-sm font-medium text-white rounded transition-colors whitespace-nowrap ${
                isActiveRoute('/volumenberegner') ? 'bg-white/20 font-semibold' : 'hover:bg-white/15'
              }`}
            >
              Volumenberegner
            </Link>
            <Link
              href="/om-os"
              className={`shrink-0 px-4 py-2.5 text-sm font-medium text-white rounded transition-colors whitespace-nowrap ${
                isActiveRoute('/om-os') ? 'bg-white/20 font-semibold' : 'hover:bg-white/15'
              }`}
            >
              Om os
            </Link>
          </div>
        </div>
      </nav>

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
        {/* Drawer header */}
        <div className="flex items-center justify-between h-[60px] px-5 border-b border-gray-100">
          <Link href="/" onClick={() => setMobileOpen(false)} className="font-display">
            <span className="text-lg font-bold text-[var(--grus-green)]">Gruslevering</span>
            <span className="text-lg font-bold text-[var(--grus-dark)]">.dk</span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 transition-colors"
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
              className="flex-1 h-10 pl-4 pr-4 rounded-l-lg border border-r-0 border-[var(--grus-border)] bg-gray-50 text-sm placeholder:text-gray-400 focus:outline-none focus:border-[var(--grus-green)] transition-colors"
            />
            <button
              type="submit"
              className="flex items-center justify-center w-10 h-10 bg-[var(--grus-green)] text-white rounded-r-lg"
              aria-label="Søg"
            >
              <Search className="w-4 h-4" />
            </button>
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
                isActiveRoute('/shop')
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
                    ? 'text-[var(--grus-green)] bg-[var(--grus-green-light)]'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Contact info at bottom */}
        <div className="border-t border-gray-100 px-5 py-4">
          <a
            href="tel:+4572494444"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Phone className="w-4 h-4" />
            +45 72 49 44 44
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
