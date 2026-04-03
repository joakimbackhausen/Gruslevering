import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Search, X, ChevronDown, ChevronRight, PackageSearch } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import type { Product, Category } from '@/types/product';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    minimumFractionDigits: 0,
  }).format(price);

type SortOption = 'popular' | 'price-asc' | 'price-desc' | 'name';

const sortLabels: Record<SortOption, string> = {
  popular: 'Populaere',
  'price-asc': 'Pris (laveste)',
  'price-desc': 'Pris (hojeste)',
  name: 'Navn A-Z',
};

function SkeletonCard() {
  return (
    <div className="space-y-4">
      <div className="aspect-[4/5] rounded-xl skeleton-shimmer" />
      <div className="space-y-2">
        <div className="h-3 w-16 rounded skeleton-shimmer" />
        <div className="h-4 w-3/4 rounded skeleton-shimmer" />
        <div className="h-4 w-1/3 rounded skeleton-shimmer" />
      </div>
    </div>
  );
}

export default function Shop() {
  const params = useParams<{ kategori?: string }>();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [showSortDrop, setShowSortDrop] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedCategory = params.kategori || null;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close sort dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSortDrop(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Focus search input when expanded
  useEffect(() => {
    if (searchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchExpanded]);

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
    queryFn: async () => {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to fetch products');
      return res.json();
    },
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
  });

  const filtered = useMemo(() => {
    let result = products;

    if (selectedCategory) {
      result = result.filter((p) => p.categorySlug === selectedCategory);
    }

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q),
      );
    }

    switch (sortBy) {
      case 'price-asc':
        result = [...result].sort(
          (a, b) => (a.salePrice ?? a.basePrice) - (b.salePrice ?? b.basePrice),
        );
        break;
      case 'price-desc':
        result = [...result].sort(
          (a, b) => (b.salePrice ?? b.basePrice) - (a.salePrice ?? a.basePrice),
        );
        break;
      case 'name':
        result = [...result].sort((a, b) => a.title.localeCompare(b.title, 'da'));
        break;
      default:
        break;
    }

    return result;
  }, [products, selectedCategory, debouncedSearch, sortBy]);

  const selectedCatObj = categories.find((c) => c.slug === selectedCategory);

  const clearFilters = useCallback(() => {
    navigate('/shop');
    setSearchQuery('');
    setDebouncedSearch('');
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--grus-bg)' }}>
      <Header />

      <main className="flex-1" style={{ paddingTop: 'var(--header-h, 124px)' }}>
        {/* Header area */}
        <div className="max-w-[1280px] mx-auto px-5 sm:px-6 pt-10 pb-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-stone-400 mb-6">
            <Link href="/" className="hover:text-stone-700 transition-colors">
              Forside
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link
              href="/shop"
              className={`transition-colors ${
                selectedCategory ? 'hover:text-stone-700' : 'text-stone-700'
              }`}
            >
              Shop
            </Link>
            {selectedCatObj && (
              <>
                <ChevronRight className="w-3 h-3" />
                <span className="text-stone-700">{selectedCatObj.name}</span>
              </>
            )}
          </nav>

          {/* Heading */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--grus-text)] leading-[1.05]">
            {selectedCatObj ? selectedCatObj.name : 'Alle produkter'}
          </h1>
          {selectedCatObj?.description && (
            <p className="mt-4 text-base text-stone-500 max-w-xl leading-relaxed">
              {selectedCatObj.description}
            </p>
          )}
        </div>

        {/* Filter / sort bar */}
        <div className="max-w-[1280px] mx-auto px-5 sm:px-6 pb-8">
          <div className="flex items-center gap-3">
            {/* Category pills - horizontal scroll */}
            <div className="flex-1 min-w-0 overflow-x-auto scrollbar-hide">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/shop')}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium border transition-all duration-300 ${
                    !selectedCategory
                      ? 'bg-[var(--grus-dark)] text-white border-transparent'
                      : 'bg-transparent text-stone-500 border-stone-200 hover:border-stone-400 hover:text-stone-700'
                  }`}
                >
                  Alle
                </button>
                {categories.map((c) => (
                  <button
                    key={c.slug}
                    onClick={() => navigate(`/shop/${c.slug}`)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium border transition-all duration-300 ${
                      selectedCategory === c.slug
                        ? 'bg-[var(--grus-dark)] text-white border-transparent'
                        : 'bg-transparent text-stone-500 border-stone-200 hover:border-stone-400 hover:text-stone-700'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Search icon / expanded input */}
            <div className="flex-shrink-0 relative">
              {searchExpanded ? (
                <div className="flex items-center gap-2">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Sog..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={() => {
                      if (!searchQuery) setSearchExpanded(false);
                    }}
                    className="w-48 sm:w-64 text-sm border border-stone-200 rounded-full px-4 py-2 bg-white focus:border-stone-400 focus:ring-0 focus:outline-none transition-all"
                  />
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchExpanded(false);
                    }}
                    className="p-2 text-stone-400 hover:text-stone-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSearchExpanded(true)}
                  className="p-2.5 rounded-full border border-stone-200 text-stone-400 hover:text-stone-600 hover:border-stone-400 transition-all duration-300"
                >
                  <Search className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort dropdown */}
            <div ref={sortRef} className="relative flex-shrink-0">
              <button
                onClick={() => setShowSortDrop(!showSortDrop)}
                className="flex items-center gap-2 text-xs font-medium text-stone-500 border border-stone-200 rounded-full px-4 py-2.5 hover:border-stone-400 hover:text-stone-700 transition-all duration-300"
              >
                <span className="hidden sm:inline text-stone-300 mr-1">Sorter</span>
                {sortLabels[sortBy]}
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    showSortDrop ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {showSortDrop && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-stone-100 z-50 overflow-hidden">
                  {(Object.entries(sortLabels) as [SortOption, string][]).map(
                    ([key, label]) => (
                      <button
                        key={key}
                        onClick={() => {
                          setSortBy(key);
                          setShowSortDrop(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                          sortBy === key
                            ? 'bg-stone-50 font-medium text-stone-900'
                            : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700'
                        }`}
                      >
                        {label}
                      </button>
                    ),
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product grid */}
        <div className="max-w-[1280px] mx-auto px-5 sm:px-6 pb-20">
          {productsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-10">
              {Array.from({ length: 9 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-28 text-center">
              <PackageSearch className="w-10 h-10 text-stone-300 mb-5" />
              <h3 className="font-display text-lg font-medium text-stone-600 mb-2">
                Ingen produkter fundet
              </h3>
              <p className="text-sm text-stone-400 mb-6 max-w-xs">
                Prov at justere dine filtre eller sog efter noget andet.
              </p>
              <button
                onClick={clearFilters}
                className="text-sm font-medium text-stone-500 underline underline-offset-4 hover:text-stone-800 transition-colors"
              >
                Ryd filtre
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-10">
              {filtered.map((product) => {
                const productUrl = `/produkt/${product.slug || product.id}`;
                const hasVariants = product.variants && product.variants.length > 0;
                const effectivePrice = product.salePrice ?? product.basePrice;

                return (
                  <Link
                    key={product.id}
                    href={productUrl}
                    className="group block"
                  >
                    {/* Image */}
                    <div
                      className="aspect-[4/5] rounded-xl overflow-hidden mb-4"
                      style={{ backgroundColor: 'var(--grus-warm)' }}
                    >
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.title}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-300 text-sm">
                          Ingen billede
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div>
                      <span className="text-[11px] uppercase tracking-[0.15em] text-stone-400">
                        {product.category}
                      </span>
                      <h3 className="font-display text-base font-medium text-[var(--grus-text)] mt-1 leading-snug line-clamp-2">
                        {product.title}
                      </h3>
                      <div className="mt-1.5 flex items-baseline gap-2">
                        {product.salePrice ? (
                          <>
                            <span className="text-sm text-stone-400 line-through">
                              {formatPrice(product.basePrice)}
                            </span>
                            <span
                              className="text-sm font-medium"
                              style={{ color: 'var(--grus-accent)' }}
                            >
                              {formatPrice(product.salePrice)}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm font-medium text-[var(--grus-text)]">
                            {hasVariants ? 'Fra ' : ''}
                            {formatPrice(effectivePrice)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
