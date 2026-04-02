import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Search, X, ChevronDown, ChevronRight, SlidersHorizontal, ShoppingCart, PackageSearch, LayoutGrid, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/contexts/CartContext';
import type { Product, Category } from '@/types/product';

function formatPrice(price: number): string {
  return price.toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getDisplayPrice(product: Product): { label: string; original?: string; isSale: boolean } {
  if (product.salePrice) {
    return {
      label: formatPrice(product.salePrice),
      original: formatPrice(product.basePrice),
      isSale: true,
    };
  }
  if (product.variants && product.variants.length > 0) {
    return { label: `Fra ${formatPrice(product.basePrice)}`, isSale: false };
  }
  return { label: formatPrice(product.basePrice), isSale: false };
}

type SortOption = 'popular' | 'price-asc' | 'price-desc' | 'name';
type PriceRange = 'all' | 'under500' | '500-1000' | '1000-2000' | 'over2000';

const sortLabels: Record<SortOption, string> = {
  popular: 'Populære',
  'price-asc': 'Pris (laveste)',
  'price-desc': 'Pris (højeste)',
  name: 'Navn A-Z',
};

const priceRangeLabels: Record<PriceRange, string> = {
  all: 'Alle priser',
  under500: 'Under 500 kr',
  '500-1000': '500 - 1.000 kr',
  '1000-2000': '1.000 - 2.000 kr',
  over2000: 'Over 2.000 kr',
};

function matchesPriceRange(product: Product, range: PriceRange): boolean {
  const price = product.salePrice ?? product.basePrice;
  switch (range) {
    case 'under500': return price < 500;
    case '500-1000': return price >= 500 && price <= 1000;
    case '1000-2000': return price > 1000 && price <= 2000;
    case 'over2000': return price > 2000;
    default: return true;
  }
}

// Skeleton card for loading state
function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-100 animate-pulse">
      <div className="aspect-square bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
        <div className="h-5 bg-gray-200 rounded w-1/2 mt-2" />
        <div className="h-9 bg-gray-200 rounded w-full mt-3" />
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
  const [priceRange, setPriceRange] = useState<PriceRange>('all');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [showSortDrop, setShowSortDrop] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const sortRef = useRef<HTMLDivElement>(null);
  const { addItem } = useCart();

  const selectedCategory = params.kategori || null;

  // Debounce search input
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

    if (priceRange !== 'all') {
      result = result.filter((p) => matchesPriceRange(p, priceRange));
    }

    switch (sortBy) {
      case 'price-asc':
        result = [...result].sort((a, b) => (a.salePrice ?? a.basePrice) - (b.salePrice ?? b.basePrice));
        break;
      case 'price-desc':
        result = [...result].sort((a, b) => (b.salePrice ?? b.basePrice) - (a.salePrice ?? a.basePrice));
        break;
      case 'name':
        result = [...result].sort((a, b) => a.title.localeCompare(b.title, 'da'));
        break;
      default:
        break;
    }

    return result;
  }, [products, selectedCategory, debouncedSearch, priceRange, sortBy]);

  const selectedCatObj = categories.find((c) => c.slug === selectedCategory);
  const hasFilters = selectedCategory || debouncedSearch || priceRange !== 'all';

  const clearFilters = useCallback(() => {
    navigate('/shop');
    setSearchQuery('');
    setDebouncedSearch('');
    setPriceRange('all');
  }, [navigate]);

  // Category counts based on current products (pre-category-filter)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products) {
      counts[p.categorySlug] = (counts[p.categorySlug] || 0) + 1;
    }
    return counts;
  }, [products]);

  // Sidebar content (shared between desktop and mobile drawer)
  const SidebarContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Kategorier</h3>
        <div className="space-y-1">
          <button
            onClick={() => navigate('/shop')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              !selectedCategory
                ? 'bg-[#E30613] text-white font-medium'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="flex justify-between items-center">
              <span>Alle produkter</span>
              <span className={`text-xs ${!selectedCategory ? 'text-white/70' : 'text-gray-400'}`}>
                {products.length}
              </span>
            </span>
          </button>
          {categories.map((c) => (
            <button
              key={c.slug}
              onClick={() => { navigate(`/shop/${c.slug}`); setMobileFiltersOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedCategory === c.slug
                  ? 'bg-[#E30613] text-white font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="flex justify-between items-center">
                <span>{c.name}</span>
                <span className={`text-xs ${selectedCategory === c.slug ? 'text-white/70' : 'text-gray-400'}`}>
                  {categoryCounts[c.slug] || 0}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Prisinterval</h3>
        <div className="space-y-1">
          {(Object.entries(priceRangeLabels) as [PriceRange, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setPriceRange(key); setMobileFiltersOpen(false); }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                priceRange === key
                  ? 'bg-gray-900 text-white font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Clear filters */}
      {hasFilters && (
        <button
          onClick={() => { clearFilters(); setMobileFiltersOpen(false); }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <X className="w-4 h-4" />
          Ryd alle filtre
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1" style={{ paddingTop: 'var(--header-h, 124px)' }}>
        {/* Breadcrumbs */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-[1260px] mx-auto px-5 sm:px-6 py-3">
            <nav className="flex items-center gap-1.5 text-sm text-gray-500">
              <Link href="/" className="hover:text-gray-900 transition-colors">Forside</Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link href="/shop" className={`transition-colors ${selectedCategory ? 'hover:text-gray-900' : 'text-gray-900 font-medium'}`}>
                Shop
              </Link>
              {selectedCatObj && (
                <>
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span className="text-gray-900 font-medium">{selectedCatObj.name}</span>
                </>
              )}
            </nav>
          </div>
        </div>

        {/* Page header */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-[1260px] mx-auto px-5 sm:px-6 py-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {selectedCatObj ? selectedCatObj.name : 'Alle produkter'}
            </h1>
            {selectedCatObj?.description && (
              <p className="mt-2 text-gray-500 max-w-2xl">{selectedCatObj.description}</p>
            )}
          </div>
        </div>

        <div className="max-w-[1260px] mx-auto px-5 sm:px-6 py-6">
          <div className="flex gap-8">
            {/* Desktop sidebar */}
            <aside className="hidden lg:block w-60 flex-shrink-0">
              <div className="sticky top-[calc(var(--header-h,124px)+24px)]">
                <SidebarContent />
              </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Search + sort bar */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                {/* Mobile filter button */}
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filtre
                  {hasFilters && <span className="w-2 h-2 bg-[#E30613] rounded-full" />}
                </button>

                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Søg produkter..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:border-gray-400 focus:ring-1 focus:ring-gray-400 focus:outline-none transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Product count */}
                <span className="text-sm text-gray-400 hidden sm:block">
                  {filtered.length} produkt{filtered.length !== 1 ? 'er' : ''}
                </span>

                {/* Spacer */}
                <div className="flex-1" />

                {/* View toggle */}
                <div className="hidden sm:flex items-center border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {/* Sort dropdown */}
                <div ref={sortRef} className="relative">
                  <button
                    onClick={() => setShowSortDrop(!showSortDrop)}
                    className="flex items-center gap-2 text-sm font-medium border border-gray-200 rounded-lg px-4 py-2.5 hover:bg-gray-50 transition-colors"
                  >
                    {sortLabels[sortBy]}
                    <ChevronDown className={`w-4 h-4 transition-transform ${showSortDrop ? 'rotate-180' : ''}`} />
                  </button>
                  {showSortDrop && (
                    <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-50">
                      <div className="p-1.5">
                        {(Object.entries(sortLabels) as [SortOption, string][]).map(([key, label]) => (
                          <button
                            key={key}
                            onClick={() => { setSortBy(key); setShowSortDrop(false); }}
                            className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors ${
                              sortBy === key ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Product grid / list */}
              {productsLoading ? (
                <div className={`grid gap-5 ${
                  viewMode === 'grid'
                    ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                    : 'grid-cols-1'
                }`}>
                  {Array.from({ length: 9 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <PackageSearch className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-1">Ingen produkter fundet</h3>
                  <p className="text-sm text-gray-400 mb-4 max-w-sm">
                    Vi kunne ikke finde produkter der matcher dine filtre. Prøv at fjerne filtre eller søg efter noget andet.
                  </p>
                  <button
                    onClick={clearFilters}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-[#E30613] rounded-lg hover:bg-[#C00511] transition-colors"
                  >
                    Ryd alle filtre
                  </button>
                </div>
              ) : (
                <motion.div
                  layout
                  className={`grid gap-5 ${
                    viewMode === 'grid'
                      ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                      : 'grid-cols-1'
                  }`}
                >
                  <AnimatePresence mode="popLayout">
                    {filtered.map((product) => {
                      const displayPrice = getDisplayPrice(product);
                      const productUrl = `/produkt/${product.slug || product.id}`;

                      if (viewMode === 'list') {
                        return (
                          <motion.div
                            key={product.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300 flex"
                          >
                            <Link href={productUrl} className="block w-40 sm:w-52 flex-shrink-0">
                              <div className="aspect-square relative overflow-hidden bg-gray-100">
                                {product.image ? (
                                  <img
                                    src={product.image}
                                    alt={product.title}
                                    loading="lazy"
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                                    Ingen billede
                                  </div>
                                )}
                              </div>
                            </Link>
                            <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between min-w-0">
                              <div>
                                <span className="text-xs text-[#E30613] font-semibold uppercase tracking-wider">
                                  {product.category}
                                </span>
                                <Link href={productUrl}>
                                  <h3 className="text-base font-semibold text-gray-900 mt-1 line-clamp-2 hover:text-[#E30613] transition-colors cursor-pointer">
                                    {product.title}
                                  </h3>
                                </Link>
                                {product.description && (
                                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                                )}
                              </div>
                              <div className="flex items-end justify-between mt-3">
                                <div>
                                  {displayPrice.isSale && displayPrice.original && (
                                    <span className="text-sm text-gray-400 line-through mr-2">
                                      {displayPrice.original} DKK
                                    </span>
                                  )}
                                  <span className={`text-lg font-bold ${displayPrice.isSale ? 'text-[#E30613]' : 'text-gray-900'}`}>
                                    {displayPrice.label} DKK
                                  </span>
                                  <span className="text-xs text-gray-400 ml-1">(ekskl. moms)</span>
                                </div>
                                <Link
                                  href={productUrl}
                                  className="text-sm font-medium text-[#16a34a] hover:text-[#15803d] transition-colors flex items-center gap-1 flex-shrink-0"
                                >
                                  Se produkt
                                  <ChevronRight className="w-4 h-4" />
                                </Link>
                              </div>
                            </div>
                          </motion.div>
                        );
                      }

                      return (
                        <motion.div
                          key={product.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                        >
                          <Link href={productUrl} className="block">
                            <div className="aspect-square relative overflow-hidden bg-gray-100">
                              {/* Category badge */}
                              <span className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm text-xs font-semibold text-[#E30613] uppercase tracking-wider px-2.5 py-1 rounded-md">
                                {product.category}
                              </span>
                              {product.salePrice && (
                                <span className="absolute top-3 right-3 z-10 bg-[#E30613] text-white text-xs font-bold px-2.5 py-1 rounded-md">
                                  TILBUD
                                </span>
                              )}
                              {product.image ? (
                                <img
                                  src={product.image}
                                  alt={product.title}
                                  loading="lazy"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                                  Ingen billede
                                </div>
                              )}
                            </div>
                          </Link>
                          <div className="p-4">
                            <Link href={productUrl}>
                              <h3 className="text-[15px] font-semibold text-gray-900 leading-snug line-clamp-2 hover:text-[#E30613] transition-colors cursor-pointer min-h-[2.5rem]">
                                {product.title}
                              </h3>
                            </Link>

                            <div className="mt-2 mb-3">
                              {displayPrice.isSale && displayPrice.original && (
                                <span className="text-sm text-gray-400 line-through mr-2">
                                  {displayPrice.original} DKK
                                </span>
                              )}
                              <span className={`text-lg font-bold tracking-tight ${displayPrice.isSale ? 'text-[#E30613]' : 'text-[#16a34a]'}`}>
                                {displayPrice.label} DKK
                              </span>
                              <p className="text-xs text-gray-400 mt-0.5">(ekskl. moms)</p>
                            </div>

                            <Link
                              href={productUrl}
                              className="inline-flex items-center gap-1 text-sm font-medium text-[#16a34a] hover:text-[#15803d] transition-colors"
                            >
                              Se produkt
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50 lg:hidden"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white z-50 lg:hidden shadow-2xl"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Filtre</h2>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="p-2 -mr-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 65px)' }}>
                <SidebarContent />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
