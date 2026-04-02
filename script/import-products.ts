/**
 * Import products from gruslevering.dk (WooCommerce Store API) into Strapi CMS.
 *
 * Usage:
 *   STRAPI_TOKEN=<token> npm run import-products
 *
 * Environment variables:
 *   STRAPI_URL   - Strapi base URL (default: http://localhost:1337)
 *   STRAPI_TOKEN - Strapi API token with full access (required)
 *   DRY_RUN      - Set to "true" to skip Strapi writes and just log what would happen
 */

const WC_BASE = "https://gruslevering.dk/wp-json/wc/store/v1";
const STRAPI_URL = process.env.STRAPI_URL || "http://localhost:1337";
const STRAPI_TOKEN = process.env.STRAPI_TOKEN;
const DRY_RUN = process.env.DRY_RUN === "true";

if (!STRAPI_TOKEN && !DRY_RUN) {
  console.error("ERROR: STRAPI_TOKEN environment variable is required (or set DRY_RUN=true)");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function wcFetch<T>(path: string): Promise<T> {
  const url = `${WC_BASE}${path}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`WC API ${res.status} for ${url}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

async function strapiPost<T = any>(endpoint: string, data: Record<string, any>): Promise<T> {
  if (DRY_RUN) {
    console.log(`  [DRY RUN] POST ${endpoint}`, JSON.stringify(data).slice(0, 200));
    return { data: { id: 0, documentId: `dry-run-${Date.now()}` } } as T;
  }
  const res = await fetch(`${STRAPI_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${STRAPI_TOKEN}`,
    },
    body: JSON.stringify({ data }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Strapi POST ${endpoint} ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// WooCommerce types (subset)
// ---------------------------------------------------------------------------

interface WcCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  count: number;
  image?: { src?: string };
}

interface WcProductImage {
  id: number;
  src: string;
  name: string;
  alt: string;
}

interface WcProductPrices {
  price: string;
  regular_price: string;
  sale_price: string;
  currency_code: string;
}

interface WcVariation {
  id: number;
  attributes: { name: string; value: string }[];
}

interface WcProduct {
  id: number;
  name: string;
  slug: string;
  type: string;
  sku: string;
  description: string;
  short_description: string;
  permalink: string;
  prices: WcProductPrices;
  images: WcProductImage[];
  categories: { id: number; name: string; slug: string }[];
  variations: WcVariation[];
  is_in_stock: boolean;
}

interface StrapiResponse {
  data: { id: number; documentId: string };
}

// ---------------------------------------------------------------------------
// 1. Fetch all WC categories
// ---------------------------------------------------------------------------

async function fetchCategories(): Promise<WcCategory[]> {
  console.log("Fetching categories from WooCommerce...");
  const cats = await wcFetch<WcCategory[]>("/products/categories?per_page=100");
  console.log(`  Found ${cats.length} categories`);
  return cats;
}

// ---------------------------------------------------------------------------
// 2. Create categories in Strapi (root first, then children)
// ---------------------------------------------------------------------------

async function createCategories(
  wcCategories: WcCategory[]
): Promise<Map<number, string>> {
  console.log("\nCreating categories in Strapi...");

  // Map from WC category ID -> Strapi documentId
  const catMap = new Map<number, string>();

  // Separate root and child categories
  const roots = wcCategories.filter((c) => c.parent === 0);
  const children = wcCategories.filter((c) => c.parent !== 0);

  // Create root categories first
  for (const [i, cat] of roots.entries()) {
    try {
      const payload: Record<string, any> = {
        name: cat.name,
        slug: cat.slug,
        externalId: cat.id.toString(),
        sortOrder: i,
      };
      if (cat.image?.src) {
        payload.image = cat.image.src;
      }

      const result = await strapiPost<StrapiResponse>("/api/categories", payload);
      catMap.set(cat.id, result.data.documentId);
      console.log(`  [OK] Root category: ${cat.name} (${cat.slug})`);
    } catch (err: any) {
      console.error(`  [FAIL] Root category ${cat.name}: ${err.message}`);
    }
    await delay(100);
  }

  // Create child categories (link to parent)
  for (const [i, cat] of children.entries()) {
    try {
      const parentDocId = catMap.get(cat.parent);
      const payload: Record<string, any> = {
        name: cat.name,
        slug: cat.slug,
        externalId: cat.id.toString(),
        sortOrder: roots.length + i,
      };
      if (cat.image?.src) {
        payload.image = cat.image.src;
      }
      if (parentDocId) {
        payload.parent = parentDocId;
      }

      const result = await strapiPost<StrapiResponse>("/api/categories", payload);
      catMap.set(cat.id, result.data.documentId);
      console.log(`  [OK] Child category: ${cat.name} -> parent ${cat.parent}`);
    } catch (err: any) {
      console.error(`  [FAIL] Child category ${cat.name}: ${err.message}`);
    }
    await delay(100);
  }

  console.log(`  Total categories created: ${catMap.size}/${wcCategories.length}`);
  return catMap;
}

// ---------------------------------------------------------------------------
// 3. Fetch all products (paginated)
// ---------------------------------------------------------------------------

async function fetchAllProducts(): Promise<WcProduct[]> {
  console.log("\nFetching products from WooCommerce...");
  const all: WcProduct[] = [];
  let page = 1;

  while (true) {
    const batch = await wcFetch<WcProduct[]>(`/products?per_page=100&page=${page}`);
    if (batch.length === 0) break;
    all.push(...batch);
    console.log(`  Page ${page}: ${batch.length} products (total: ${all.length})`);
    page++;
    await delay(300);
  }

  console.log(`  Total products fetched: ${all.length}`);
  return all;
}

// ---------------------------------------------------------------------------
// 4. Fetch variation details for variable products
// ---------------------------------------------------------------------------

interface VariationDetail {
  id: number;
  name: string;
  prices: WcProductPrices;
  is_in_stock: boolean;
  attributes: { name: string; value: string }[];
}

async function fetchVariationDetails(
  variationIds: number[]
): Promise<VariationDetail[]> {
  const details: VariationDetail[] = [];

  for (const id of variationIds) {
    try {
      const v = await wcFetch<VariationDetail>(`/products/${id}`);
      details.push(v);
    } catch (err: any) {
      console.warn(`    [WARN] Could not fetch variation ${id}: ${err.message}`);
    }
    await delay(200);
  }

  return details;
}

// ---------------------------------------------------------------------------
// 5. Map WC product -> Strapi product payload
// ---------------------------------------------------------------------------

function minorToMajor(priceStr: string): number {
  const num = parseInt(priceStr, 10);
  if (isNaN(num)) return 0;
  return num / 100;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function buildStrapiProduct(
  product: WcProduct,
  variationDetails: VariationDetail[],
  catMap: Map<number, string>
): Record<string, any> {
  const basePrice = minorToMajor(product.prices.price);
  const regularPrice = minorToMajor(product.prices.regular_price);
  const salePrice = minorToMajor(product.prices.sale_price);

  const payload: Record<string, any> = {
    title: product.name,
    slug: product.slug,
    sku: product.sku || undefined,
    basePrice: regularPrice || basePrice,
    description: stripHtml(product.description || product.short_description || ""),
    externalId: product.id.toString(),
    url: product.permalink,
    unit: "bigbag",
    deliveryIncluded: true,
    featured: false,
    status: "published",
  };

  // Sale price (only if different from regular)
  if (salePrice > 0 && salePrice < regularPrice) {
    payload.salePrice = salePrice;
  }

  // Images
  if (product.images.length > 0) {
    payload.image = product.images[0].src;
    payload.images = product.images.map((img) => img.src);
  }

  // Category (use the first matching category)
  if (product.categories.length > 0) {
    for (const cat of product.categories) {
      const docId = catMap.get(cat.id);
      if (docId) {
        payload.category = docId;
        break;
      }
    }
  }

  // Variants for variable products
  if (product.type === "variable" && variationDetails.length > 0) {
    const basePriceValue = regularPrice || basePrice;
    const options = variationDetails.map((v) => {
      const vPrice = minorToMajor(v.prices.price);
      const label =
        v.attributes.find((a) => a.name === "pa_maengde" || a.name === "Mængde")
          ?.value || v.name;

      return {
        name: label,
        priceDiff: Math.round((vPrice - basePriceValue) * 100) / 100,
        inStock: v.is_in_stock,
      };
    });

    payload.variants = [
      {
        label: "Mængde",
        options,
      },
    ];
  }

  return payload;
}

// ---------------------------------------------------------------------------
// 6. Create products in Strapi
// ---------------------------------------------------------------------------

async function createProducts(
  products: WcProduct[],
  catMap: Map<number, string>
): Promise<void> {
  console.log(`\nCreating ${products.length} products in Strapi...`);

  let success = 0;
  let failed = 0;

  for (const [i, product] of products.entries()) {
    try {
      // Fetch variation details for variable products
      let variationDetails: VariationDetail[] = [];
      if (product.type === "variable" && product.variations.length > 0) {
        const varIds = product.variations.map((v) => v.id);
        console.log(
          `  [${i + 1}/${products.length}] Fetching ${varIds.length} variations for "${product.name}"...`
        );
        variationDetails = await fetchVariationDetails(varIds);
      }

      const payload = buildStrapiProduct(product, variationDetails, catMap);

      await strapiPost("/api/products", payload);
      success++;
      console.log(
        `  [${i + 1}/${products.length}] OK: "${product.name}" (${product.type}, ${payload.basePrice} DKK)`
      );
    } catch (err: any) {
      failed++;
      console.error(
        `  [${i + 1}/${products.length}] FAIL: "${product.name}": ${err.message}`
      );
    }
    await delay(150);
  }

  console.log(`\nProducts done: ${success} created, ${failed} failed out of ${products.length}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== Gruslevering.dk -> Strapi Product Import ===");
  console.log(`WooCommerce API: ${WC_BASE}`);
  console.log(`Strapi URL:      ${STRAPI_URL}`);
  console.log(`Dry run:         ${DRY_RUN}`);
  console.log("");

  // 1. Fetch categories
  const wcCategories = await fetchCategories();

  // 2. Create categories in Strapi
  const catMap = await createCategories(wcCategories);

  // 3. Fetch all products
  const wcProducts = await fetchAllProducts();

  // 4-6. Create products (variation fetching happens per product)
  await createProducts(wcProducts, catMap);

  console.log("\n=== Import complete ===");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
