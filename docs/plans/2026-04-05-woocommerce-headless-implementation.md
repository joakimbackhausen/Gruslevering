# WooCommerce Headless Integration - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate Gruslevering.dk to use WooCommerce as a headless CMS/backend for products, orders, and payments (Worldline), keeping PostgreSQL as a read cache.

**Architecture:** Express API middleware sits between React frontend and WooCommerce REST API v3. Products/categories are cached in PostgreSQL (synced every 10 min). Orders are created in WooCommerce via REST API. Checkout redirects to Worldline for payment, then back to order confirmation.

**Tech Stack:** WooCommerce REST API v3, Express.js, PostgreSQL/Drizzle ORM, React/TanStack Query, Worldline payment gateway

---

### Task 1: WooCommerce REST API Client

**Files:**
- Create: `server/woocommerce.ts`

**Step 1: Create the WC API client module**

```typescript
/**
 * WooCommerce REST API v3 client.
 * Uses HTTP Basic Auth with consumer key/secret over HTTPS.
 */

const WC_URL = process.env.WC_URL || "https://gruslevering.dk";
const WC_KEY = process.env.WC_CONSUMER_KEY || "";
const WC_SECRET = process.env.WC_CONSUMER_SECRET || "";

if (!WC_KEY || !WC_SECRET) {
  console.warn("[wc] WARNING: WC_CONSUMER_KEY or WC_CONSUMER_SECRET not set");
}

const BASE = `${WC_URL}/wp-json/wc/v3`;

function authHeader(): string {
  return "Basic " + Buffer.from(`${WC_KEY}:${WC_SECRET}`).toString("base64");
}

export async function wcGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: authHeader() },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`WC API ${res.status} ${path}: ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

export async function wcPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`WC API POST ${res.status} ${path}: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}

export async function wcPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "PUT",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`WC API PUT ${res.status} ${path}: ${text.slice(0, 200)}`);
  }
  return res.json() as Promise<T>;
}
```

**Step 2: Verify the client works**

Run: `npx tsx -e "import { wcGet } from './server/woocommerce'; wcGet('/products', { per_page: '1' }).then(d => console.log('OK:', JSON.stringify(d).slice(0, 200))).catch(e => console.error('FAIL:', e.message))"`

Expected: OK with a product JSON snippet, confirming auth works.

**Step 3: Commit**

```bash
git add server/woocommerce.ts
git commit -m "feat: add WooCommerce REST API v3 client with Basic Auth"
```

---

### Task 2: Add `wcId` columns to schema

**Files:**
- Modify: `shared/schema.ts:24-60` (categories + products tables)

**Step 1: Add wcId to categories and products tables**

In `shared/schema.ts`, add `wcId` integer column to both tables:

```typescript
// In categories table (after id):
wcId: integer("wc_id").unique(),

// In products table (after id):
wcId: integer("wc_id").unique(),
```

**Step 2: Push schema changes to DB**

Run: `npx drizzle-kit push`

Expected: Migration applies, adds `wc_id` columns.

**Step 3: Commit**

```bash
git add shared/schema.ts
git commit -m "feat: add wcId columns for WooCommerce entity mapping"
```

---

### Task 3: Rewrite product/category sync to use WC REST API v3

**Files:**
- Modify: `server/data-source.ts` (replace refreshCache with WC REST API sync)

**Step 1: Update refreshCache to fetch from WC REST API v3**

Replace the `refreshCache()` function in `server/data-source.ts`. The new version:
1. Fetches categories from `wcGet<WcCategory[]>("/products/categories", { per_page: "100" })`
2. Fetches products (paginated) from `wcGet<WcProduct[]>("/products", { per_page: "100", page: String(page) })`
3. Upserts into PostgreSQL tables using `onConflictDoUpdate` on `wcId`
4. Then builds the in-memory cache from the DB (as before)

Key WC REST API v3 response shapes (different from Store API):

```typescript
// WC REST API v3 category
interface WcCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  count: number;
  image: { src: string } | null;
}

// WC REST API v3 product
interface WcProduct {
  id: number;
  name: string;
  slug: string;
  type: string;
  sku: string;
  description: string;
  short_description: string;
  regular_price: string;   // "249.00" (major units, not minor!)
  sale_price: string;       // "" or "199.00"
  price: string;            // current effective price
  images: { id: number; src: string }[];
  categories: { id: number; name: string; slug: string }[];
  variations: number[];     // just IDs in REST API v3
  stock_status: string;
  featured: boolean;
}
```

**Important difference from Store API:** REST API v3 prices are in major units (e.g. `"249.00"`), NOT minor units. Remove the `/ 100` conversion from the import logic.

Import `wcGet` from `./woocommerce` at the top of `data-source.ts`.

Add a new exported function `syncFromWooCommerce()` that:
1. Fetches all categories from WC, upserts to DB with `wcId`
2. Fetches all products (paginated), upserts to DB with `wcId`
3. Calls existing `refreshCache()` to rebuild in-memory cache from DB

**Step 2: Verify sync works**

Run: `npm run dev` and check console output for sync messages.

**Step 3: Commit**

```bash
git add server/data-source.ts
git commit -m "feat: sync products/categories from WooCommerce REST API v3"
```

---

### Task 4: Add periodic sync timer

**Files:**
- Modify: `server/index.ts:57-97` (add sync interval after server starts)

**Step 1: Import and call sync on startup + interval**

After `registerRoutes(httpServer, app)` in `server/index.ts`, add:

```typescript
import { syncFromWooCommerce } from "./data-source";

// After registerRoutes:
// Initial sync from WooCommerce
syncFromWooCommerce().catch(err => console.error("[wc] Initial sync failed:", err));

// Periodic sync every 10 minutes
setInterval(() => {
  syncFromWooCommerce().catch(err => console.error("[wc] Periodic sync failed:", err));
}, 10 * 60 * 1000);
```

**Step 2: Verify periodic sync**

Run: `npm run dev` — should see sync log messages on startup.

**Step 3: Commit**

```bash
git add server/index.ts
git commit -m "feat: add periodic WooCommerce product sync every 10 minutes"
```

---

### Task 5: Create WooCommerce order endpoint

**Files:**
- Modify: `server/routes.ts:62-84` (replace local order creation)
- Modify: `server/data-source.ts` (update createOrder to post to WC)

**Step 1: Update createOrder to create order in WooCommerce**

Replace the `createOrder` function in `data-source.ts` to:
1. POST to WooCommerce `/orders` with billing/shipping info and line items
2. Set `payment_method: "worldline"` and `status: "pending"`
3. Save a local copy in PostgreSQL `orders` table (with `wcOrderId` for reference)
4. Return the WC order ID and payment URL

WooCommerce order creation payload:

```typescript
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
  line_items: input.lines.map(line => ({
    product_id: Number(line.productId),
    quantity: line.qty,
  })),
  customer_note: input.notes || "",
});
```

**Step 2: Update the order route response**

The route handler in `routes.ts` should return `{ orderId, orderNumber, paymentUrl }` so the frontend can redirect to Worldline.

**Step 3: Commit**

```bash
git add server/data-source.ts server/routes.ts
git commit -m "feat: create orders in WooCommerce via REST API"
```

---

### Task 6: Add checkout payment redirect endpoint

**Files:**
- Modify: `server/routes.ts` (add GET `/api/orders/:id/payment-url`)

**Step 1: Add payment URL endpoint**

After order creation, the frontend needs the Worldline payment URL. Add endpoint:

```typescript
// GET /api/orders/:id — fetch order from WooCommerce
app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await wcGet<any>(`/orders/${req.params.id}`);
    res.json({
      id: order.id,
      status: order.status,
      total: order.total,
      paymentUrl: order.payment_url || null,
      orderNumber: order.number,
    });
  } catch (err) {
    console.error('Error fetching WC order:', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});
```

**Step 2: Commit**

```bash
git add server/routes.ts
git commit -m "feat: add order status endpoint via WooCommerce"
```

---

### Task 7: Update Checkout.tsx for payment redirect flow

**Files:**
- Modify: `client/src/pages/Checkout.tsx:100-158` (submitOrder function)

**Step 1: Update submitOrder to handle payment redirect**

Change `submitOrder()` to:
1. POST to `/api/orders` (same as before, but now returns WC order + payment URL)
2. If `paymentUrl` is returned, redirect the browser to Worldline: `window.location.href = paymentUrl`
3. If no payment URL (e.g., pickup/free), redirect to order confirmation

```typescript
const result = await res.json();

if (result.paymentUrl) {
  // Redirect to Worldline payment page
  window.location.href = result.paymentUrl;
} else {
  // No payment needed (free order / pickup)
  navigate(`/ordre-bekraeftelse?order_id=${result.orderId}`);
}
```

**Step 2: Commit**

```bash
git add client/src/pages/Checkout.tsx
git commit -m "feat: redirect to Worldline payment after order creation"
```

---

### Task 8: Update OrderConfirmation page

**Files:**
- Modify: `client/src/pages/OrderConfirmation.tsx` (fetch order status from WC)

**Step 1: Update to fetch order status from WC**

The order confirmation page should:
1. Read `order_id` from URL query params (Worldline redirects back with this)
2. Fetch order status from `/api/orders/:id`
3. Display order number, status, and total
4. Clear the cart on successful payment

```typescript
const searchParams = new URLSearchParams(window.location.search);
const orderId = searchParams.get('order_id');

const { data: order } = useQuery({
  queryKey: ['order', orderId],
  queryFn: () => fetch(`/api/orders/${orderId}`).then(r => r.json()),
  enabled: !!orderId,
});
```

**Step 2: Commit**

```bash
git add client/src/pages/OrderConfirmation.tsx
git commit -m "feat: fetch order confirmation from WooCommerce"
```

---

### Task 9: Add wcOrderId to orders table + update schema

**Files:**
- Modify: `shared/schema.ts:63-83` (orders table)

**Step 1: Add wcOrderId and paymentUrl columns**

```typescript
// In orders table, add after orderNumber:
wcOrderId: integer("wc_order_id"),
paymentUrl: text("payment_url").default(""),
```

**Step 2: Push schema**

Run: `npx drizzle-kit push`

**Step 3: Commit**

```bash
git add shared/schema.ts
git commit -m "feat: add wcOrderId and paymentUrl to orders schema"
```

---

### Task 10: Update import-products.ts to use REST API v3

**Files:**
- Modify: `script/import-products.ts` (switch from Store API to REST API v3)

**Step 1: Update the seed script**

Change `WC_BASE` from Store API to REST API v3 and use authenticated requests:

```typescript
import { wcGet } from "../server/woocommerce";
```

Replace `wcFetch` calls with `wcGet` calls. Update price parsing to handle major units (REST API v3 returns `"249.00"` not `"24900"`).

Remove `minorToMajor()` — prices are already in major units. Use `parseFloat()` instead.

Populate the new `wcId` column when inserting categories and products.

**Step 2: Verify seed works**

Run: `npm run seed` (on a fresh DB or with upsert logic)

**Step 3: Commit**

```bash
git add script/import-products.ts
git commit -m "refactor: update seed script to use WC REST API v3 with auth"
```

---

### Task 11: Update CLAUDE.md with new architecture

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Update architecture description**

Add WooCommerce headless architecture info:
- WooCommerce REST API v3 as primary backend
- PostgreSQL as cache layer (synced every 10 min)
- Worldline payment flow
- New environment variables: `WC_URL`, `WC_CONSUMER_KEY`, `WC_CONSUMER_SECRET`
- New file: `server/woocommerce.ts`

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with WooCommerce headless architecture"
```

---

### Task 12: End-to-end verification

**Step 1: Start dev server and verify product listing**

Run: `npm run dev`

Open browser, verify products load from WC-synced cache.

**Step 2: Test order flow**

1. Add product to cart
2. Go through checkout
3. Verify WooCommerce order is created (check WC admin)
4. Verify Worldline redirect (if payment gateway is configured)

**Step 3: Verify periodic sync**

Wait 10 minutes or trigger manual sync, verify new/updated products appear.
