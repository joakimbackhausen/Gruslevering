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

const NAV_LINKS = [
  { label: 'Produkter', href: '/shop', hasDropdown: true },
  { label: 'Levering', href: '/levering' },
  { label: 'Beregner', href: '/volumenberegner' },
  { label: 'Om os', href: '/om-os' },
  { label: 'Kontakt', href: '/kontakt' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [announcementVisible, setAnnouncementVisible] = useState(true);
  const [cartPulse, setCartPulse] = useState(false);
  const [location] = useLocation();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
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
  }, [updateCSSVar, announcementVisible]);

  // Scroll detection
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // Cart pulse animation when items change
  useEffect(() => {
    if (totalItems > prevTotalItems.current) {
      setCartPulse(true);
      const t = setTimeout(() => setCartPulse(false), 300);
      return () => clearTimeout(t);
    }
    prevTotalItems.current = totalItems;
  }, [totalItems]);

  const handleDropdownEnter = () => {
    clearTimeout(dropdownTimeout.current);
    setDropdownOpen(true);
  };

  const handleDropdownLeave = () => {
    dropdownTimeout.current = setTimeout(() => setDropdownOpen(false), 180);
  };

  const isActive = (href: string) => {
    if (href === '/shop') return location.startsWith('/shop');
    return location === href;
  };

  return (
    <div ref={wrapperRef} className="fixed top-0 left-0 right-0 z-50">
      {/* Announcement bar */}
      {announcementVisible && (
        <div
          className="relative flex items-center justify-center h-7"
          style={{ backgroundColor: 'var(--grus-dark)' }}
        >
          <p
            className="font-sans text-[10px] uppercase tracking-[0.2em] text-center"
            style={{ color: 'var(--grus-sand)' }}
          >
            Fri levering i hele Danmark
          </p>
          <button
            onClick={() => setAnnouncementVisible(false)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
            aria-label="Luk"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="1" y1="1" x2="9" y2="9" />
              <line x1="9" y1="1" x2="1" y2="9" />
            </svg>
          </button>
        </div>
      )}

      {/* Main header */}
      <header
        className={`transition-all duration-300 ${
          scrolled ? 'glass shadow-[0_1px_12px_rgba(0,0,0,0.06)]' : 'bg-transparent'
        }`}
        style={{ height: 'var(--header-main-h, 72px)' }}
      >
        <style>{`
          :root { --header-main-h: 72px; }
          @media (max-width: 1023px) { :root { --header-main-h: 60px; } }
        `}</style>

        <div className="max-w-[1260px] mx-auto px-5 sm:px-6 xl:px-10 h-full">
          <div className="flex items-center justify-between h-full">

            {/* Left: hamburger (mobile) */}
            <div className="lg:hidden flex items-center">
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-1.5 -ml-1.5 transition-colors"
                style={{ color: 'var(--grus-dark)' }}
                aria-label="Menu"
              >
                {mobileOpen ? (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <line x1="4" y1="4" x2="18" y2="18" />
                    <line x1="18" y1="4" x2="4" y2="18" />
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <line x1="3" y1="6" x2="19" y2="6" />
                    <line x1="3" y1="11" x2="19" y2="11" />
                    <line x1="3" y1="16" x2="15" y2="16" />
                  </svg>
                )}
              </button>
            </div>

            {/* Logo */}
            <Link
              href="/"
              className="flex flex-col items-start leading-none shrink-0 lg:mr-12 absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0"
            >
              <span
                className="font-display text-[20px] sm:text-[22px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: 'var(--grus-dark)' }}
              >
                GRUSLEVERING
              </span>
              <span
                className="font-display text-[10px] uppercase tracking-[0.25em] -mt-0.5"
                style={{ color: 'var(--grus-accent)' }}
              >
                .DK
              </span>
            </Link>

            {/* Desktop navigation */}
            <nav className="hidden lg:flex items-center h-full flex-1 justify-center gap-1">
              {NAV_LINKS.map((link) => (
                <div
                  key={link.href}
                  className="relative h-full flex items-center"
                  onMouseEnter={() => link.hasDropdown ? handleDropdownEnter() : setDropdownOpen(false)}
                  onMouseLeave={link.hasDropdown ? handleDropdownLeave : undefined}
                >
                  <Link
                    href={link.href}
                    className="group relative h-full flex items-center px-4 font-display text-[13px] uppercase tracking-[0.12em] font-medium transition-opacity"
                    style={{
                      color: 'var(--grus-dark)',
                      opacity: isActive(link.href) ? 1 : 0.65,
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                    onMouseLeave={(e) => {
                      if (!isActive(link.href)) (e.currentTarget as HTMLElement).style.opacity = '0.65';
                    }}
                  >
                    {link.label}
                    {link.hasDropdown && (
                      <svg
                        width="8" height="5" viewBox="0 0 8 5" fill="none" stroke="currentColor"
                        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                        className="ml-1.5 opacity-50"
                      >
                        <polyline points="1,1 4,4 7,1" />
                      </svg>
                    )}
                    {/* Active / hover underline */}
                    <span
                      className="absolute bottom-5 left-4 right-4 h-[1.5px] origin-left transition-transform duration-300"
                      style={{
                        backgroundColor: 'var(--grus-dark)',
                        transform: isActive(link.href) ? 'scaleX(1)' : 'scaleX(0)',
                      }}
                    />
                    {/* Hover underline via CSS (we use a second span for the hover effect) */}
                    {!isActive(link.href) && (
                      <span
                        className="absolute bottom-5 left-4 right-4 h-[1.5px] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
                        style={{ backgroundColor: 'var(--grus-dark)' }}
                      />
                    )}
                  </Link>

                  {/* Products dropdown */}
                  {link.hasDropdown && dropdownOpen && (
                    <div
                      className="absolute top-full left-0 pt-2"
                      onMouseEnter={handleDropdownEnter}
                      onMouseLeave={handleDropdownLeave}
                    >
                      <div
                        className="bg-white/95 backdrop-blur-xl border border-black/[0.06] shadow-[0_12px_40px_rgba(0,0,0,0.1)] min-w-[240px]"
                        style={{ borderTop: '2px solid var(--grus-dark)' }}
                      >
                        <div className="py-2">
                          <Link
                            href="/shop"
                            className="block px-5 py-2.5 font-display text-[12px] uppercase tracking-[0.1em] font-semibold transition-colors"
                            style={{ color: 'var(--grus-dark)' }}
                            onClick={() => setDropdownOpen(false)}
                          >
                            Alle produkter
                          </Link>
                          <div
                            className="mx-5 h-px my-1"
                            style={{ backgroundColor: 'var(--grus-sand)' }}
                          />
                          {parentCategories.map((cat) => (
                            <Link
                              key={cat.id}
                              href={`/shop/${cat.slug}`}
                              className="group/item flex items-center justify-between px-5 py-2 font-sans text-[13px] transition-all hover:pl-6"
                              style={{ color: 'var(--grus-dark)' }}
                              onClick={() => setDropdownOpen(false)}
                            >
                              <span className="opacity-70 group-hover/item:opacity-100 transition-opacity">
                                {cat.name}
                              </span>
                              <span
                                className="text-[11px] opacity-30 font-display"
                              >
                                {cat.count}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-5">
              {/* Phone - desktop only */}
              <a
                href="tel:+4572494444"
                className="hidden lg:flex items-center gap-1.5 font-sans text-[12px] tracking-wide transition-opacity opacity-50 hover:opacity-100"
                style={{ color: 'var(--grus-dark)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                72 49 44 44
              </a>

              {/* Cart */}
              <button
                className="relative p-1 transition-colors"
                style={{ color: 'var(--grus-dark)' }}
                onClick={() => setIsOpen(true)}
                aria-label="Kurv"
              >
                <svg
                  width="21" height="21" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                  className={`transition-transform duration-300 ${cartPulse ? 'scale-110' : 'scale-100'}`}
                >
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                {totalItems > 0 && (
                  <span
                    className="absolute -top-0.5 -right-1 font-display text-[10px] font-semibold leading-none"
                    style={{ color: 'var(--grus-accent)' }}
                  >
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile full-screen overlay */}
      <div
        className={`lg:hidden fixed inset-0 z-[60] transition-all duration-500 ${
          mobileOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        style={{ backgroundColor: 'var(--grus-dark)' }}
      >
        {/* Close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-5 right-5 p-2 text-white/50 hover:text-white transition-colors z-10"
          aria-label="Luk menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="4" y1="4" x2="20" y2="20" />
            <line x1="20" y1="4" x2="4" y2="20" />
          </svg>
        </button>

        {/* Mobile nav links */}
        <nav className="flex flex-col justify-center h-full px-10">
          {NAV_LINKS.map((link, i) => (
            <div key={link.href}>
              <Link
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block py-3 transition-all duration-500"
                style={{
                  transform: mobileOpen ? 'translateY(0)' : 'translateY(20px)',
                  opacity: mobileOpen ? 1 : 0,
                  transitionDelay: mobileOpen ? `${100 + i * 60}ms` : '0ms',
                }}
              >
                <span
                  className="font-display text-[32px] sm:text-[38px] font-semibold uppercase tracking-[0.06em] transition-colors"
                  style={{
                    color: isActive(link.href) ? 'var(--grus-accent)' : 'var(--grus-sand)',
                  }}
                >
                  {link.label}
                </span>
              </Link>

              {/* Category sub-links under Produkter */}
              {link.hasDropdown && parentCategories.length > 0 && (
                <div className="ml-1 mb-2">
                  {parentCategories.slice(0, 6).map((cat, ci) => (
                    <Link
                      key={cat.id}
                      href={`/shop/${cat.slug}`}
                      onClick={() => setMobileOpen(false)}
                      className="block py-1.5 transition-all duration-500"
                      style={{
                        transform: mobileOpen ? 'translateY(0)' : 'translateY(12px)',
                        opacity: mobileOpen ? 0.5 : 0,
                        transitionDelay: mobileOpen ? `${160 + i * 60 + ci * 40}ms` : '0ms',
                      }}
                    >
                      <span className="font-sans text-[14px] tracking-wide text-white/50 hover:text-white transition-colors">
                        {cat.name}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Phone at bottom of mobile menu */}
          <div
            className="mt-10 pt-6 transition-all duration-500"
            style={{
              borderTop: '1px solid rgba(255,255,255,0.1)',
              transform: mobileOpen ? 'translateY(0)' : 'translateY(20px)',
              opacity: mobileOpen ? 0.4 : 0,
              transitionDelay: mobileOpen ? '450ms' : '0ms',
            }}
          >
            <a
              href="tel:+4572494444"
              className="font-sans text-[13px] tracking-wider text-white/50 hover:text-white transition-colors"
            >
              +45 72 49 44 44
            </a>
          </div>
        </nav>
      </div>

      <CartDrawer />
    </div>
  );
}
