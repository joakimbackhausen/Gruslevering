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
const STORE_API_BASE = `${WC_URL}/wp-json/wc/store/v1`;

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

// ── WooCommerce Store API (for shipping rate calculation) ──

export interface StoreApiShippingRate {
  rate_id: string;        // e.g. "table_rate:15:4"
  name: string;           // e.g. "Kranlevering 2-7 hverdage"
  description: string;
  delivery_time: string;
  price: string;          // in minor units (øre), e.g. "28500" = 285 kr
  instance_id: number;
  method_id: string;      // e.g. "table_rate", "shipmondo", "local_pickup"
  meta_data: { key: string; value: string }[];
  selected: boolean;
  currency_code: string;
  currency_symbol: string;
  currency_minor_unit: number;
  currency_decimal_separator: string;
  currency_thousand_separator: string;
  currency_prefix: string;
  currency_suffix: string;
}

export interface StoreApiShippingPackage {
  package_id: number;
  name: string;
  destination: {
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  items: { key: string; name: string; quantity: number }[];
  shipping_rates: StoreApiShippingRate[];
}

interface CartItem {
  wcProductId: number;
  wcVariationId?: number;
  quantity: number;
}

interface ShippingAddress {
  address_1?: string;
  city?: string;
  postcode: string;
  country?: string;
}

/**
 * Calculate available shipping rates by creating a temporary WC Store API cart session.
 * Creates a fresh cart, adds items, sets shipping address, and returns calculated rates.
 */
export async function calculateShippingRates(
  items: CartItem[],
  address: ShippingAddress
): Promise<StoreApiShippingPackage[]> {
  // Generate a unique cart token for this calculation session
  const cartToken = crypto.randomUUID();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Cart-Token": cartToken,
  };

  console.log(`[store-api] Calculating shipping for ${items.length} items, zip: ${address.postcode}`);

  // 1. Add each item to the cart
  for (const item of items) {
    const addBody: Record<string, unknown> = {
      id: item.wcVariationId || item.wcProductId,
      quantity: item.quantity,
    };

    const addRes = await fetch(`${STORE_API_BASE}/cart/add-item`, {
      method: "POST",
      headers,
      body: JSON.stringify(addBody),
    });

    if (!addRes.ok) {
      const text = await addRes.text().catch(() => "");
      console.warn(`[store-api] Failed to add item ${item.wcProductId}: ${addRes.status} ${text.slice(0, 200)}`);
      // Continue with other items — partial cart is better than no cart
    }
  }

  // 2. Update shipping address to trigger rate calculation
  const updateRes = await fetch(`${STORE_API_BASE}/cart/update-customer`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      shipping_address: {
        country: address.country || "DK",
        postcode: address.postcode,
        city: address.city || "",
        address_1: address.address_1 || "",
      },
    }),
  });

  if (!updateRes.ok) {
    const text = await updateRes.text().catch(() => "");
    throw new Error(`Store API update-customer failed: ${updateRes.status} ${text.slice(0, 200)}`);
  }

  // 3. Get the cart with calculated shipping rates
  const cartRes = await fetch(`${STORE_API_BASE}/cart`, { headers });
  if (!cartRes.ok) {
    const text = await cartRes.text().catch(() => "");
    throw new Error(`Store API get cart failed: ${cartRes.status} ${text.slice(0, 200)}`);
  }

  const cart = await cartRes.json() as { shipping_rates: StoreApiShippingPackage[] };

  console.log(`[store-api] Got ${cart.shipping_rates?.[0]?.shipping_rates?.length || 0} shipping rates`);

  return cart.shipping_rates || [];
}
