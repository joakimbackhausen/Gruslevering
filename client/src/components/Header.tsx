import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'wouter';
import { Menu, X, Search, ShoppingBag, Phone, Mail, Truck, ChevronDown } from 'lucide-react';
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
  { label: 'Produkter', href: '/shop', hasMega: true },
  { label: 'Levering', href: '/levering', hasMega: false },
  { label: 'Om os', href: '/om-os', hasMega: false },
  { label: 'Kontakt', href: '/kontakt', hasMega: false },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const megaTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const { totalItems, setIsOpen } = useCart();

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    queryFn: () => fetch('/api/categories').then((r) => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  const parentCategories = categories.filter((c) => c.parentId === null && c.count > 0);
  const getChildren = (parentId: number) =>
    categories.filter((c) => c.parentId === parentId && c.count > 0).sort((a, b) => b.count - a.count);

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
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setMegaOpen(false);
  }, [location]);

  const handleMegaEnter = () => {
    clearTimeout(megaTimeout.current);
    setMegaOpen(true);
  };

  const handleMegaLeave = () => {
    megaTimeout.current = setTimeout(() => setMegaOpen(false), 150);
  };

  const isActive = (href: string) => {
    if (href === '/shop') return location.startsWith('/shop');
    return location === href;
  };

  return (
    <div ref={wrapperRef} className="fixed top-0 left-0 right-0 z-50">
      {/* Top info bar - hidden on mobile */}
      <div className="hidden lg:block" style={{ backgroundColor: 'var(--grus-dark)' }}>
        <div className="max-w-[1260px] mx-auto px-5 sm:px-6 xl:px-10 h-10 flex items-center justify-between text-[13px]">
          <div className="flex items-center gap-6 text-gray-300">
            <a
              href="tel:+4572494444"
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              +45 72 49 44 44
            </a>
            <span className="text-gray-600">|</span>
            <a
              href="mailto:Info@kaervangmaterialer.dk"
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              Info@kaervangmaterialer.dk
            </a>
          </div>
          <div className="flex items-center gap-1.5 text-gray-300">
            <Truck className="w-3.5 h-3.5" />
            Fri levering i hele Danmark
          </div>
        </div>
      </div>

      {/* Main header */}
      <header
        className={`bg-white/95 backdrop-blur-md h-[72px] transition-shadow duration-300 ${
          scrolled ? 'shadow-[0_2px_20px_rgba(0,0,0,0.08)]' : 'border-b border-gray-100'
        }`}
      >
        <div className="max-w-[1260px] mx-auto px-5 sm:px-6 xl:px-10 h-full">
          <div className="flex items-center justify-between h-full">
            {/* Mobile hamburger - left */}
            <button
              className="lg:hidden text-[#1a1a2e] p-1 -ml-1"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center shrink-0 lg:mr-10">
              <span className="text-[26px] font-extrabold tracking-tight leading-none">
                <span style={{ color: 'var(--grus-green)' }}>Grus</span>
                <span className="text-[#1a1a2e]">levering</span>
                <span className="text-[15px] font-semibold text-gray-400">.dk</span>
              </span>
            </Link>

            {/* Desktop nav - center */}
            <nav className="hidden lg:flex items-center h-full flex-1 justify-center">
              {NAV_LINKS.map((link) => (
                <div
                  key={link.href}
                  className="relative h-full flex items-center"
                  onMouseEnter={() => link.hasMega ? handleMegaEnter() : setMegaOpen(false)}
                  onMouseLeave={link.hasMega ? handleMegaLeave : undefined}
                >
                  <Link
                    href={link.href}
                    className={`h-full flex items-center gap-1 px-5 text-[15px] font-medium transition-colors border-b-2 ${
                      isActive(link.href)
                        ? 'text-[var(--grus-green)] border-[var(--grus-green)]'
                        : 'text-[#333] hover:text-[var(--grus-green)] border-transparent'
                    }`}
                  >
                    {link.label}
                    {link.hasMega && <ChevronDown className="w-3.5 h-3.5 opacity-50" />}
                  </Link>

                  {/* Mega dropdown for Produkter */}
                  {link.hasMega && megaOpen && (
                    <div
                      className="absolute top-full left-1/2 -translate-x-1/2 pt-0"
                      onMouseEnter={handleMegaEnter}
                      onMouseLeave={handleMegaLeave}
                    >
                      <div className="bg-white shadow-[0_20px_60px_rgba(0,0,0,0.12)] border-t-2 border-[var(--grus-green)] rounded-b-lg min-w-[600px]">
                        <div className="p-6">
                          <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                            {parentCategories.map((cat) => {
                              const children = getChildren(cat.id);
                              return (
                                <div key={cat.id} className="mb-4">
                                  <Link
                                    href={`/shop/${cat.slug}`}
                                    className="text-[14px] font-semibold text-[#1a1a2e] hover:text-[var(--grus-green)] transition-colors"
                                    onClick={() => setMegaOpen(false)}
                                  >
                                    {cat.name}
                                  </Link>
                                  {children.length > 0 && (
                                    <div className="mt-1.5 space-y-0.5">
                                      {children.slice(0, 5).map((child) => (
                                        <Link
                                          key={child.id}
                                          href={`/shop/${child.slug}`}
                                          className="block text-[13px] text-gray-500 hover:text-[var(--grus-green)] transition-colors py-0.5"
                                          onClick={() => setMegaOpen(false)}
                                        >
                                          {child.name}
                                          <span className="text-[11px] text-gray-300 ml-1">({child.count})</span>
                                        </Link>
                                      ))}
                                      {children.length > 5 && (
                                        <Link
                                          href={`/shop/${cat.slug}`}
                                          className="block text-[12px] font-medium text-[var(--grus-green)] hover:underline py-0.5"
                                          onClick={() => setMegaOpen(false)}
                                        >
                                          Se alle {cat.count} produkter →
                                        </Link>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <div className="border-t border-gray-100 px-6 py-3">
                          <Link
                            href="/shop"
                            className="text-[13px] font-semibold hover:underline transition-colors"
                            style={{ color: 'var(--grus-green)' }}
                            onClick={() => setMegaOpen(false)}
                          >
                            Se hele sortimentet →
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Right icons */}
            <div className="flex items-center gap-4">
              <button
                className="text-gray-400 hover:text-[var(--grus-green)] transition-colors hidden sm:block"
                aria-label="Soeg"
              >
                <Search className="w-[22px] h-[22px]" />
              </button>
              <button
                className="relative text-gray-400 hover:text-[var(--grus-green)] transition-colors"
                onClick={() => setIsOpen(true)}
                aria-label="Kurv"
              >
                <ShoppingBag className="w-[22px] h-[22px]" />
                {totalItems > 0 && (
                  <span
                    className="absolute -top-1.5 -right-2 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full"
                    style={{ backgroundColor: 'var(--grus-green)' }}
                  >
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile slide-out drawer */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 top-[72px] z-40">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => setMobileOpen(false)}
            />
            {/* Drawer */}
            <div className="relative w-[300px] max-w-[85vw] h-full bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-left duration-200">
              <nav className="py-4">
                {NAV_LINKS.map((link) => {
                  if (link.hasMega) {
                    return (
                      <div key={link.href}>
                        <Link
                          href={link.href}
                          className="block px-6 py-3.5 text-[16px] font-semibold text-[#1a1a2e] hover:text-[var(--grus-green)] transition-colors"
                          onClick={() => setMobileOpen(false)}
                        >
                          {link.label}
                        </Link>
                        <div className="bg-gray-50/70">
                          {parentCategories.map((cat) => (
                            <Link
                              key={cat.id}
                              href={`/shop/${cat.slug}`}
                              className="block pl-10 pr-6 py-2.5 text-[14px] text-gray-600 hover:text-[var(--grus-green)] transition-colors"
                              onClick={() => setMobileOpen(false)}
                            >
                              {cat.name}
                              <span className="text-[12px] text-gray-300 ml-1">({cat.count})</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block px-6 py-3.5 text-[16px] font-semibold text-[#1a1a2e] hover:text-[var(--grus-green)] transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              {/* Mobile contact info */}
              <div className="px-6 pb-6 pt-4 border-t border-gray-100 space-y-3 text-[14px] text-gray-500">
                <a href="tel:+4572494444" className="flex items-center gap-2 hover:text-[var(--grus-green)]">
                  <Phone className="w-4 h-4" /> +45 72 49 44 44
                </a>
                <a href="mailto:Info@kaervangmaterialer.dk" className="flex items-center gap-2 hover:text-[var(--grus-green)]">
                  <Mail className="w-4 h-4" /> Info@kaervangmaterialer.dk
                </a>
                <div className="flex items-center gap-2 text-gray-400 pt-1">
                  <Truck className="w-4 h-4" /> Fri levering i hele Danmark
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      <CartDrawer />
    </div>
  );
}
