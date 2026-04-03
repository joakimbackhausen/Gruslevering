import { useState, useMemo } from 'react';
import { Link, useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Loader2, X, ChevronDown, Search, ShoppingCart } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useCart } from '@/contexts/CartContext';

interface Product {
  id: string;
  title: string;
  sku: string;
  price: number;
  currency: string;
  image: string;
  images: string[];
  category: string;
  categorySlug: string;
  description: string;
  variants: string[];
  url: string;
}

interface Category {
  id: string;
  slug: string;
  name: string;
  image: string;
  count: number;
  url: string;
  parentId: string | null;
}

function formatPrice(price: number): string {
  return price.toLocaleString("da-DK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'name';

export default function Machines() {
  const params = useParams<{ kategori?: string }>();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showCatDrop, setShowCatDrop] = useState(false);
  const [showSortDrop, setShowSortDrop] = useState(false);
  const { addItem } = useCart();

  const selectedCategory = params.kategori || null;

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
      result = result.filter(p => p.categorySlug === selectedCategory);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    switch (sortBy) {
      case 'price-asc': result = [...result].sort((a, b) => a.price - b.price); break;
      case 'price-desc': result = [...result].sort((a, b) => b.price - a.price); break;
      case 'name': result = [...result].sort((a, b) => a.title.localeCompare(b.title, 'da')); break;
      default: break; // newest = default order
    }
    return result;
  }, [products, selectedCategory, searchQuery, sortBy]);

  const selectedCatName = categories.find(c => c.slug === selectedCategory)?.name;
  const hasFilters = selectedCategory || searchQuery;

  const sortLabels: Record<SortOption, string> = {
    'newest': 'Nyeste',
    'price-asc': 'Pris lav-høj',
    'price-desc': 'Pris høj-lav',
    'name': 'Navn A-Å',
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      {/* Fixed filter bar - directly attached to header */}
      <div className="fixed left-0 right-0 z-[45] bg-white" style={{ top: 'var(--header-h, 124px)', borderTop: '0.7px solid #e5e7eb', borderBottom: '0.7px solid #e5e7eb' }}>
        <div className="max-w-[1260px] mx-auto px-5 sm:px-6 py-3.5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[20px] font-bold text-gray-900 mr-2">
              {selectedCatName || 'Alle produkter'}
            </h1>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Søg produkter..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2.5 text-[14px] border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-gray-300 focus:outline-none w-52 transition-colors"
              />
            </div>

            {/* Category dropdown */}
            <div className="relative">
              <button
                onClick={() => { setShowCatDrop(!showCatDrop); setShowSortDrop(false); }}
                className="flex items-center gap-2 text-[14px] font-medium text-[#1A1A1A] border border-gray-200 rounded-lg px-4 py-2.5 hover:bg-gray-50 transition-colors"
              >
                Kategori
                {selectedCatName && <span className="bg-[#E30613] text-white text-[12px] px-2 py-0.5 rounded">{selectedCatName}</span>}
                <ChevronDown className="w-4 h-4" />
              </button>
              {showCatDrop && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-100 z-50 max-h-80 overflow-y-auto">
                  <div className="p-1.5">
                    <button onClick={() => { navigate('/shop'); setShowCatDrop(false); }} className={`w-full text-left px-3 py-2.5 rounded-md text-[14px] ${!selectedCategory ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'}`}>
                      Alle kategorier
                    </button>
                    {categories.map(c => (
                      <button key={c.slug} onClick={() => { navigate(`/shop/${c.slug}`); setShowCatDrop(false); }}
                        className={`w-full text-left px-3 py-2.5 rounded-md text-[14px] flex justify-between ${selectedCategory === c.slug ? 'bg-[#E30613] text-white' : 'hover:bg-gray-50'}`}>
                        <span>{c.name}</span>
                        <span className={`text-[12px] ${selectedCategory === c.slug ? 'text-white/60' : 'text-gray-400'}`}>{c.count}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sort dropdown */}
            <div className="relative">
              <button
                onClick={() => { setShowSortDrop(!showSortDrop); setShowCatDrop(false); }}
                className="flex items-center gap-2 text-[14px] font-medium text-[#1A1A1A] border border-gray-200 rounded-lg px-4 py-2.5 hover:bg-gray-50 transition-colors"
              >
                {sortLabels[sortBy]}
                <ChevronDown className="w-4 h-4" />
              </button>
              {showSortDrop && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-50">
                  <div className="p-1.5">
                    {(Object.entries(sortLabels) as [SortOption, string][]).map(([key, label]) => (
                      <button key={key} onClick={() => { setSortBy(key); setShowSortDrop(false); }}
                        className={`w-full text-left px-3 py-2.5 rounded-md text-[14px] ${sortBy === key ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {hasFilters && (
              <button onClick={() => { navigate('/shop'); setSearchQuery(''); }}
                className="text-[14px] text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors">
                <X className="w-4 h-4" /> Ryd
              </button>
            )}

            <span className="ml-auto text-[14px] text-gray-400">{filtered.length} produkter</span>
          </div>
        </div>
      </div>

      <main className="flex-1" style={{ paddingTop: 'calc(var(--header-h, 124px) + 56px)' }}>
        <div className="max-w-[1260px] mx-auto px-5 sm:px-6 py-8">
          {productsLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filtered.map(product => (
                  <div key={product.id} className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300">
                    <Link href={`/produkt/${product.id}`} className="block">
                      <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                        {product.image ? (
                          <img src={product.image} alt={product.title} loading="lazy"
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 text-[14px]">Ingen billede</div>
                        )}
                      </div>
                    </Link>
                    <div className="p-4">
                      <p className="text-[12px] text-[#E30613] font-semibold tracking-[0.1em] uppercase mb-1">{product.category}</p>
                      <Link href={`/produkt/${product.id}`}>
                        <h3 className="text-[15px] font-semibold text-[#1a1a1a] leading-snug mb-1 line-clamp-2 hover:text-[#E30613] transition-colors cursor-pointer">{product.title}</h3>
                      </Link>
                      <p className="text-[13px] text-gray-400 mb-3">SKU: {product.sku}</p>

                      <div className="mb-3">
                        <p className="text-[18px] font-bold text-[#1a1a1a] tracking-tight">{formatPrice(product.price)} DKK</p>
                        <p className="text-[12px] text-gray-400 mt-0.5">(ekskl. moms)</p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addItem({
                            id: product.id,
                            title: product.title,
                            price: product.price,
                            image: product.image,
                            sku: product.sku,
                          });
                        }}
                        className="w-full bg-[#E30613] hover:bg-[#C00511] text-white font-semibold text-[14px] py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        KØB
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {filtered.length === 0 && (
                <div className="text-center py-20 text-gray-400">
                  <p className="text-[16px]">Ingen produkter matcher din søgning.</p>
                  <button onClick={() => { navigate('/shop'); setSearchQuery(''); }}
                    className="mt-2 text-gray-600 hover:underline text-[15px]">Ryd filtre</button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
