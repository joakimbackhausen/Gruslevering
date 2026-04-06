import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import {
  X,
  ChevronRight,
  ChevronDown,
  PackageSearch,
  SlidersHorizontal,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SmartImage from '@/components/SmartImage';
import { useCart } from '@/contexts/CartContext';
import type { Product, Category } from '@/types/product';

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const formatPrice = (price: number) =>
  new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    minimumFractionDigits: 0,
  }).format(price);

type SortOption = 'popular' | 'price-asc' | 'price-desc' | 'name';

const sortLabels: Record<SortOption, string> = {
  popular: 'Populære',
  'price-asc': 'Pris lav-høj',
  'price-desc': 'Pris høj-lav',
  name: 'Navn A-Z',
};

type PriceRange = 'all' | 'under500' | '500-1000' | '1000-2000' | 'over2000';

const priceRangeLabels: Record<PriceRange, string> = {
  all: 'Alle priser',
  under500: 'Under 500 kr',
  '500-1000': '500 - 1.000 kr',
  '1000-2000': '1.000 - 2.000 kr',
  over2000: 'Over 2.000 kr',
};

function matchesPriceRange(price: number, range: PriceRange): boolean {
  switch (range) {
    case 'under500':
      return price < 500;
    case '500-1000':
      return price >= 500 && price <= 1000;
    case '1000-2000':
      return price > 1000 && price <= 2000;
    case 'over2000':
      return price > 2000;
    default:
      return true;
  }
}

/* ------------------------------------------------------------------ */
/*  Skeleton Card                                                     */
/* ------------------------------------------------------------------ */

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-[var(--grus-border)] overflow-hidden">
      <div className="aspect-square bg-[var(--grus-sand)] animate-pulse" />
      <div className="p-4 space-y-2">
        <div className="h-3 w-16 rounded bg-gray-100 animate-pulse" />
        <div className="h-4 w-3/4 rounded bg-gray-100 animate-pulse" />
        <div className="h-4 w-1/3 rounded bg-gray-100 animate-pulse" />
      </div>
      <div className="px-4 pb-4">
        <div className="h-10 rounded-lg bg-gray-100 animate-pulse" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Product Card (consistent with Home)                               */
/* ------------------------------------------------------------------ */

function ProductCard({ product }: { product: Product }) {
  const productUrl = `/produkt/${product.slug || product.id}`;
  const hasVariants = product.variants && product.variants.length > 0;
  const effectivePrice = product.salePrice ?? product.basePrice;
  const isOnSale =
    product.salePrice !== null && product.salePrice < product.basePrice;

  const { addItem, setIsOpen } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasVariants) return;
    addItem({
      id: product.id,
      wcProductId: product.wcId ?? undefined,
      title: product.title,
      price: effectivePrice,
      image: product.image,
      sku: product.sku,
      unit: product.unit,
      tieredPricing: product.tieredPricing,
    });
    setIsOpen(true);
  };

  return (
    <Link
      href={productUrl}
      className="group block bg-white rounded-xl border border-[var(--grus-border)] overflow-hidden transition-all duration-200 hover:shadow-md"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        {product.image ? (
          <SmartImage
            src={product.image}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            width={400}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300 text-sm">
            Ingen billede
          </div>
        )}
        {isOnSale && (
          <span className="absolute top-2 right-2 bg-[var(--grus-accent)] text-white text-xs font-bold rounded-lg px-2 py-1">
            Tilbud
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--grus-green)]">
          {product.category}
        </span>
        <h3 className="text-sm font-medium text-[var(--grus-dark)] mt-1 line-clamp-2 leading-snug min-h-[2.5rem]">
          {product.title}
        </h3>
        <div className="mt-2 flex items-baseline gap-2">
          {isOnSale ? (
            <>
              <span className="text-base font-bold text-[var(--grus-accent)]">
                {hasVariants ? 'Fra ' : ''}
                {formatPrice(product.salePrice!)}
              </span>
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(product.basePrice)}
              </span>
            </>
          ) : (
            <span className="text-base font-bold text-[var(--grus-dark)]">
              {hasVariants && (
                <span className="text-sm font-normal text-gray-500">
                  Fra{' '}
                </span>
              )}
              {formatPrice(effectivePrice)}
            </span>
          )}
        </div>
        {product.deliveryIncluded && (
          <p className="text-xs text-gray-400 mt-0.5">
            inkl. levering
          </p>
        )}
      </div>

      {/* Button */}
      <div className="px-4 pb-4">
        {hasVariants ? (
          <span className="block w-full text-center border border-[var(--grus-green)] text-[var(--grus-green)] py-2.5 rounded-lg text-sm font-semibold group-hover:bg-[var(--grus-green-light)] transition-colors">
            Se produkt &rarr;
          </span>
        ) : (
          <button
            onClick={handleAddToCart}
            className="w-full bg-[var(--grus-green)] text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-[var(--grus-green-hover)] transition-colors cursor-pointer"
          >
            Læg i kurv
          </button>
        )}
      </div>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar Filter Section                                            */
/* ------------------------------------------------------------------ */

function FilterSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[var(--grus-border)] last:border-b-0 pb-4 mb-4 last:pb-0 last:mb-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left mb-3"
      >
        <span className="text-sm font-semibold text-[var(--grus-dark)]">
          {title}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sidebar Content                                                   */
/* ------------------------------------------------------------------ */

function SidebarFilters({
  categories,
  products,
  selectedCategory,
  priceRange,
  onCategoryChange,
  onPriceRangeChange,
  onReset,
}: {
  categories: Category[];
  products: Product[];
  selectedCategory: string | null;
  priceRange: PriceRange;
  onCategoryChange: (slug: string | null) => void;
  onPriceRangeChange: (range: PriceRange) => void;
  onReset: () => void;
}) {
  const parentCategories = categories.filter((c) => c.parentId === null);
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());

  // Build children lookup: parentId -> child categories
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

  // Count products per category (direct slug match)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products) {
      counts[p.categorySlug] = (counts[p.categorySlug] || 0) + 1;
    }
    return counts;
  }, [products]);

  // Count products for a parent = sum of direct + all children
  function getParentCount(parent: Category): number {
    let count = categoryCounts[parent.slug] || 0;
    const children = childrenByParentId[parent.id] || [];
    for (const child of children) {
      count += categoryCounts[child.slug] || 0;
    }
    return count;
  }

  // Toggle expand/collapse for parent categories
  function toggleParent(slug: string) {
    setExpandedParents((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  }

  // A parent is expanded if manually toggled OR if it or a child is selected
  function isExpanded(parent: Category): boolean {
    if (expandedParents.has(parent.slug)) return true;
    if (selectedCategory === parent.slug) return true;
    const children = childrenByParentId[parent.id] || [];
    return children.some((c) => c.slug === selectedCategory);
  }

  const hasActiveFilters = selectedCategory !== null || priceRange !== 'all';

  return (
    <div className="bg-white rounded-xl border border-[var(--grus-border)] p-5">
      {/* Kategorier */}
      <FilterSection title="Kategorier">
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => onCategoryChange(null)}
              className={`flex items-center gap-2 w-full text-left text-sm py-1.5 px-2 rounded-lg transition-colors ${
                !selectedCategory
                  ? 'font-semibold text-[var(--grus-green)] bg-[var(--grus-green-light)]'
                  : 'text-[var(--grus-dark)] hover:text-[var(--grus-green)] hover:bg-[var(--grus-green-light)]/50'
              }`}
            >
              {!selectedCategory && (
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--grus-green)] flex-shrink-0" />
              )}
              <span className={selectedCategory ? 'ml-3.5' : ''}>
                Alle produkter
              </span>
              <span className="ml-auto text-xs text-gray-400">
                ({products.length})
              </span>
            </button>
          </li>
          {parentCategories.map((parent) => {
            const children = childrenByParentId[parent.id] || [];
            const parentCount = getParentCount(parent);
            const expanded = isExpanded(parent);

            return (
              <li key={parent.slug}>
                <div className="flex items-center gap-0">
                  <button
                    onClick={() => onCategoryChange(parent.slug)}
                    className={`flex items-center gap-2 flex-1 text-left text-sm py-1.5 px-2 rounded-lg transition-colors ${
                      selectedCategory === parent.slug
                        ? 'font-semibold text-[var(--grus-green)] bg-[var(--grus-green-light)]'
                        : 'text-[var(--grus-dark)] hover:text-[var(--grus-green)] hover:bg-[var(--grus-green-light)]/50'
                    }`}
                  >
                    {selectedCategory === parent.slug && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--grus-green)] flex-shrink-0" />
                    )}
                    <span className={selectedCategory !== parent.slug ? 'ml-3.5' : ''}>
                      {parent.name}
                    </span>
                    <span className="ml-auto text-xs text-gray-400">
                      ({parentCount})
                    </span>
                  </button>
                  {children.length > 0 && (
                    <button
                      onClick={() => toggleParent(parent.slug)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-[var(--grus-green)] hover:bg-gray-100 transition-colors flex-shrink-0"
                      aria-label={expanded ? 'Fold sammen' : 'Udvid'}
                    >
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
                {/* Child categories — toggle expandable */}
                {children.length > 0 && expanded && (
                  <ul className="ml-5 mt-1 space-y-0.5 border-l-2 border-[var(--grus-border)] pl-2">
                    {children.map((child) => (
                      <li key={child.slug}>
                        <button
                          onClick={() => onCategoryChange(child.slug)}
                          className={`flex items-center gap-2 w-full text-left text-[13px] py-1 px-2 rounded-lg transition-colors ${
                            selectedCategory === child.slug
                              ? 'font-semibold text-[var(--grus-green)] bg-[var(--grus-green-light)]'
                              : 'text-gray-600 hover:text-[var(--grus-green)] hover:bg-[var(--grus-green-light)]/50'
                          }`}
                        >
                          {selectedCategory === child.slug && (
                            <span className="w-1 h-1 rounded-full bg-[var(--grus-green)] flex-shrink-0" />
                          )}
                          <span className={selectedCategory !== child.slug ? 'ml-2' : ''}>
                            {child.name}
                          </span>
                          <span className="ml-auto text-xs text-gray-400">
                            ({categoryCounts[child.slug] || 0})
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </FilterSection>

      {/* Pris */}
      <FilterSection title="Pris">
        <ul className="space-y-1">
          {(Object.entries(priceRangeLabels) as [PriceRange, string][])
            .filter(([key]) => key !== 'all')
            .map(([key, label]) => (
              <li key={key}>
                <label className="flex items-center gap-2.5 text-sm py-1.5 px-2 rounded-lg cursor-pointer hover:bg-[var(--grus-green-light)]/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={priceRange === key}
                    onChange={() =>
                      onPriceRangeChange(priceRange === key ? 'all' : key)
                    }
                    className="w-4 h-4 rounded border-[var(--grus-border)] text-[var(--grus-green)] focus:ring-[var(--grus-green)] accent-[var(--grus-green)]"
                  />
                  <span className="text-[var(--grus-dark)]">{label}</span>
                </label>
              </li>
            ))}
        </ul>
      </FilterSection>

      {/* Reset */}
      {hasActiveFilters && (
        <button
          onClick={onReset}
          className="text-sm text-gray-500 underline hover:text-[var(--grus-dark)] transition-colors mt-4"
        >
          Nulstil filtre
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mobile Filter Drawer                                              */
/* ------------------------------------------------------------------ */

function MobileFilterDrawer({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white z-50 transform transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--grus-border)]">
          <h2 className="font-semibold text-[var(--grus-dark)]">Filtre</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-[var(--grus-dark)]" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto h-[calc(100%-57px)]">
          {children}
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Shop Page                                                         */
/* ------------------------------------------------------------------ */

export default function Shop() {
  const params = useParams<{ kategori?: string; underkategori?: string }>();
  const [, navigate] = useLocation();
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [showSortDrop, setShowSortDrop] = useState(false);
  const [priceRange, setPriceRange] = useState<PriceRange>('all');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // If URL is /shop/parent/child, use child slug; otherwise use parent slug
  const selectedCategory = params.underkategori || params.kategori || null;

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

  const { data: products = [], isLoading: productsLoading } = useQuery<
    Product[]
  >({
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

  // Build a set of child slugs for each parent category slug
  const childSlugsByParent = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    const parentCats = categories.filter((c) => c.parentId === null);
    for (const parent of parentCats) {
      const childSlugs = categories
        .filter((c) => c.parentId === parent.id)
        .map((c) => c.slug);
      map[parent.slug] = new Set([parent.slug, ...childSlugs]);
    }
    return map;
  }, [categories]);

  const filtered = useMemo(() => {
    let result = products;

    if (selectedCategory) {
      // If selected category is a parent, also include all child category products
      const matchingSlugs = childSlugsByParent[selectedCategory];
      if (matchingSlugs) {
        // Parent category selected — show products from parent + all children
        result = result.filter(
          (p) => matchingSlugs.has(p.categorySlug) || p.parentCategorySlug === selectedCategory,
        );
      } else {
        // Child category selected — exact match only
        result = result.filter((p) => p.categorySlug === selectedCategory);
      }
    }

    if (priceRange !== 'all') {
      result = result.filter((p) =>
        matchesPriceRange(p.salePrice ?? p.basePrice, priceRange),
      );
    }

    switch (sortBy) {
      case 'price-asc':
        result = [...result].sort(
          (a, b) =>
            (a.salePrice ?? a.basePrice) - (b.salePrice ?? b.basePrice),
        );
        break;
      case 'price-desc':
        result = [...result].sort(
          (a, b) =>
            (b.salePrice ?? b.basePrice) - (a.salePrice ?? a.basePrice),
        );
        break;
      case 'name':
        result = [...result].sort((a, b) =>
          a.title.localeCompare(b.title, 'da'),
        );
        break;
      default:
        break;
    }

    return result;
  }, [products, selectedCategory, sortBy, priceRange, childSlugsByParent]);

  const selectedCatObj = categories.find((c) => c.slug === selectedCategory);
  // Resolve parent category for breadcrumb when a child category is selected
  const parentCatObj = selectedCatObj?.parentId
    ? categories.find((c) => c.id === selectedCatObj.parentId)
    : null;

  const activeFilterCount =
    (selectedCategory ? 1 : 0) + (priceRange !== 'all' ? 1 : 0);

  const clearFilters = useCallback(() => {
    navigate('/shop');
    setPriceRange('all');
  }, [navigate]);

  const handleCategoryChange = useCallback(
    (slug: string | null) => {
      if (!slug) {
        navigate('/shop');
        return;
      }
      // Check if this is a child category — if so, build /shop/parent/child URL
      const cat = categories.find((c) => c.slug === slug);
      if (cat && cat.parentId !== null) {
        const parent = categories.find((c) => c.id === cat.parentId);
        if (parent) {
          navigate(`/shop/${parent.slug}/${slug}`);
          return;
        }
      }
      // Parent category or unknown — use /shop/slug
      navigate(`/shop/${slug}`);
    },
    [navigate, categories],
  );

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1" style={{ paddingTop: 'var(--header-h, 124px)' }}>
        {/* Page header area */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1 text-sm text-gray-500 mb-4">
            <Link
              href="/"
              className="hover:text-[var(--grus-dark)] transition-colors"
            >
              Forside
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link
              href="/shop"
              className={`transition-colors ${
                selectedCategory
                  ? 'hover:text-[var(--grus-dark)]'
                  : 'text-[var(--grus-dark)] font-medium'
              }`}
            >
              Shop
            </Link>
            {parentCatObj && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <Link
                  href={`/shop/${parentCatObj.slug}`}
                  className="hover:text-[var(--grus-dark)] transition-colors"
                >
                  {parentCatObj.name}
                </Link>
              </>
            )}
            {selectedCatObj && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-[var(--grus-dark)] font-medium">
                  {selectedCatObj.name}
                </span>
              </>
            )}
          </nav>

          {/* Page title */}
          <h1 className="font-display text-2xl lg:text-3xl font-bold text-[var(--grus-dark)]">
            {selectedCatObj ? selectedCatObj.name : 'Alle produkter'}
          </h1>
          {selectedCatObj?.description && (
            <p className="mt-2 text-sm text-gray-500 max-w-2xl">
              {selectedCatObj.description}
            </p>
          )}
        </div>

        {/* Two-column layout */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="flex gap-8">
            {/* LEFT SIDEBAR - desktop only */}
            <aside className="hidden lg:block w-64 xl:w-72 flex-shrink-0">
              <div className="sticky" style={{ top: 'calc(var(--header-h, 124px) + 2rem)' }}>
                <SidebarFilters
                  categories={categories}
                  products={products}
                  selectedCategory={selectedCategory}
                  priceRange={priceRange}
                  onCategoryChange={handleCategoryChange}
                  onPriceRangeChange={setPriceRange}
                  onReset={clearFilters}
                />
              </div>
            </aside>

            {/* RIGHT - product grid area */}
            <div className="flex-1 min-w-0">
              {/* Top bar */}
              <div className="space-y-3 mb-6">
                {/* Controls row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Mobile filter button */}
                    <button
                      onClick={() => setMobileFilterOpen(true)}
                      className="lg:hidden flex items-center gap-2 text-sm border border-[var(--grus-border)] rounded-lg px-3 py-2 bg-white hover:bg-[var(--grus-green-light)] transition-colors"
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                      <span>Filtrer</span>
                      {activeFilterCount > 0 && (
                        <span className="w-5 h-5 flex items-center justify-center text-xs font-bold text-white bg-[var(--grus-green)] rounded-full">
                          {activeFilterCount}
                        </span>
                      )}
                    </button>

                    {/* Product count */}
                    {!productsLoading && (
                      <p className="text-sm text-gray-500">
                        Viser {filtered.length} produkt
                        {filtered.length !== 1 ? 'er' : ''}
                      </p>
                    )}
                  </div>

                  {/* Sort dropdown */}
                  <div ref={sortRef} className="relative">
                    <button
                      onClick={() => setShowSortDrop(!showSortDrop)}
                      className="flex items-center gap-1.5 text-sm border border-[var(--grus-border)] rounded-lg px-3 py-2 bg-white hover:bg-[var(--grus-green-light)] transition-colors"
                    >
                      <span className="text-gray-500 hidden sm:inline">
                        Sorter:
                      </span>
                      <span className="text-[var(--grus-dark)] font-medium">
                        {sortLabels[sortBy]}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform ${
                          showSortDrop ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {showSortDrop && (
                      <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-[var(--grus-border)] z-50 overflow-hidden">
                        {(
                          Object.entries(sortLabels) as [SortOption, string][]
                        ).map(([key, label]) => (
                          <button
                            key={key}
                            onClick={() => {
                              setSortBy(key);
                              setShowSortDrop(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                              sortBy === key
                                ? 'bg-[var(--grus-green-light)] font-medium text-[var(--grus-green)]'
                                : 'text-[var(--grus-dark)] hover:bg-gray-50'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Product grid */}
              {productsLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <PackageSearch className="w-12 h-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-[var(--grus-dark)] mb-2">
                    Ingen produkter fundet
                  </h3>
                  <p className="text-sm text-gray-500 mb-6 max-w-xs">
                    Prøv at justere dine filtre eller søg efter noget andet.
                  </p>
                  <button
                    onClick={clearFilters}
                    className="text-sm font-medium text-[var(--grus-green)] hover:underline"
                  >
                    Ryd alle filtre
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* SEO category descriptions */}
      {categories.length > 0 && (
        <section className="bg-[var(--grus-sand)] border-t border-[var(--grus-border)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {categories
                .filter((c) => c.description && c.description.trim().length > 0)
                .map((cat) => (
                  <div key={cat.slug}>
                    <Link
                      href={cat.url || `/shop/${cat.slug}`}
                      className="text-base font-semibold text-[var(--grus-dark)] hover:text-[var(--grus-green)] transition-colors"
                    >
                      {cat.name}
                    </Link>
                    <p className="mt-2 text-sm text-gray-600 leading-relaxed line-clamp-4">
                      {cat.description}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}

      {/* Mobile filter drawer */}
      <MobileFilterDrawer
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
      >
        <SidebarFilters
          categories={categories}
          products={products}
          selectedCategory={selectedCategory}
          priceRange={priceRange}
          onCategoryChange={(slug) => {
            handleCategoryChange(slug);
            setMobileFilterOpen(false);
          }}
          onPriceRangeChange={setPriceRange}
          onReset={() => {
            clearFilters();
            setMobileFilterOpen(false);
          }}
        />
      </MobileFilterDrawer>

      <Footer />
    </div>
  );
}
