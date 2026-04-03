import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Search, X, ChevronRight, PackageSearch, ChevronDown } from 'lucide-react';
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
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="aspect-square bg-gray-100 animate-pulse" />
      <div className="p-4 space-y-2">
        <div className="h-3 w-16 rounded bg-gray-100 animate-pulse" />
        <div className="h-4 w-3/4 rounded bg-gray-100 animate-pulse" />
        <div className="h-4 w-1/3 rounded bg-gray-100 animate-pulse" />
      </div>
      <div className="px-4 pb-4">
        <div className="h-4 w-20 rounded bg-gray-100 animate-pulse" />
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const productUrl = `/produkt/${product.slug || product.id}`;
  const hasVariants = product.variants && product.variants.length > 0;
  const effectivePrice = product.salePrice ?? product.basePrice;
  const isOnSale = product.salePrice !== null && product.salePrice < product.basePrice;

  return (
    <Link
      href={productUrl}
      className="group block bg-white rounded-xl border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md hover:border-gray-200"
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-50 p-3">
        {product.image ? (
          <img
            src={product.image}
            alt={product.title}
            loading="lazy"
            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
            Ingen billede
          </div>
        )}
        {isOnSale && (
          <span className="absolute top-2 right-2 bg-[var(--grus-accent)] text-white text-xs font-medium rounded-md px-2 py-0.5">
            Tilbud
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <span className="text-xs text-[var(--grus-green)] font-medium uppercase tracking-wide">
          {product.category}
        </span>
        <h3 className="text-sm font-semibold text-gray-900 mt-1 line-clamp-2 leading-snug">
          {product.title}
        </h3>
        <div className="mt-2 flex items-baseline gap-2">
          {isOnSale ? (
            <>
              <span className="text-base font-bold text-gray-900">
                {formatPrice(product.salePrice!)}
              </span>
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(product.basePrice)}
              </span>
            </>
          ) : (
            <span className="text-base font-bold text-gray-900">
              {hasVariants ? 'Fra ' : ''}
              {formatPrice(effectivePrice)}
            </span>
          )}
        </div>
      </div>

      {/* Button area */}
      <div className="px-4 pb-4">
        <span className="text-sm text-[var(--grus-green)] font-medium group-hover:underline">
          Se produkt
        </span>
      </div>
    </Link>
  );
}

export default function Shop() {
  const params = useParams<{ kategori?: string }>();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [showSortDrop, setShowSortDrop] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

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

  const parentCategories = categories.filter((c) => c.parentId === null);

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
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1" style={{ paddingTop: 'var(--header-h, 124px)' }}>
        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1 text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-gray-700 transition-colors">
              Forside
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link
              href="/shop"
              className={`transition-colors ${
                selectedCategory ? 'hover:text-gray-700' : 'text-gray-900 font-medium'
              }`}
            >
              Shop
            </Link>
            {selectedCatObj && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-gray-900 font-medium">{selectedCatObj.name}</span>
              </>
            )}
          </nav>

          {/* Page title */}
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-gray-900">
            {selectedCatObj ? selectedCatObj.name : 'Alle produkter'}
          </h1>
          {selectedCatObj?.description && (
            <p className="mt-2 text-sm text-gray-500 max-w-2xl">
              {selectedCatObj.description}
            </p>
          )}
        </div>

        {/* Filter bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Category buttons */}
            <div className="flex-1 min-w-0 overflow-x-auto scrollbar-hide">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/shop')}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    !selectedCategory
                      ? 'bg-[var(--grus-green)] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Alle
                </button>
                {parentCategories.map((c) => (
                  <button
                    key={c.slug}
                    onClick={() => navigate(`/shop/${c.slug}`)}
                    className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedCategory === c.slug
                        ? 'bg-[var(--grus-green)] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Search + Sort */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Sog produkter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 sm:w-56 text-sm border border-gray-200 rounded-lg pl-9 pr-8 py-2 bg-white focus:border-[var(--grus-green)] focus:ring-1 focus:ring-[var(--grus-green)] focus:outline-none transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Sort dropdown */}
              <div ref={sortRef} className="relative">
                <button
                  onClick={() => setShowSortDrop(!showSortDrop)}
                  className="flex items-center gap-1.5 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white hover:bg-gray-50 transition-colors"
                >
                  <span className="text-gray-500 hidden sm:inline">Sorter:</span>
                  <span className="text-gray-700 font-medium">{sortLabels[sortBy]}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      showSortDrop ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {showSortDrop && (
                  <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-50 overflow-hidden">
                    {(Object.entries(sortLabels) as [SortOption, string][]).map(
                      ([key, label]) => (
                        <button
                          key={key}
                          onClick={() => {
                            setSortBy(key);
                            setShowSortDrop(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                            sortBy === key
                              ? 'bg-gray-50 font-medium text-gray-900'
                              : 'text-gray-600 hover:bg-gray-50'
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

          {/* Results count */}
          {!productsLoading && (
            <p className="text-sm text-gray-500 mt-3">
              Viser {filtered.length} produkt{filtered.length !== 1 ? 'er' : ''}
            </p>
          )}
        </div>

        {/* Product grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          {productsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <PackageSearch className="w-12 h-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Ingen produkter fundet
              </h3>
              <p className="text-sm text-gray-500 mb-6 max-w-xs">
                Prov at justere dine filtre eller sog efter noget andet.
              </p>
              <button
                onClick={clearFilters}
                className="text-sm font-medium text-[var(--grus-green)] hover:underline"
              >
                Ryd alle filtre
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
