/**
 * Data source — reads directly from PostgreSQL via Drizzle ORM.
 * Replaces the former Strapi CMS client.
 */

import { eq, asc, and, sql } from "drizzle-orm";
import { db } from "./db";
import { wcGet, wcPost } from "./woocommerce";
import {
  products as productsTable,
  categories as categoriesTable,
  orders as ordersTable,
  pages as pagesTable,
  siteSettings as siteSettingsTable,
} from "../shared/schema";

// ── Interfaces (kept identical to former strapi.ts exports) ──

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
  unit: "bigbag" | "saek" | "stk" | "m3";
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

// ── Helpers ──

/** Decode common HTML entities that may exist in imported WooCommerce data */
function decodeEntities(str: string): string {
  if (!str) return str;
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8211;/g, "\u2013")
    .replace(/&#8212;/g, "\u2014")
    .replace(/&#8217;/g, "\u2019")
    .replace(/&#8230;/g, "\u2026");
}

/** Decode HTML entities inside variant option names */
function decodeVariants(variants: VariantGroup[] | null): VariantGroup[] | null {
  if (!variants) return null;
  return variants.map((vg) => ({
    ...vg,
    label: decodeEntities(vg.label),
    options: vg.options.map((opt) => ({
      ...opt,
      name: decodeEntities(opt.name),
    })),
  }));
}

// ── Cache ──

let cachedProducts: Product[] | null = null;
let cachedCategories: Category[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 min

function isCacheValid(): boolean {
  return cachedProducts !== null && Date.now() - cacheTimestamp < CACHE_TTL;
}

// ── Build cache from DB ──

async function refreshCache(): Promise<void> {
  try {
    console.log("[db] Refreshing product/category cache...");

    // Fetch all categories ordered by sortOrder
    const dbCategories = await db
      .select()
      .from(categoriesTable)
      .orderBy(asc(categoriesTable.sortOrder));

    // Fetch product counts per category
    const countRows = await db
      .select({
        categoryId: productsTable.categoryId,
        count: sql<number>`count(*)::int`,
      })
      .from(productsTable)
      .groupBy(productsTable.categoryId);

    const countMap = new Map<number, number>();
    for (const row of countRows) {
      if (row.categoryId != null) {
        countMap.set(row.categoryId, Number(row.count));
      }
    }

    // Build category list with counts (parents sum children when they have 0 direct products)
    cachedCategories = dbCategories.map((c) => {
      let count = countMap.get(c.id) || 0;

      // If parent category has no direct products, sum children
      if (count === 0 && c.parentId === null) {
        const childIds = dbCategories
          .filter((ch) => ch.parentId === c.id)
          .map((ch) => ch.id);
        count = childIds.reduce((sum, childId) => sum + (countMap.get(childId) || 0), 0);
      }

      return {
        id: c.id,
        slug: c.slug,
        name: decodeEntities(c.name),
        description: decodeEntities(c.description || ""),
        image: c.image || "",
        count,
        url: `/shop/${c.slug}`,
        parentId: c.parentId ?? null,
        sortOrder: c.sortOrder ?? 0,
      };
    });

    // Fetch all products with their category info via a join
    const dbProducts = await db
      .select({
        p: productsTable,
        catName: categoriesTable.name,
        catSlug: categoriesTable.slug,
      })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .orderBy(asc(productsTable.title));

    cachedProducts = dbProducts.map(({ p, catName, catSlug }) => ({
      id: String(p.id),
      title: decodeEntities(p.title),
      slug: p.slug || "",
      sku: p.sku || "",
      basePrice: Number(p.basePrice),
      salePrice: p.salePrice != null ? Number(p.salePrice) : null,
      currency: p.currency || "DKK",
      image: p.image || "",
      images: (p.images as string[]) || [],
      category: decodeEntities(catName || ""),
      categorySlug: catSlug || "",
      description: decodeEntities(p.description || ""),
      weight: p.weight || "",
      volume: p.volume || "",
      unit: (p.unit as Product["unit"]) || "stk",
      deliveryIncluded: p.deliveryIncluded ?? false,
      variants: decodeVariants(p.variants as VariantGroup[] | null),
      tieredPricing: (p.tieredPricing as TieredPrice[] | null) || null,
      featured: p.featured ?? false,
      url: `/produkt/${p.slug}`,
    }));

    cacheTimestamp = Date.now();
    console.log(
      `[db] Cache ready: ${cachedProducts.length} products, ${cachedCategories.length} categories`
    );
  } catch (err) {
    console.error("[db] Cache refresh failed:", err);
  }
}

// Initial load
refreshCache();

// ── Exported data-fetching functions ──

export async function fetchAllProducts(): Promise<Product[]> {
  if (!isCacheValid()) await refreshCache();
  return cachedProducts || [];
}

export async function fetchProductById(id: string): Promise<Product | undefined> {
  // Try cache first (by slug or numeric id)
  const products = await fetchAllProducts();
  const match = products.find((p) => p.slug === id || p.id === id);
  if (match) return match;

  // Direct DB lookup by slug
  const bySlug = await db
    .select({
      p: productsTable,
      catName: categoriesTable.name,
      catSlug: categoriesTable.slug,
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .where(eq(productsTable.slug, id))
    .limit(1);

  if (bySlug.length > 0) {
    const { p, catName, catSlug } = bySlug[0];
    return mapDbProduct(p, catName, catSlug);
  }

  // Try by numeric id
  const numericId = Number(id);
  if (!isNaN(numericId)) {
    const byId = await db
      .select({
        p: productsTable,
        catName: categoriesTable.name,
        catSlug: categoriesTable.slug,
      })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .where(eq(productsTable.id, numericId))
      .limit(1);

    if (byId.length > 0) {
      const { p, catName, catSlug } = byId[0];
      return mapDbProduct(p, catName, catSlug);
    }
  }

  return undefined;
}

export async function fetchCategories(): Promise<Category[]> {
  if (!isCacheValid()) await refreshCache();
  return cachedCategories || [];
}

export async function fetchPageBySlug(
  slug: string
): Promise<{ title: string; content: string; seoTitle: string; seoDescription: string } | null> {
  try {
    const rows = await db
      .select()
      .from(pagesTable)
      .where(and(eq(pagesTable.slug, slug), eq(pagesTable.published, true)))
      .limit(1);

    if (rows.length === 0) return null;
    const page = rows[0];
    return {
      title: page.title || "",
      content: page.content || "",
      seoTitle: page.seoTitle || "",
      seoDescription: page.seoDescription || "",
    };
  } catch {
    return null;
  }
}

export async function fetchSiteSettings(): Promise<Record<string, unknown> | null> {
  try {
    const rows = await db.select().from(siteSettingsTable).limit(1);
    if (rows.length === 0) return null;
    // Return the row as a plain object
    return rows[0] as unknown as Record<string, unknown>;
  } catch {
    return null;
  }
}

interface WcOrderResponse {
  id: number;
  number: string;
  status: string;
  total: string;
  payment_url: string;
}

export async function createOrder(
  input: CreateOrderInput
): Promise<{ orderId: number; orderNumber: string; total: number; paymentUrl: string }> {
  const [firstName, ...lastParts] = input.customerName.split(" ");
  const lastName = lastParts.join(" ") || firstName;

  // Create order in WooCommerce
  const wcOrder = await wcPost<WcOrderResponse>("/orders", {
    payment_method: "worldline",
    payment_method_title: "Worldline",
    set_paid: false,
    status: "pending",
    billing: {
      first_name: firstName,
      last_name: lastName,
      email: input.customerEmail,
      phone: input.customerPhone,
      address_1: input.customerAddress,
      postcode: input.customerZip,
      city: input.customerCity,
      company: input.customerCompany || "",
      country: "DK",
    },
    shipping: {
      first_name: firstName,
      last_name: lastName,
      address_1: input.customerAddress,
      postcode: input.customerZip,
      city: input.customerCity,
      company: input.customerCompany || "",
      country: "DK",
    },
    line_items: input.lines.map((line) => ({
      product_id: Number(line.productId),
      quantity: line.qty,
    })),
    customer_note: input.notes || "",
  });

  const subtotal = input.lines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0);
  const total = parseFloat(wcOrder.total) || subtotal;

  // Save a local copy in PostgreSQL
  await db.insert(ordersTable).values({
    orderNumber: String(wcOrder.number),
    wcOrderId: wcOrder.id,
    paymentUrl: wcOrder.payment_url || "",
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
    customerAddress: input.customerAddress || "",
    customerZip: input.customerZip || "",
    customerCity: input.customerCity || "",
    customerCompany: input.customerCompany || "",
    lines: input.lines,
    deliveryMethod: (["bigbag", "tipvogn", "afhentning"].includes(input.deliveryMethod)
      ? input.deliveryMethod
      : "bigbag") as "bigbag" | "tipvogn" | "afhentning",
    subtotal: String(subtotal),
    total: String(total),
    status: "modtaget",
    notes: input.notes || "",
    discountCode: input.discountCode || "",
  });

  return {
    orderId: wcOrder.id,
    orderNumber: String(wcOrder.number),
    total,
    paymentUrl: wcOrder.payment_url || "",
  };
}

// ── Internal helper ──

function mapDbProduct(
  p: typeof productsTable.$inferSelect,
  catName: string | null,
  catSlug: string | null
): Product {
  return {
    id: String(p.id),
    title: decodeEntities(p.title),
    slug: p.slug || "",
    sku: p.sku || "",
    basePrice: Number(p.basePrice),
    salePrice: p.salePrice != null ? Number(p.salePrice) : null,
    currency: p.currency || "DKK",
    image: p.image || "",
    images: (p.images as string[]) || [],
    category: decodeEntities(catName || ""),
    categorySlug: catSlug || "",
    description: decodeEntities(p.description || ""),
    weight: p.weight || "",
    volume: p.volume || "",
    unit: (p.unit as Product["unit"]) || "stk",
    deliveryIncluded: p.deliveryIncluded ?? false,
    variants: decodeVariants(p.variants as VariantGroup[] | null),
    tieredPricing: (p.tieredPricing as TieredPrice[] | null) || null,
    featured: p.featured ?? false,
    url: `/produkt/${p.slug}`,
  };
}

// ── WooCommerce REST API v3 sync ──

interface WcCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  count: number;
  image: { src: string } | null;
}

interface WcProduct {
  id: number;
  name: string;
  slug: string;
  type: string;
  sku: string;
  description: string;
  short_description: string;
  regular_price: string;
  sale_price: string;
  price: string;
  images: { id: number; src: string }[];
  categories: { id: number; name: string; slug: string }[];
  variations: number[];
  stock_status: string;
  featured: boolean;
}

interface WcVariation {
  id: number;
  regular_price: string;
  sale_price: string;
  price: string;
  attributes: { id: number; name: string; option: string }[];
  stock_status: string;
}

/** Strip HTML tags from a string */
function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "").trim();
}

/** Parse a WC REST API v3 price string (major units, e.g. "249.00") */
function parseWcPrice(priceStr: string): number {
  const num = parseFloat(priceStr);
  return isNaN(num) ? 0 : num;
}

/**
 * Fetch ALL products from WC REST API v3, handling pagination.
 */
async function fetchAllWcProducts(): Promise<WcProduct[]> {
  const all: WcProduct[] = [];
  let page = 1;

  while (true) {
    console.log(`[wc-sync] Syncing products (page ${page})...`);
    const batch = await wcGet<WcProduct[]>("/products", {
      per_page: "100",
      page: String(page),
    });
    if (batch.length === 0) break;
    all.push(...batch);
    page++;
  }

  return all;
}

/**
 * Build variant groups from WC variation details, similar to the seed script logic.
 */
function buildVariantsFromWc(
  product: WcProduct,
  variations: WcVariation[],
  basePrice: number
): VariantGroup[] | null {
  if (variations.length === 0) return null;

  // Detect attribute names from variations
  const allAttrNames = new Set<string>();
  for (const v of variations) {
    for (const a of v.attributes) {
      allAttrNames.add(a.name);
    }
  }
  const variantLabel = allAttrNames.values().next().value || "Maengde";

  const options: VariantOption[] = variations.map((v) => {
    const vPrice = parseWcPrice(v.price);
    const attrValue = v.attributes.length > 0 ? v.attributes[0].option : "";

    // Format label: convert slugs to readable text
    let label = attrValue || `Variation ${v.id}`;
    label = label
      .replace(/-/g, " ")
      .replace(/m3/gi, "m\u00b3")
      .replace(/(\d+)\s*l(?=\s|\d|$)/gi, "$1 liter ")
      .replace(/\b0(\d)\s*m\u00b3?(?=\s|\d|$)/gi, (_m: string, d: string) => `0,${d} m\u00b3`)
      .replace(/\b(\d+)\s*m\u00b3?(?=\s|$)/gi, "$1 m\u00b3")
      .replace(/(\d+)\s*kg/gi, "$1 kg")
      .replace(/\s{2,}/g, " ")
      .trim();

    return {
      name: label,
      priceDiff: Math.round((vPrice - basePrice) * 100) / 100,
      inStock: v.stock_status === "instock",
    };
  });

  return [{ label: variantLabel, options }];
}

/**
 * Sync all categories and products from WooCommerce REST API v3 into PostgreSQL.
 * Upserts on the wcId column, then refreshes the in-memory cache.
 */
export async function syncFromWooCommerce(): Promise<void> {
  console.log("[wc-sync] Syncing categories...");

  // ── 1. Fetch and upsert categories ──
  const wcCats = await wcGet<WcCategory[]>("/products/categories", { per_page: "100" });

  // Separate root and child categories, insert roots first so we can resolve parent PG IDs
  const roots = wcCats.filter((c) => c.parent === 0);
  const children = wcCats.filter((c) => c.parent !== 0);
  const sortedCats = [...roots, ...children];

  // Map from WC category ID -> PostgreSQL ID
  const catMap = new Map<number, number>();

  for (let index = 0; index < sortedCats.length; index++) {
    const cat = sortedCats[index];
    const parentPgId = cat.parent !== 0 ? catMap.get(cat.parent) : null;

    // First, try to link existing row by slug (for initial migration from non-WC data)
    const existing = await db
      .select({ id: categoriesTable.id })
      .from(categoriesTable)
      .where(eq(categoriesTable.slug, cat.slug))
      .limit(1);

    let pgId: number;
    if (existing.length > 0) {
      // Update existing row, set wcId + fresh data
      await db
        .update(categoriesTable)
        .set({
          wcId: cat.id,
          name: cat.name,
          image: cat.image?.src || "",
          sortOrder: index,
          parentId: parentPgId ?? null,
        })
        .where(eq(categoriesTable.slug, cat.slug));
      pgId = existing[0].id;
    } else {
      // Insert new row
      const [result] = await db
        .insert(categoriesTable)
        .values({
          wcId: cat.id,
          name: cat.name,
          slug: cat.slug,
          image: cat.image?.src || "",
          sortOrder: index,
          parentId: parentPgId ?? null,
        })
        .onConflictDoUpdate({
          target: categoriesTable.wcId,
          set: {
            name: cat.name,
            slug: cat.slug,
            image: cat.image?.src || "",
            sortOrder: index,
            parentId: parentPgId ?? null,
          },
        })
        .returning();
      pgId = result.id;
    }

    catMap.set(cat.id, pgId);
  }

  console.log(`[wc-sync] Upserted ${catMap.size} categories`);

  // ── 2. Fetch and upsert products (paginated) ──
  const wcProducts = await fetchAllWcProducts();
  let productCount = 0;

  for (const product of wcProducts) {
    const regularPrice = parseWcPrice(product.regular_price);
    const effectivePrice = parseWcPrice(product.price);
    const salePrice = parseWcPrice(product.sale_price);

    const basePrice = regularPrice || effectivePrice;

    // Fetch variation details for variable products
    let variants: VariantGroup[] | null = null;
    if (product.type === "variable" && product.variations.length > 0) {
      try {
        const variationDetails = await wcGet<WcVariation[]>(
          `/products/${product.id}/variations`,
          { per_page: "100" }
        );
        variants = buildVariantsFromWc(product, variationDetails, basePrice);
      } catch (err: any) {
        console.warn(`[wc-sync] Could not fetch variations for product ${product.id}: ${err.message}`);
      }
    }

    // Resolve category PG ID
    let categoryId: number | null = null;
    for (const cat of product.categories) {
      const pgId = catMap.get(cat.id);
      if (pgId) {
        categoryId = pgId;
        break;
      }
    }

    const description = stripHtml(product.description || product.short_description || "");

    const values = {
      wcId: product.id,
      title: product.name,
      slug: product.slug,
      sku: product.sku || "",
      basePrice: basePrice.toFixed(2),
      salePrice: salePrice > 0 && salePrice < basePrice ? salePrice.toFixed(2) : null,
      description,
      unit: "bigbag" as const,
      deliveryIncluded: true,
      featured: product.featured,
      image: product.images.length > 0 ? product.images[0].src : "",
      images: product.images.map((img) => img.src),
      variants,
      categoryId,
    };

    // Try to link existing row by slug (for initial migration)
    const existingProduct = await db
      .select({ id: productsTable.id })
      .from(productsTable)
      .where(eq(productsTable.slug, product.slug))
      .limit(1);

    if (existingProduct.length > 0) {
      await db
        .update(productsTable)
        .set({
          wcId: product.id,
          title: values.title,
          sku: values.sku,
          basePrice: values.basePrice,
          salePrice: values.salePrice,
          description: values.description,
          unit: values.unit,
          deliveryIncluded: values.deliveryIncluded,
          featured: values.featured,
          image: values.image,
          images: values.images,
          variants: values.variants,
          categoryId: values.categoryId,
        })
        .where(eq(productsTable.slug, product.slug));
    } else {
      await db
        .insert(productsTable)
        .values(values)
        .onConflictDoUpdate({
          target: productsTable.wcId,
          set: {
            title: values.title,
            slug: values.slug,
            sku: values.sku,
            basePrice: values.basePrice,
            salePrice: values.salePrice,
            description: values.description,
            unit: values.unit,
            deliveryIncluded: values.deliveryIncluded,
            featured: values.featured,
            image: values.image,
            images: values.images,
            variants: values.variants,
            categoryId: values.categoryId,
          },
        });
    }

    productCount++;
  }

  console.log(`[wc-sync] Sync complete: ${productCount} products, ${catMap.size} categories`);

  // ── 3. Refresh in-memory cache ──
  await refreshCache();
}
