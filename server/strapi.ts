/**
 * Strapi CMS client — fetches product/category/page/order data from Strapi REST API.
 * This is the sole data source for the application.
 */

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_TOKEN = process.env.STRAPI_TOKEN || '';

// ── Interfaces ──

export interface VariantGroup {
  label: string;
  options: VariantOption[];
}

export interface VariantOption {
  name: string;
  priceDiff: number;
  image?: string;
  skuSuffix?: string;
  inStock: boolean;
}

export interface TieredPrice {
  minQty: number;
  maxQty: number | null;
  price: number;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  sku: string;
  basePrice: number;
  salePrice: number | null;
  currency: string;
  image: string;
  images: string[];
  category: string;
  categorySlug: string;
  description: string;
  weight: string;
  volume: string;
  unit: 'bigbag' | 'saek' | 'stk' | 'm3';
  deliveryIncluded: boolean;
  variants: VariantGroup[] | null;
  tieredPricing: TieredPrice[] | null;
  featured: boolean;
  url: string;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  description: string;
  image: string;
  count: number;
  url: string;
  parentId: number | null;
  sortOrder: number;
}

// ── Helpers ──

const headers: Record<string, string> = {
  'Content-Type': 'application/json',
};

function getHeaders() {
  const h = { ...headers };
  if (STRAPI_TOKEN) {
    h['Authorization'] = `Bearer ${STRAPI_TOKEN}`;
  }
  return h;
}

async function strapiGet<T>(path: string): Promise<T> {
  const url = `${STRAPI_URL}${path}`;
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Strapi ${url}: ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

async function strapiPost<T>(path: string, body: unknown): Promise<T> {
  const url = `${STRAPI_URL}${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Strapi POST ${url}: ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

// ── Cache ──

let cachedProducts: Product[] | null = null;
let cachedCategories: Category[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 min

function isCacheValid(): boolean {
  return cachedProducts !== null && Date.now() - cacheTimestamp < CACHE_TTL;
}

// ── Strapi response types ──

interface StrapiProduct {
  id: number;
  documentId: string;
  title: string;
  slug: string;
  sku: string;
  basePrice: number;
  salePrice: number | null;
  currency: string;
  image: string;
  images: string[];
  externalId: string;
  url: string;
  description: string;
  weight: string;
  volume: string;
  unit: string;
  deliveryIncluded: boolean;
  variants: VariantGroup[] | null;
  tieredPricing: TieredPrice[] | null;
  featured: boolean;
  category?: {
    id: number;
    documentId: string;
    name: string;
    slug: string;
  } | null;
}

interface StrapiCategory {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  externalId: number;
  url: string;
  sortOrder: number;
  parent?: { id: number; documentId: string; slug: string } | null;
  children?: { id: number; slug: string }[];
  products?: { id: number }[];
}

interface StrapiListResponse<T> {
  data: T[];
  meta: { pagination: { page: number; pageSize: number; pageCount: number; total: number } };
}

interface StrapiSingleResponse<T> {
  data: T;
}

// ── Fetch all pages ──

async function fetchAllPages<T>(basePath: string): Promise<T[]> {
  const all: T[] = [];
  let page = 1;
  const pageSize = 100;

  while (true) {
    const sep = basePath.includes('?') ? '&' : '?';
    const res = await strapiGet<StrapiListResponse<T>>(
      `${basePath}${sep}pagination[page]=${page}&pagination[pageSize]=${pageSize}`
    );
    all.push(...res.data);
    if (page >= res.meta.pagination.pageCount) break;
    page++;
  }
  return all;
}

// ── Transform helpers ──

function mapStrapiProduct(p: StrapiProduct): Product {
  const cat = p.category;
  return {
    id: p.externalId || String(p.id),
    title: p.title,
    slug: p.slug || '',
    sku: p.sku || '',
    basePrice: p.basePrice ?? 0,
    salePrice: p.salePrice ?? null,
    currency: p.currency || 'DKK',
    image: p.image || '',
    images: p.images || [],
    category: cat?.name || '',
    categorySlug: cat?.slug || '',
    description: p.description || '',
    weight: p.weight || '',
    volume: p.volume || '',
    unit: (p.unit as Product['unit']) || 'stk',
    deliveryIncluded: p.deliveryIncluded ?? false,
    variants: p.variants || null,
    tieredPricing: p.tieredPricing || null,
    featured: p.featured ?? false,
    url: p.url || '',
  };
}

// ── Refresh cache ──

async function refreshCache(): Promise<void> {
  try {
    console.log('[strapi] Refreshing product/category cache...');

    // Fetch categories with parent relation
    const strapiCategories = await fetchAllPages<StrapiCategory>(
      '/api/categories?populate=*&sort=sortOrder:asc'
    );

    // Fetch products with category relation
    const strapiProducts = await fetchAllPages<StrapiProduct>(
      '/api/products?populate=*&sort=title:asc'
    );

    // Transform categories
    const categoryMap = new Map<string, StrapiCategory>(); // documentId -> cat
    for (const c of strapiCategories) {
      categoryMap.set(c.documentId, c);
    }

    cachedCategories = strapiCategories.map((c) => {
      const productCount = c.products?.length || 0;
      // For parents: sum children's product counts
      let count = productCount;
      if (c.children && c.children.length > 0 && productCount === 0) {
        count = c.children.reduce((sum, child) => {
          const childCat = strapiCategories.find(sc => sc.slug === child.slug);
          return sum + (childCat?.products?.length || 0);
        }, 0);
      }

      return {
        id: c.externalId || c.id,
        slug: c.slug,
        name: c.name,
        description: c.description || '',
        image: c.image || '',
        count,
        url: c.url || '',
        parentId: c.parent ? (categoryMap.get(c.parent.documentId)?.externalId || c.parent.id) : null,
        sortOrder: c.sortOrder ?? 0,
      };
    });

    // Transform products
    cachedProducts = strapiProducts.map(mapStrapiProduct);

    cacheTimestamp = Date.now();
    console.log(`[strapi] Cache ready: ${cachedProducts.length} products, ${cachedCategories.length} categories`);
  } catch (err) {
    console.error('[strapi] Cache refresh failed:', err);
  }
}

// Initial load
refreshCache();

// ── Exports ──

export async function fetchAllProducts(): Promise<Product[]> {
  if (!isCacheValid()) await refreshCache();
  return cachedProducts || [];
}

export async function fetchProductById(id: string): Promise<Product | undefined> {
  // First try cache lookup by id or slug
  const products = await fetchAllProducts();
  const match = products.find((p) => p.id === id || p.slug === id);
  if (match) return match;

  // If not in cache, try direct Strapi lookup by slug
  try {
    const res = await strapiGet<StrapiListResponse<StrapiProduct>>(
      `/api/products?filters[slug][$eq]=${encodeURIComponent(id)}&populate=*`
    );
    if (res.data.length > 0) {
      return mapStrapiProduct(res.data[0]);
    }
  } catch {
    // Fall through
  }

  // Try by Strapi document ID
  try {
    const res = await strapiGet<StrapiSingleResponse<StrapiProduct>>(
      `/api/products/${encodeURIComponent(id)}?populate=*`
    );
    if (res.data) {
      return mapStrapiProduct(res.data);
    }
  } catch {
    // Not found
  }

  return undefined;
}

export async function fetchCategories(): Promise<Category[]> {
  if (!isCacheValid()) await refreshCache();
  return cachedCategories || [];
}

// ── Page content ──

interface StrapiPage {
  title: string;
  slug: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
}

export async function fetchPageBySlug(slug: string): Promise<{ title: string; content: string; seoTitle: string; seoDescription: string } | null> {
  try {
    const res = await strapiGet<StrapiListResponse<StrapiPage>>(
      `/api/pages?filters[slug][$eq]=${encodeURIComponent(slug)}`
    );
    if (res.data.length === 0) return null;
    const page = res.data[0];
    return {
      title: page.title || '',
      content: page.content || '',
      seoTitle: page.seoTitle || '',
      seoDescription: page.seoDescription || '',
    };
  } catch {
    return null;
  }
}

// ── Site settings ──

export async function fetchSiteSettings(): Promise<Record<string, unknown> | null> {
  try {
    const res = await strapiGet<StrapiSingleResponse<Record<string, unknown>>>(
      '/api/site-setting'
    );
    return res.data || null;
  } catch {
    return null;
  }
}

// ── Orders ──

export interface OrderLine {
  productId: string;
  title: string;
  sku: string;
  qty: number;
  unitPrice: number;
  variantSelections?: Record<string, string>;
}

export interface CreateOrderInput {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerZip: string;
  customerCity: string;
  customerCompany?: string;
  lines: OrderLine[];
  deliveryMethod: string;
  notes?: string;
  discountCode?: string;
}

export async function createOrder(input: CreateOrderInput): Promise<{ orderNumber: string; total: number }> {
  const orderNumber = `GRU-${Date.now()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

  const subtotal = input.lines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0);
  const total = subtotal; // Discount logic can be added later

  await strapiPost('/api/orders', {
    data: {
      orderNumber,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      customerAddress: input.customerAddress,
      customerZip: input.customerZip,
      customerCity: input.customerCity,
      customerCompany: input.customerCompany || '',
      lines: input.lines,
      deliveryMethod: input.deliveryMethod,
      notes: input.notes || '',
      discountCode: input.discountCode || '',
      subtotal,
      total,
      status: 'pending',
    },
  });

  return { orderNumber, total };
}

// Backward compat
export async function fetchAllMachines(): Promise<Product[]> {
  return fetchAllProducts();
}

export async function fetchMachineById(id: number): Promise<Product | undefined> {
  return fetchProductById(String(id));
}
