/**
 * Seed products from gruslevering.dk (WooCommerce REST API v3) into PostgreSQL via Drizzle ORM.
 *
 * Usage:
 *   DATABASE_URL=postgresql://localhost:5432/gruslevering npm run seed
 *
 * Environment variables:
 *   DATABASE_URL       - PostgreSQL connection string (required unless DRY_RUN)
 *   WC_CONSUMER_KEY    - WooCommerce REST API consumer key (required)
 *   WC_CONSUMER_SECRET - WooCommerce REST API consumer secret (required)
 *   DRY_RUN            - Set to "true" to skip DB writes and just log what would happen
 */

import { db } from "../server/db";
import { categories, products, users, siteSettings } from "../shared/schema";
import { wcGet } from "../server/woocommerce";
import bcrypt from "bcrypt";

const DRY_RUN = process.env.DRY_RUN === "true";

if (!process.env.DATABASE_URL && !DRY_RUN) {
  console.error("ERROR: DATABASE_URL environment variable is required (or set DRY_RUN=true)");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// WooCommerce types (REST API v3)
// ---------------------------------------------------------------------------

interface WcCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  count: number;
  image?: { src?: string } | null;
}

interface WcProductImage {
  id: number;
  src: string;
  name: string;
  alt: string;
}

interface WcVariation {
  id: number;
  regular_price: string;
  sale_price: string;
  price: string;
  attributes: { id: number; name: string; option: string }[];
  stock_status: string;
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
  regular_price: string;
  sale_price: string;
  price: string;
  images: WcProductImage[];
  categories: { id: number; name: string; slug: string }[];
  variations: number[];
  stock_status: string;
}

// ---------------------------------------------------------------------------
// 1. Fetch all WC categories
// ---------------------------------------------------------------------------

async function fetchCategories(): Promise<WcCategory[]> {
  console.log("Fetching categories from WooCommerce...");
  const all: WcCategory[] = [];
  let page = 1;
  const perPage = 100;

  while (true) {
    try {
      const batch = await wcGet<WcCategory[]>("/products/categories", {
        per_page: String(perPage),
        page: String(page),
      });
      if (batch.length === 0) break;
      all.push(...batch);
      console.log(`  Page ${page}: ${batch.length} categories (total: ${all.length})`);
      if (batch.length < perPage) break; // last page
      page++;
    } catch {
      // WC returns 400 for out-of-range pages — we're done
      break;
    }
  }

  console.log(`  Found ${all.length} categories total`);
  return all;
}

// ---------------------------------------------------------------------------
// 2. Create categories in PostgreSQL (root first, then children)
// ---------------------------------------------------------------------------

async function createCategories(
  wcCategories: WcCategory[]
): Promise<Map<number, number>> {
  console.log("\nCreating categories in PostgreSQL...");

  // Map from WC category ID -> PostgreSQL ID
  const catMap = new Map<number, number>();

  // Separate root and child categories
  const roots = wcCategories.filter((c) => c.parent === 0);
  const children = wcCategories.filter((c) => c.parent !== 0);

  // Create root categories first
  for (const [i, cat] of roots.entries()) {
    try {
      const payload = {
        wcId: cat.id,
        name: cat.name,
        slug: cat.slug,
        image: cat.image?.src || "",
        sortOrder: i,
        parentId: null as number | null,
      };

      if (DRY_RUN) {
        console.log(`  [DRY RUN] INSERT category`, JSON.stringify(payload).slice(0, 200));
        catMap.set(cat.id, 0);
      } else {
        const [result] = await db.insert(categories).values(payload).returning();
        catMap.set(cat.id, result.id);
      }
      console.log(`  [OK] Root category: ${cat.name} (${cat.slug})`);
    } catch (err: any) {
      console.error(`  [FAIL] Root category ${cat.name}: ${err.message}`);
    }
  }

  // Create child categories (link to parent)
  for (const [i, cat] of children.entries()) {
    try {
      const parentPgId = catMap.get(cat.parent);
      const payload = {
        wcId: cat.id,
        name: cat.name,
        slug: cat.slug,
        image: cat.image?.src || "",
        sortOrder: roots.length + i,
        parentId: parentPgId ?? null,
      };

      if (DRY_RUN) {
        console.log(`  [DRY RUN] INSERT category`, JSON.stringify(payload).slice(0, 200));
        catMap.set(cat.id, 0);
      } else {
        const [result] = await db.insert(categories).values(payload).returning();
        catMap.set(cat.id, result.id);
      }
      console.log(`  [OK] Child category: ${cat.name} -> parent ${cat.parent}`);
    } catch (err: any) {
      console.error(`  [FAIL] Child category ${cat.name}: ${err.message}`);
    }
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
  const perPage = 100;

  while (true) {
    try {
      const batch = await wcGet<WcProduct[]>("/products", {
        per_page: String(perPage),
        page: String(page),
        status: "publish",
      });
      if (batch.length === 0) break;
      all.push(...batch);
      console.log(`  Page ${page}: ${batch.length} products (total: ${all.length})`);
      if (batch.length < perPage) break; // last page
      page++;
      await delay(300);
    } catch {
      // WC returns 400 for out-of-range pages — we're done
      break;
    }
  }

  console.log(`  Total products fetched: ${all.length}`);
  return all;
}

// ---------------------------------------------------------------------------
// 4. Fetch variation details for variable products
// ---------------------------------------------------------------------------

async function fetchVariationDetails(
  productId: number
): Promise<WcVariation[]> {
  const all: WcVariation[] = [];
  let page = 1;
  const perPage = 100;

  try {
    while (true) {
      const batch = await wcGet<WcVariation[]>(
        `/products/${productId}/variations`,
        { per_page: String(perPage), page: String(page) }
      );
      if (batch.length === 0) break;
      all.push(...batch);
      if (batch.length < perPage) break;
      page++;
    }
  } catch (err: any) {
    // If we already got some variations, return them; otherwise warn
    if (all.length === 0) {
      console.warn(`    [WARN] Could not fetch variations for product ${productId}: ${err.message}`);
    }
  }
  return all;
}

// ---------------------------------------------------------------------------
// 5. Transform WC product -> DB product payload
// ---------------------------------------------------------------------------

function decodeEntities(str: string): string {
  return str
    .replace(/&#8211;/g, "\u2013")
    .replace(/&#8212;/g, "\u2014")
    .replace(/&#8217;/g, "\u2019")
    .replace(/&#8230;/g, "\u2026")
    .replace(/&#215;/g, "\u00d7")
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripHtml(html: string): string {
  return decodeEntities(
    html.replace(/<[^>]*>/g, "")
  ).trim();
}

function buildProductPayload(
  product: WcProduct,
  variationDetails: WcVariation[],
  catMap: Map<number, number>,
  wcParentCatIds: Set<number>
): Record<string, any> {
  const basePrice = parseFloat(product.price) || 0;
  const regularPrice = parseFloat(product.regular_price) || 0;
  const salePrice = parseFloat(product.sale_price) || 0;

  const payload: Record<string, any> = {
    wcId: product.id,
    title: decodeEntities(product.name),
    slug: product.slug,
    sku: product.sku || "",
    basePrice: (regularPrice || basePrice).toFixed(2),
    description: stripHtml(product.description || product.short_description || ""),
    unit: "bigbag" as const,
    deliveryIncluded: true,
    featured: false,
  };

  // Sale price (only if different from regular)
  if (salePrice > 0 && salePrice < regularPrice) {
    payload.salePrice = salePrice.toFixed(2);
  }

  // Images
  if (product.images.length > 0) {
    payload.image = product.images[0].src;
    payload.images = product.images.map((img) => img.src);
  }

  // Category — prefer child (most specific) categories over parents
  if (product.categories.length > 0) {
    let fallbackId: number | null = null;
    for (const cat of product.categories) {
      const pgId = catMap.get(cat.id);
      if (pgId) {
        if (!wcParentCatIds.has(cat.id)) {
          payload.categoryId = pgId;
          break; // Found a child category, use it
        }
        if (fallbackId === null) fallbackId = pgId;
      }
    }
    // If no child category was found, use parent as fallback
    if (!payload.categoryId && fallbackId) {
      payload.categoryId = fallbackId;
    }
  }

  // Variants for variable products
  if (product.type === "variable" && variationDetails.length > 0) {
    const basePriceValue = regularPrice || basePrice;

    // Detect the primary attribute name (e.g., "Maengde", "Sand", "Stoerrelse")
    const allAttrNames = new Set<string>();
    for (const v of variationDetails) {
      for (const a of v.attributes) {
        allAttrNames.add(a.name);
      }
    }
    const variantLabel = allAttrNames.values().next().value || "Maengde";

    const options = variationDetails.map((v) => {
      const vPrice = parseFloat(v.price) || 0;

      // REST API v3 uses `option` for attribute values
      const attrValue = v.attributes.length > 0 ? v.attributes[0].option : null;

      // Format the label: convert slugs like "1000kg" or "500-l-05m" to readable text
      let label = decodeEntities(attrValue || `Variation ${v.id}`);
      label = label
        .replace(/-/g, " ")
        // Normalize "m3" -> "m\u00b3" first
        .replace(/m3/gi, "m\u00b3")
        // "500l" or "1000l" -> "500 liter" (l followed by space, digit, or end)
        .replace(/(\d+)\s*l(?=\s|\d|$)/gi, "$1 liter ")
        // "05m\u00b3" / "05m" -> "0,5 m\u00b3"  (leading zero means decimal)
        .replace(/\b0(\d)\s*m\u00b3?(?=\s|\d|$)/gi, (_m, d) => `0,${d} m\u00b3`)
        // "1m\u00b3" / "2m\u00b3" / "1m" / "2m" -> "1 m\u00b3" / "2 m\u00b3" (add space)
        .replace(/\b(\d+)\s*m\u00b3?(?=\s|$)/gi, "$1 m\u00b3")
        // "1000kg" -> "1000 kg"
        .replace(/(\d+)\s*kg/gi, "$1 kg")
        // Clean up double/triple spaces
        .replace(/\s{2,}/g, " ")
        .trim();

      return {
        name: label,
        priceDiff: Math.round((vPrice - basePriceValue) * 100) / 100,
        inStock: v.stock_status === "instock",
        wcVariationId: v.id,
      };
    });

    payload.variants = [
      {
        label: variantLabel,
        options,
      },
    ];
  }

  return payload;
}

// ---------------------------------------------------------------------------
// 6. Create products in PostgreSQL
// ---------------------------------------------------------------------------

async function createProducts(
  wcProducts: WcProduct[],
  catMap: Map<number, number>,
  wcParentCatIds: Set<number>
): Promise<void> {
  console.log(`\nCreating ${wcProducts.length} products in PostgreSQL...`);

  let success = 0;
  let failed = 0;

  for (const [i, product] of wcProducts.entries()) {
    try {
      // Fetch variation details for variable products
      let variationDetails: WcVariation[] = [];
      if (product.type === "variable" && product.variations.length > 0) {
        console.log(
          `  [${i + 1}/${wcProducts.length}] Fetching ${product.variations.length} variations for "${product.name}"...`
        );
        variationDetails = await fetchVariationDetails(product.id);
      }

      const payload = buildProductPayload(product, variationDetails, catMap, wcParentCatIds);

      if (DRY_RUN) {
        console.log(`  [DRY RUN] INSERT product`, JSON.stringify(payload).slice(0, 200));
      } else {
        await db.insert(products).values(payload).onConflictDoUpdate({
          target: products.wcId,
          set: {
            title: payload.title,
            slug: payload.slug,
            sku: payload.sku,
            basePrice: payload.basePrice,
            salePrice: payload.salePrice ?? null,
            description: payload.description,
            unit: payload.unit,
            deliveryIncluded: payload.deliveryIncluded,
            image: payload.image,
            images: payload.images,
            variants: payload.variants ?? null,
            featured: payload.featured,
            categoryId: payload.categoryId ?? null,
          },
        });
      }
      success++;
      console.log(
        `  [${i + 1}/${wcProducts.length}] OK: "${product.name}" (${product.type}, ${payload.basePrice} DKK)`
      );
    } catch (err: any) {
      failed++;
      console.error(
        `  [${i + 1}/${wcProducts.length}] FAIL: "${product.name}": ${err.message}`
      );
    }
    await delay(150);
  }

  console.log(`\nProducts done: ${success} created, ${failed} failed out of ${wcProducts.length}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== Gruslevering.dk -> PostgreSQL Product Seed ===");
  console.log(`WooCommerce API: REST API v3 (authenticated)`);
  console.log(`Database:        ${process.env.DATABASE_URL}`);
  console.log(`Dry run:         ${DRY_RUN}`);
  console.log("");

  // 1. Fetch categories
  const wcCategories = await fetchCategories();

  // 2. Create categories in DB
  const catMap = await createCategories(wcCategories);

  // Build set of root/parent category IDs for smarter category assignment
  const wcParentCatIds = new Set(
    wcCategories.filter((c) => c.parent === 0).map((c) => c.id)
  );

  // 3. Fetch all products
  const wcProducts = await fetchAllProducts();

  // 4-6. Create products (variation fetching happens per product)
  await createProducts(wcProducts, catMap, wcParentCatIds);

  // 7. Seed admin user
  if (!DRY_RUN) {
    console.log("\nSeeding admin user...");
    const hashedPassword = await bcrypt.hash("Admin1234!", 10);
    await db.insert(users).values({
      email: "admin@gruslevering.dk",
      password: hashedPassword,
      name: "Admin",
      role: "admin",
    }).onConflictDoNothing();
    console.log("  Admin user: admin@gruslevering.dk / Admin1234!");
  }

  // 8. Seed site settings
  if (!DRY_RUN) {
    console.log("\nSeeding site settings...");
    await db.insert(siteSettings).values({
      companyName: "Kaervang Materialer ApS",
      phone: "+45 72 49 44 44",
      email: "Info@kaervangmaterialer.dk",
      address: "Tylstrupvej 1, 9382 Tylstrup",
      openingHours: "Hverdage 8:00 - 16:00",
    }).onConflictDoNothing();
    console.log("  Site settings seeded.");
  }

  console.log("\n=== Seed complete ===");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
