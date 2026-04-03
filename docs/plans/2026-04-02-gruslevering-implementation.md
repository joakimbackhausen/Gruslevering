# Gruslevering.dk Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the Impetu ApS maskinhandel project into a premium e-commerce site for Gruslevering.dk (Kærvang Materialer ApS) selling gravel, sand, stone, mulch and garden materials.

**Architecture:** Strapi CMS as sole data source. One-time scraper imports products from gruslevering.dk's WooCommerce Store API into Strapi. Express backend serves Strapi data to React frontend. Green-themed premium UI with product variants, volume calculator, and multi-step checkout.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Framer Motion, Express.js, Strapi 5, Wouter, TanStack Query, React Hook Form, Zod.

---

## Task 1: Update Branding & CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`
- Modify: `package.json`

**Step 1: Update CLAUDE.md with Gruslevering info**

Replace all Impetu references with Kærvang Materialer ApS info:
- Company: Kærvang Materialer ApS
- Website: gruslevering.dk
- Address: Tylstrupvej 1, 9382 Tylstrup
- Phone: +45 72 49 44 44
- Email: Info@kaervangmaterialer.dk
- Colors: `#3f9b3f` (grøn, primær) + `#1a1a2e` (neutral dark, header) + `#f8f9fa` (neutral bg)
- Product source: WooCommerce Store API → Strapi CMS
- Update routes section to match new routes
- Update API section for Strapi-only data source

**Step 2: Update package.json**

Change `name` from `maskinhandel` to `gruslevering`.

**Step 3: Commit**

```bash
git add CLAUDE.md package.json
git commit -m "chore: update branding to Gruslevering / Kærvang Materialer"
```

---

## Task 2: Update Color Theme & Fonts

**Files:**
- Modify: `client/src/index.css`

**Step 1: Replace Impetu color variables**

Replace the CSS custom properties:

```css
/* Remove these */
--impetu-red: #E30613;
--impetu-red-hover: #C00511;
--impetu-dark: #2D3748;
--impetu-text: #1a1a1a;
--impetu-header: #3D4F65;

/* Add these */
--grus-green: #3f9b3f;
--grus-green-hover: #2d7a2d;
--grus-green-light: #e8f5e8;
--grus-dark: #1a1a2e;
--grus-text: #1a1a1a;
--grus-bg: #f8f9fa;
--grus-accent: #f59e0b;
```

**Step 2: Update Tailwind theme HSL values**

Update the `@theme` block primary color from dark navy to green:
```
--color-primary: oklch(0.55 0.18 142); /* #3f9b3f green */
```

Update accent to warm amber:
```
--color-accent: oklch(0.78 0.15 75); /* #f59e0b */
```

**Step 3: Update font from Outfit to Plus Jakarta Sans**

Gruslevering.dk uses Plus Jakarta Sans. Update `--font-sans` and the Google Fonts import in `client/index.html`.

**Step 4: Commit**

```bash
git add client/src/index.css client/index.html
git commit -m "style: replace Impetu red theme with Gruslevering green"
```

---

## Task 3: Update Strapi Content Types

**Files:**
- Modify: `cms/src/api/product/content-types/product/schema.json`
- Modify: `cms/src/api/category/content-types/category/schema.json`
- Create: `cms/src/api/order/content-types/order/schema.json`
- Create: `cms/src/api/order/routes/order.js`
- Create: `cms/src/api/order/controllers/order.js`
- Create: `cms/src/api/order/services/order.js`
- Create: `cms/src/api/page/content-types/page/schema.json`
- Create: `cms/src/api/page/routes/page.js`
- Create: `cms/src/api/page/controllers/page.js`
- Create: `cms/src/api/page/services/page.js`
- Create: `cms/src/api/site-setting/content-types/site-setting/schema.json`
- Create: `cms/src/api/site-setting/routes/site-setting.js`
- Create: `cms/src/api/site-setting/controllers/site-setting.js`
- Create: `cms/src/api/site-setting/services/site-setting.js`

**Step 1: Update Product schema**

Add variant fields to product schema. The `variants` field is a JSON field storing variant groups:

```json
{
  "kind": "collectionType",
  "collectionName": "products",
  "info": {
    "singularName": "product",
    "pluralName": "products",
    "displayName": "Product"
  },
  "options": { "draftAndPublish": true },
  "attributes": {
    "title": { "type": "string", "required": true },
    "slug": { "type": "uid", "targetField": "title" },
    "sku": { "type": "string" },
    "description": { "type": "richtext" },
    "basePrice": { "type": "decimal", "required": true },
    "salePrice": { "type": "decimal" },
    "currency": { "type": "string", "default": "DKK" },
    "weight": { "type": "string" },
    "volume": { "type": "string" },
    "unit": { "type": "enumeration", "enum": ["bigbag", "saek", "stk", "m3"], "default": "bigbag" },
    "deliveryIncluded": { "type": "boolean", "default": true },
    "image": { "type": "string" },
    "images": { "type": "json" },
    "variants": { "type": "json" },
    "tieredPricing": { "type": "json" },
    "featured": { "type": "boolean", "default": false },
    "seoTitle": { "type": "string" },
    "seoDescription": { "type": "text" },
    "externalId": { "type": "string", "unique": true },
    "url": { "type": "string" },
    "category": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::category.category",
      "inversedBy": "products"
    }
  }
}
```

Variant JSON structure:
```json
[
  {
    "label": "Mængde",
    "options": [
      { "name": "1000kg", "priceDiff": 0, "skuSuffix": "-1000", "inStock": true },
      { "name": "1700kg (1m³)", "priceDiff": 520, "skuSuffix": "-1700", "inStock": true }
    ]
  }
]
```

Tiered pricing JSON structure:
```json
[
  { "minQty": 1, "maxQty": 1, "price": 1480 },
  { "minQty": 2, "maxQty": 3, "price": 1425 },
  { "minQty": 4, "maxQty": 7, "price": 1325 }
]
```

**Step 2: Update Category schema**

Add `sortOrder` and `description` fields:

```json
{
  "attributes": {
    "name": { "type": "string", "required": true },
    "slug": { "type": "uid", "targetField": "name", "required": true },
    "description": { "type": "text" },
    "image": { "type": "string" },
    "sortOrder": { "type": "integer", "default": 0 },
    "externalId": { "type": "integer", "unique": true },
    "url": { "type": "string" },
    "parent": {
      "type": "relation",
      "relation": "manyToOne",
      "target": "api::category.category",
      "inversedBy": "children"
    },
    "children": {
      "type": "relation",
      "relation": "oneToMany",
      "target": "api::category.category",
      "mappedBy": "parent"
    },
    "products": {
      "type": "relation",
      "relation": "oneToMany",
      "target": "api::product.product",
      "mappedBy": "category"
    }
  }
}
```

**Step 3: Create Order content type**

```json
{
  "kind": "collectionType",
  "collectionName": "orders",
  "info": {
    "singularName": "order",
    "pluralName": "orders",
    "displayName": "Order"
  },
  "options": { "draftAndPublish": false },
  "attributes": {
    "orderNumber": { "type": "string", "required": true, "unique": true },
    "customerName": { "type": "string", "required": true },
    "customerEmail": { "type": "email", "required": true },
    "customerPhone": { "type": "string" },
    "customerAddress": { "type": "text" },
    "customerZip": { "type": "string" },
    "customerCity": { "type": "string" },
    "customerCompany": { "type": "string" },
    "lines": { "type": "json", "required": true },
    "deliveryMethod": {
      "type": "enumeration",
      "enum": ["bigbag", "tipvogn", "afhentning"],
      "default": "bigbag"
    },
    "subtotal": { "type": "decimal" },
    "deliveryFee": { "type": "decimal", "default": 0 },
    "total": { "type": "decimal", "required": true },
    "status": {
      "type": "enumeration",
      "enum": ["modtaget", "bekraeftet", "under_levering", "leveret"],
      "default": "modtaget"
    },
    "notes": { "type": "text" },
    "discountCode": { "type": "string" }
  }
}
```

Order line JSON structure:
```json
[
  {
    "productId": "123",
    "title": "Granitskærver Sort 8-11mm",
    "variant": "1000kg",
    "quantity": 2,
    "unitPrice": 1425,
    "lineTotal": 2850
  }
]
```

**Step 4: Create Page content type**

```json
{
  "kind": "collectionType",
  "collectionName": "pages",
  "info": {
    "singularName": "page",
    "pluralName": "pages",
    "displayName": "Page"
  },
  "options": { "draftAndPublish": true },
  "attributes": {
    "title": { "type": "string", "required": true },
    "slug": { "type": "uid", "targetField": "title", "required": true },
    "content": { "type": "richtext" },
    "seoTitle": { "type": "string" },
    "seoDescription": { "type": "text" }
  }
}
```

**Step 5: Create SiteSettings singleton**

```json
{
  "kind": "singleType",
  "collectionName": "site_settings",
  "info": {
    "singularName": "site-setting",
    "pluralName": "site-settings",
    "displayName": "Site Settings"
  },
  "options": { "draftAndPublish": false },
  "attributes": {
    "companyName": { "type": "string", "default": "Kærvang Materialer ApS" },
    "phone": { "type": "string", "default": "+45 72 49 44 44" },
    "email": { "type": "email", "default": "Info@kaervangmaterialer.dk" },
    "address": { "type": "string", "default": "Tylstrupvej 1, 9382 Tylstrup" },
    "openingHours": { "type": "text" },
    "usps": { "type": "json" },
    "socialMedia": { "type": "json" },
    "trustpilotUrl": { "type": "string" }
  }
}
```

**Step 6: Create route/controller/service files for Order, Page, SiteSettings**

Standard Strapi boilerplate for each (core router, controller, service factory pattern).

**Step 7: Commit**

```bash
git add cms/
git commit -m "feat: add Order, Page, SiteSettings content types + update Product/Category schemas"
```

---

## Task 4: Build Product Import Script

**Files:**
- Create: `script/import-products.ts`

**Step 1: Write the import script**

Script that:
1. Fetches all categories from `https://gruslevering.dk/wp-json/wc/store/v1/products/categories?per_page=100`
2. Creates categories in Strapi (preserving parent/child hierarchy)
3. Paginates all products from `https://gruslevering.dk/wp-json/wc/store/v1/products?per_page=100&page=N`
4. For each `variable` product, fetches each variation by ID from `/wp-json/wc/store/v1/products/{variationId}`
5. Maps WooCommerce `pa_maengde` attribute to our variant JSON structure
6. Prices are in minor units (divide by 100): `"148000"` → `1480.00`
7. Downloads product images from `gruslevering.dk/wp-content/uploads/...`
8. Uploads images to Strapi Media Library via `POST /api/upload`
9. Creates products in Strapi with category relations and variant data
10. Optionally scrapes tiered pricing from product page HTML (`.tiered-pricing-table`)

Key API details:
- WC Store API base: `https://gruslevering.dk/wp-json/wc/store/v1`
- Categories endpoint: `/products/categories?per_page=100`
- Products endpoint: `/products?per_page=100&page=N`
- Single product/variation: `/products/{id}`
- Variation attribute: `pa_maengde` (Mængde/quantity)
- Price field: `prices.price` (string, minor units, divide by 100)
- Images: `images[].src` array

Environment variables needed:
- `STRAPI_URL` (default: `http://localhost:1337`)
- `STRAPI_TOKEN` (Strapi API token with full access)

**Step 2: Add npm script**

Add to package.json:
```json
"import-products": "npx tsx script/import-products.ts"
```

**Step 3: Test by running**

```bash
STRAPI_URL=http://localhost:1337 STRAPI_TOKEN=xxx npm run import-products
```

Expected: Categories and products created in Strapi with images uploaded.

**Step 4: Commit**

```bash
git add script/import-products.ts package.json
git commit -m "feat: add WooCommerce to Strapi product import script"
```

---

## Task 5: Update Server Data Source for New Product Model

**Files:**
- Modify: `server/strapi.ts`
- Modify: `server/data-source.ts`
- Modify: `server/routes.ts`
- Delete (or gut): `server/scraper.ts`

**Step 1: Update Product/Category interfaces**

In `server/strapi.ts`, update the Product interface:

```typescript
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
```

**Step 2: Update Strapi fetch functions**

Update `fetchAllProducts()` and `fetchCategories()` to populate the new fields. Use `?populate=*` to include category relation and all fields.

**Step 3: Simplify data-source.ts**

Remove scraper fallback. Always use Strapi:

```typescript
import { fetchAllProducts, fetchProductById, fetchCategories } from './strapi.js';
export { fetchAllProducts, fetchProductById, fetchCategories };
```

**Step 4: Update routes.ts**

- Add `GET /api/orders` (POST to create order in Strapi)
- Add `POST /api/orders` (create order, generate order number, return confirmation)
- Add `GET /api/pages/:slug` (fetch page content from Strapi)
- Add `GET /api/site-settings` (fetch site settings singleton)
- Update sitemap to use new category slugs
- Remove image-check endpoint (not needed, we control images in Strapi)
- Keep image-proxy if needed for Strapi media

**Step 5: Remove scraper.ts**

Delete or empty out `server/scraper.ts` since we no longer scrape at runtime.

**Step 6: Commit**

```bash
git add server/
git commit -m "feat: update server for Strapi-only data source with variants and orders"
```

---

## Task 6: Redesign Header Component

**Files:**
- Modify: `client/src/components/Header.tsx`

**Step 1: Redesign header**

- Replace Impetu logo/branding with Gruslevering logo
- Green color scheme: `#1a1a2e` header background, `#3f9b3f` accents
- Top bar: phone (+45 72 49 44 44), email, "Fri levering i hele DK" USP
- Navigation: Kategorier (mega dropdown), Volumenberegner, Levering, Om os, Kontakt
- Right side: search icon, cart icon with count badge
- Mobile: hamburger menu with slide-out drawer
- Active link: `border-b-2 border-[#3f9b3f]` (was red)
- Sticky on scroll with backdrop blur

**Step 2: Update all color references**

Replace all `#E30613` and `impetu-red` references with `#3f9b3f` / `grus-green`.

**Step 3: Commit**

```bash
git add client/src/components/Header.tsx
git commit -m "style: redesign header for Gruslevering green branding"
```

---

## Task 7: Redesign Footer Component

**Files:**
- Modify: `client/src/components/Footer.tsx`

**Step 1: Redesign footer**

- Dark background (`#1a1a2e`)
- 4-column layout: Om Kærvang, Kategorier, Kundeservice, Kontakt
- Contact info: Kærvang Materialer ApS details
- Payment icons: Visa, MasterCard, MobilePay
- Trustpilot badge
- Green accent buttons/links
- Copyright: "Kærvang Materialer ApS"

**Step 2: Commit**

```bash
git add client/src/components/Footer.tsx
git commit -m "style: redesign footer for Kærvang Materialer"
```

---

## Task 8: Redesign Home Page

**Files:**
- Modify: `client/src/pages/Home.tsx`

**Step 1: Build premium landing page**

Sections (top to bottom):
1. **Hero** - Full-width image/video of gravel delivery, headline "Grus, sand og sten leveret til døren", CTA "Se produkter"
2. **USP Bar** - 3-4 icons: Fri levering, Hurtig levering, Dansk virksomhed, Siden 2008
3. **Populære kategorier** - Grid of 6 category cards with images, hover animations
4. **Udvalgte produkter** - Carousel of featured products with quick-add
5. **Volumenberegner CTA** - Section promoting the volume calculator tool
6. **Trustpilot/Testimonials** - Customer reviews
7. **Om os** - Short company intro with link to full page

**Step 2: Update Product interface**

Update the imported Product type to match new server interface (basePrice, variants, etc.).

**Step 3: Commit**

```bash
git add client/src/pages/Home.tsx
git commit -m "feat: redesign home page for Gruslevering with premium sections"
```

---

## Task 9: Redesign Product Listing Page (Shop)

**Files:**
- Modify: `client/src/pages/Machines.tsx` → Rename to `client/src/pages/Shop.tsx`

**Step 1: Rename Machines.tsx to Shop.tsx**

Rename file and update all imports in App.tsx.

**Step 2: Build premium product grid**

- Category sidebar/filter (desktop) / filter drawer (mobile)
- Price range filter
- Sort by: Populære, Pris lav-høj, Pris høj-lav, Navn
- Product cards with:
  - Image with hover zoom effect
  - Category badge
  - Title, price (show range if variants), "Fra X kr"
  - Quick-add button (if no variants) or "Se produkt" (if variants)
  - Sale badge if salePrice exists
- Animated grid layout transitions
- Skeleton loading states
- "Ingen produkter fundet" empty state

**Step 3: Update route in App.tsx**

Change component reference from `Machines` to `Shop`.

**Step 4: Commit**

```bash
git add client/src/pages/Shop.tsx client/src/pages/Machines.tsx client/src/App.tsx
git commit -m "feat: redesign product listing as premium Shop page"
```

---

## Task 10: Redesign Product Detail Page

**Files:**
- Modify: `client/src/pages/MachineDetail.tsx` → Rename to `client/src/pages/ProductDetail.tsx`

**Step 1: Rename and rebuild product detail page**

Premium product detail layout:
- **Breadcrumbs** - Home > Kategori > Produkt
- **Image gallery** - Large main image + thumbnail strip, lightbox on click, smooth transitions
- **Product info panel:**
  - Title, SKU
  - Price (updates live when variant selected)
  - Sale badge with crossed-out original price
  - **Variant selector** - Visual grid buttons (not dropdown) for each variant group
  - **Tiered pricing table** - "Køb flere, spar mere" with quantity breaks
  - **Quantity selector** - +/- buttons
  - **Add to cart** - Large green button, sticky at bottom on mobile
  - Delivery info: "Fri levering i hele DK" with truck icon
- **Description** - Rich text product description
- **Related products** - Carousel of same-category products

**Step 2: Variant selection logic**

```typescript
const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

const currentPrice = useMemo(() => {
  let price = product.basePrice;
  for (const group of product.variants ?? []) {
    const selected = selectedVariants[group.label];
    const option = group.options.find(o => o.name === selected);
    if (option) price += option.priceDiff;
  }
  return price;
}, [product, selectedVariants]);
```

**Step 3: Tiered pricing display**

Show table when `tieredPricing` exists. Highlight current tier based on quantity.

**Step 4: Update route in App.tsx**

Change from `MachineDetail` to `ProductDetail`.

**Step 5: Commit**

```bash
git add client/src/pages/ProductDetail.tsx client/src/pages/MachineDetail.tsx client/src/App.tsx
git commit -m "feat: premium product detail page with variant selector and tiered pricing"
```

---

## Task 11: Update Cart Context for Variants

**Files:**
- Modify: `client/src/contexts/CartContext.tsx`

**Step 1: Update CartItem interface**

```typescript
interface CartItem {
  id: string;
  title: string;
  price: number;          // Final price including variant diff
  quantity: number;
  image: string;
  sku?: string;
  variant?: string;       // Display string, e.g. "1000kg"
  variantSelections?: Record<string, string>;  // { "Mængde": "1000kg" }
  unit?: string;          // bigbag, sæk, etc.
}
```

**Step 2: Change localStorage key**

Change from `"impetu-cart"` to `"gruslevering-cart"`.

**Step 3: Update tiered pricing in cart**

When quantity changes, recalculate price based on tiered pricing if available.

**Step 4: Commit**

```bash
git add client/src/contexts/CartContext.tsx
git commit -m "feat: update cart context for product variants and tiered pricing"
```

---

## Task 12: Redesign Checkout Flow

**Files:**
- Modify: `client/src/pages/Checkout.tsx`
- Modify: `client/src/pages/OrderConfirmation.tsx`

**Step 1: Multi-step checkout**

Steps with progress indicator:

1. **Kurv** - Full cart review with variant info, quantity edit, remove items, subtotal
2. **Oplysninger** - Form (React Hook Form + Zod): fornavn, efternavn, email, telefon, firma (optional), adresse, postnr, by
3. **Levering** - Radio selection: Bigbag levering (fri), Tipvogn (pris efter aftale), Afhentning i Tylstrup (gratis)
4. **Bekræftelse** - Full order summary, "Afgiv ordre" button

**Step 2: Order submission**

POST to `/api/orders` with cart items, customer info, delivery method. Return order number.

**Step 3: Order confirmation page**

Show order number, summary, "Vi kontakter dig inden for 24 timer" message, link back to shop.

**Step 4: Commit**

```bash
git add client/src/pages/Checkout.tsx client/src/pages/OrderConfirmation.tsx
git commit -m "feat: multi-step checkout with order creation"
```

---

## Task 13: Build Volume Calculator Page

**Files:**
- Create: `client/src/pages/VolumeCalculator.tsx`
- Modify: `client/src/App.tsx` (add route)

**Step 1: Build interactive calculator**

- Shape selector: Rektangel, Cirkel
- Input fields (meters): længde, bredde, dybde (or radius + dybde for circle)
- Calculate volume in m³
- Recommend number of bigbags based on material density:
  - Grus/sand: ~1.5 ton/m³
  - Granit: ~1.6 ton/m³
  - Muld: ~1.0 ton/m³
  - Flis: ~0.4 ton/m³
- Material type dropdown affects density calculation
- Visual representation of the shape with dimensions
- "Gå til produkter" CTA button with pre-selected category

**Step 2: Add route in App.tsx**

```typescript
<Route path="/volumenberegner" component={VolumeCalculator} />
```

**Step 3: Commit**

```bash
git add client/src/pages/VolumeCalculator.tsx client/src/App.tsx
git commit -m "feat: add interactive volume calculator page"
```

---

## Task 14: Build Delivery Info Page

**Files:**
- Create: `client/src/pages/Delivery.tsx`
- Modify: `client/src/App.tsx` (add route)

**Step 1: Build delivery information page**

Content sections:
- Leveringsmetoder (Bigbag levering, Tipvogn, Afhentning)
- Leveringsområde (hele DK, faste danske øer)
- Leveringstider
- Priser (fri levering for bigbags)
- FAQ om levering

Fetch content from Strapi Page API (`/api/pages/levering`) if available, otherwise hardcode initial content.

**Step 2: Add route**

```typescript
<Route path="/levering" component={Delivery} />
```

**Step 3: Commit**

```bash
git add client/src/pages/Delivery.tsx client/src/App.tsx
git commit -m "feat: add delivery information page"
```

---

## Task 15: Update About & Contact Pages

**Files:**
- Modify: `client/src/pages/About.tsx`
- Modify: `client/src/pages/Contact.tsx`

**Step 1: Update About page**

Replace Impetu content with Kærvang Materialer:
- Established 2008
- Specialist i grus, sand, sten og havematerialer
- Leverer i hele Danmark
- Green color scheme throughout

**Step 2: Update Contact page**

- Kærvang Materialer ApS
- Tylstrupvej 1, 9382 Tylstrup
- +45 72 49 44 44
- Info@kaervangmaterialer.dk
- Åbningstider: Hverdage 8:00-16:00
- Contact form (existing, update styling)
- Embed Google Maps

**Step 3: Commit**

```bash
git add client/src/pages/About.tsx client/src/pages/Contact.tsx
git commit -m "feat: update About and Contact pages for Kærvang Materialer"
```

---

## Task 16: Update App.tsx Routes & Product Types

**Files:**
- Modify: `client/src/App.tsx`
- Create: `client/src/types/product.ts`

**Step 1: Create shared product types**

Create a types file to avoid duplicating Product/Category interfaces across pages:

```typescript
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

// ... (same interfaces as server)
```

**Step 2: Final route configuration**

```typescript
<Route path="/" component={Home} />
<Route path="/shop/:kategori?" component={Shop} />
<Route path="/produkt/:slug" component={ProductDetail} />
<Route path="/volumenberegner" component={VolumeCalculator} />
<Route path="/levering" component={Delivery} />
<Route path="/om-os" component={About} />
<Route path="/kontakt" component={Contact} />
<Route path="/checkout" component={Checkout} />
<Route path="/ordre-bekraeftelse" component={OrderConfirmation} />
```

**Step 3: Commit**

```bash
git add client/src/App.tsx client/src/types/product.ts
git commit -m "feat: finalize routes and shared product types"
```

---

## Task 17: CartDrawer & SmartImage Updates

**Files:**
- Modify: `client/src/components/CartDrawer.tsx`
- Modify: `client/src/components/SmartImage.tsx`

**Step 1: Update CartDrawer**

- Green accent colors
- Show variant info per line item
- Show tiered pricing discount if applicable
- Animated item add/remove
- "Gå til checkout" button in green

**Step 2: Update SmartImage**

- Remove impetu CDN-specific logic
- Support Strapi media URLs
- Keep lazy loading and placeholder functionality

**Step 3: Commit**

```bash
git add client/src/components/CartDrawer.tsx client/src/components/SmartImage.tsx
git commit -m "style: update CartDrawer and SmartImage for Gruslevering"
```

---

## Task 18: Final Polish & Mobile Optimization

**Files:**
- Various component files

**Step 1: Mobile bottom navigation**

Add a mobile-only bottom nav bar with: Home, Shop, Beregner, Kurv icons.

**Step 2: Skeleton loading components**

Add skeleton placeholders for:
- Product grid (card-shaped skeletons)
- Product detail (image + text skeletons)
- Category grid

**Step 3: Page transitions**

Ensure Framer Motion page transitions are smooth across all routes.

**Step 4: SEO meta tags**

Add `<title>` and `<meta description>` per page using document.title or a helmet-like approach.

**Step 5: Commit**

```bash
git add client/
git commit -m "feat: mobile bottom nav, skeleton loading, page transitions, SEO"
```

---

## Task 19: Test & Verify

**Step 1: Run TypeScript check**

```bash
npm run check
```
Expected: No errors.

**Step 2: Run dev server**

```bash
npm run dev
```
Expected: Server starts on port 3000, all pages render.

**Step 3: Start Strapi**

```bash
cd cms && npm run develop
```
Expected: Strapi admin at localhost:1337/admin with new content types.

**Step 4: Run import script**

```bash
STRAPI_URL=http://localhost:1337 STRAPI_TOKEN=xxx npm run import-products
```
Expected: Products imported with variants and images.

**Step 5: Verify all pages**

- Home loads with categories and featured products
- Shop shows products with filtering and sorting
- Product detail shows variants, tiered pricing, add to cart
- Volume calculator works
- Checkout flow completes and creates order in Strapi
- All pages responsive on mobile

**Step 6: Commit any fixes**

```bash
git add .
git commit -m "fix: resolve issues found during testing"
```

---

## Task 20: Production Build & Deploy Config

**Step 1: Test production build**

```bash
npm run build
npm run start
```
Expected: Production server serves all pages correctly.

**Step 2: Update railway.json if needed**

Ensure environment variables are documented:
- `STRAPI_URL`
- `STRAPI_TOKEN`
- `DATABASE_URL`
- `PORT`

**Step 3: Final commit**

```bash
git add .
git commit -m "chore: verify production build and deploy config"
```
