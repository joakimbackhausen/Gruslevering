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
 * Extract Set-Cookie headers from a response, supporting both modern and legacy Node.js.
 */
function getSetCookieHeaders(res: Response): string[] {
  // Modern Node.js (>= 18.14)
  if (typeof res.headers.getSetCookie === "function") {
    return res.headers.getSetCookie();
  }
  // Fallback: raw headers iteration
  const cookies: string[] = [];
  res.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") {
      cookies.push(value);
    }
  });
  // Some implementations join multiple set-cookie headers with ", " — try to split them
  if (cookies.length === 1 && cookies[0].includes(", ")) {
    // Only split on ", " if it's between cookie boundaries (name=value pairs)
    const parts = cookies[0].split(/,\s*(?=[A-Za-z_]+=)/);
    if (parts.length > 1) return parts;
  }
  return cookies;
}

/**
 * Collect cookies from a fetch response as a combined string for forwarding.
 */
function collectCookies(res: Response, existingCookies: string): string {
  const setCookies = getSetCookieHeaders(res);
  if (setCookies.length === 0) return existingCookies;

  // Parse existing cookies into a map
  const cookieMap = new Map<string, string>();
  if (existingCookies) {
    for (const part of existingCookies.split("; ")) {
      const [name, ...rest] = part.split("=");
      if (name) cookieMap.set(name, rest.join("="));
    }
  }
  // Override with new cookies
  for (const sc of setCookies) {
    const cookiePart = sc.split(";")[0];
    const [name, ...rest] = cookiePart.split("=");
    if (name) cookieMap.set(name.trim(), rest.join("="));
  }

  return Array.from(cookieMap.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

/**
 * Decode HTML entities in shipping rate names (e.g. &#8211; → –)
 */
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&#8211;/g, "\u2013")
    .replace(/&#8212;/g, "\u2014")
    .replace(/&#8217;/g, "\u2019")
    .replace(/&#8230;/g, "\u2026")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(Number(code)));
}

/**
 * Calculate available shipping rates by creating a temporary WC Store API cart session.
 * Creates a fresh cart, adds items, sets shipping address, and returns calculated rates.
 * Uses cookies to maintain the cart session across requests.
 */
export async function calculateShippingRates(
  items: CartItem[],
  address: ShippingAddress
): Promise<StoreApiShippingPackage[]> {
  const cartToken = crypto.randomUUID();
  let cookies = "";

  console.log(`[store-api] Calculating shipping for ${items.length} items, zip: ${address.postcode}`);

  // 1. Initialize cart session — GET /cart to obtain nonce + session cookies
  const initRes = await fetch(`${STORE_API_BASE}/cart`, {
    headers: { "Cart-Token": cartToken },
  });
  const nonce = initRes.headers.get("nonce") || "";
  cookies = collectCookies(initRes, cookies);

  if (!nonce) {
    throw new Error("Could not obtain Store API nonce");
  }

  const makeHeaders = (): Record<string, string> => ({
    "Content-Type": "application/json",
    "Cart-Token": cartToken,
    "Nonce": nonce,
    ...(cookies ? { "Cookie": cookies } : {}),
  });

  // 2. Add each item to the cart
  let addedCount = 0;
  for (const item of items) {
    const productId = item.wcVariationId || item.wcProductId;
    const addBody: Record<string, unknown> = {
      id: productId,
      quantity: item.quantity,
    };

    console.log(`[store-api] Adding item: id=${productId} (wcProduct=${item.wcProductId}, wcVariation=${item.wcVariationId || 'none'}), qty=${item.quantity}`);

    const addRes = await fetch(`${STORE_API_BASE}/cart/add-item`, {
      method: "POST",
      headers: makeHeaders(),
      body: JSON.stringify(addBody),
    });

    cookies = collectCookies(addRes, cookies);

    if (!addRes.ok) {
      const text = await addRes.text().catch(() => "");
      console.warn(`[store-api] Failed to add item ${productId}: ${addRes.status} ${text.slice(0, 300)}`);
    } else {
      addedCount++;
    }
  }

  if (addedCount === 0) {
    console.error(`[store-api] No items could be added to cart. Check WC product IDs.`);
    throw new Error("Ingen produkter kunne tilf\u00f8jes til kurven for fragtberegning");
  }

  // 3. Update shipping address to trigger rate calculation
  const updateRes = await fetch(`${STORE_API_BASE}/cart/update-customer`, {
    method: "POST",
    headers: makeHeaders(),
    body: JSON.stringify({
      shipping_address: {
        country: address.country || "DK",
        postcode: address.postcode,
        city: address.city || "",
        address_1: address.address_1 || "",
      },
    }),
  });

  cookies = collectCookies(updateRes, cookies);

  if (!updateRes.ok) {
    const text = await updateRes.text().catch(() => "");
    throw new Error(`Store API update-customer failed: ${updateRes.status} ${text.slice(0, 200)}`);
  }

  const cart = await updateRes.json() as { shipping_rates: StoreApiShippingPackage[] };

  // Decode HTML entities in rate names
  if (cart.shipping_rates) {
    for (const pkg of cart.shipping_rates) {
      for (const rate of pkg.shipping_rates || []) {
        rate.name = decodeHtmlEntities(rate.name);
        rate.description = decodeHtmlEntities(rate.description || "");
      }
    }
  }

  const rateCount = cart.shipping_rates?.[0]?.shipping_rates?.length || 0;
  console.log(`[store-api] Got ${rateCount} shipping rates`);

  return cart.shipping_rates || [];
}

// ── Store API Checkout (creates order + processes payment in one go) ──

export interface CheckoutInput {
  items: CartItem[];
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address_1: string;
    postcode: string;
    city: string;
    company?: string;
    country: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    address_1: string;
    postcode: string;
    city: string;
    company?: string;
    country: string;
  };
  shippingRateId?: string;
  paymentMethod: string;
  customerNote?: string;
  extensions?: Record<string, unknown>;
}

export interface CheckoutResult {
  orderId: number;
  orderNumber: string;
  status: string;
  paymentRedirectUrl: string;
  total: string;
}

/**
 * Full headless checkout via WC Store API.
 * Creates a cart session, adds items, sets addresses, selects shipping,
 * and calls /checkout which processes payment and returns the gateway redirect URL.
 */
export async function storeApiCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const cartToken = crypto.randomUUID();
  let cookies = "";

  console.log(`[store-api-checkout] Starting checkout for ${input.items.length} items`);

  // 1. Initialize cart session
  const initRes = await fetch(`${STORE_API_BASE}/cart`, {
    headers: { "Cart-Token": cartToken },
  });
  const nonce = initRes.headers.get("nonce") || "";
  cookies = collectCookies(initRes, cookies);

  if (!nonce) {
    throw new Error("Could not obtain Store API nonce");
  }

  const makeHeaders = (): Record<string, string> => ({
    "Content-Type": "application/json",
    "Cart-Token": cartToken,
    "Nonce": nonce,
    ...(cookies ? { "Cookie": cookies } : {}),
  });

  // 2. Add items to cart
  let addedCount = 0;
  for (const item of input.items) {
    const productId = item.wcVariationId || item.wcProductId;
    const addRes = await fetch(`${STORE_API_BASE}/cart/add-item`, {
      method: "POST",
      headers: makeHeaders(),
      body: JSON.stringify({ id: productId, quantity: item.quantity }),
    });
    cookies = collectCookies(addRes, cookies);

    if (!addRes.ok) {
      const text = await addRes.text().catch(() => "");
      console.warn(`[store-api-checkout] Failed to add item ${productId}: ${addRes.status} ${text.slice(0, 200)}`);
    } else {
      addedCount++;
    }
  }

  if (addedCount === 0) {
    throw new Error("Ingen produkter kunne tilføjes til kurven");
  }

  // 3. Update customer billing + shipping address
  const updateRes = await fetch(`${STORE_API_BASE}/cart/update-customer`, {
    method: "POST",
    headers: makeHeaders(),
    body: JSON.stringify({
      billing_address: input.billing,
      shipping_address: input.shipping,
    }),
  });
  cookies = collectCookies(updateRes, cookies);

  if (!updateRes.ok) {
    const text = await updateRes.text().catch(() => "");
    console.error(`[store-api-checkout] update-customer failed: ${updateRes.status} ${text.slice(0, 300)}`);
    throw new Error("Kunne ikke opdatere kundeoplysninger");
  }

  // 4. Select shipping rate if provided
  if (input.shippingRateId) {
    const selectRes = await fetch(`${STORE_API_BASE}/cart/select-shipping-rate`, {
      method: "POST",
      headers: makeHeaders(),
      body: JSON.stringify({
        package_id: 0,
        rate_id: input.shippingRateId,
      }),
    });
    cookies = collectCookies(selectRes, cookies);

    if (!selectRes.ok) {
      const text = await selectRes.text().catch(() => "");
      console.warn(`[store-api-checkout] select-shipping-rate failed: ${selectRes.status} ${text.slice(0, 200)}`);
      // Non-fatal — continue with default shipping
    }
  }

  // 5. POST /checkout — creates order + processes payment
  console.log(`[store-api-checkout] Submitting checkout with payment_method=${input.paymentMethod}`);

  const checkoutBody: Record<string, unknown> = {
    billing_address: input.billing,
    shipping_address: input.shipping,
    payment_method: input.paymentMethod,
    payment_data: [],
    customer_note: input.customerNote || "",
  };

  // Add extensions (e.g. pickup point data)
  if (input.extensions) {
    checkoutBody.extensions = input.extensions;
  }

  const checkoutRes = await fetch(`${STORE_API_BASE}/checkout`, {
    method: "POST",
    headers: makeHeaders(),
    body: JSON.stringify(checkoutBody),
  });
  cookies = collectCookies(checkoutRes, cookies);

  const checkoutText = await checkoutRes.text();

  if (!checkoutRes.ok) {
    console.error(`[store-api-checkout] Checkout failed: ${checkoutRes.status} ${checkoutText.slice(0, 500)}`);
    throw new Error(`Checkout fejlede: ${checkoutText.slice(0, 200)}`);
  }

  const result = JSON.parse(checkoutText) as {
    order_id: number;
    order_number?: string;
    status: string;
    order_key?: string;
    payment_result?: {
      payment_status: string;
      payment_details: { key: string; value: string }[];
      redirect_url: string;
    };
    totals?: { total_price: string };
    billing_address?: { email: string };
  };

  const rawRedirectUrl = result.payment_result?.redirect_url || "";
  const orderNumber = result.order_number || String(result.order_id);
  const totalPrice = result.totals?.total_price || "0";

  console.log(`[store-api-checkout] Order #${orderNumber} created (ID: ${result.order_id}), status: ${result.status}`);
  console.log(`[store-api-checkout] Raw redirect URL: ${rawRedirectUrl}`);

  // Rewrite return URLs in the payment gateway redirect to point to our headless frontend
  const redirectUrl = rewritePaymentRedirectUrl(rawRedirectUrl, result.order_id);

  return {
    orderId: result.order_id,
    orderNumber,
    status: result.status,
    paymentRedirectUrl: redirectUrl,
    total: totalPrice,
  };
}

/**
 * Rewrite return/callback URLs in the payment gateway redirect URL
 * so that after payment, the user returns to our headless frontend
 * instead of the WooCommerce site.
 */
function rewritePaymentRedirectUrl(url: string, orderId: number): string {
  if (!url) return url;

  const appUrl = process.env.APP_URL || "";
  if (!appUrl) {
    console.warn("[payment] APP_URL not set — cannot rewrite payment return URLs. Users will return to WooCommerce site.");
    return url;
  }

  const wcUrl = process.env.WC_URL || "https://gruslevering.dk";

  try {
    const parsed = new URL(url);

    // Bambora/Worldline typically uses these query params for return URLs:
    // accepturl, cancelurl, callbackurl, declineurl
    const urlParams = ["accepturl", "cancelurl", "declineurl"];
    let modified = false;

    for (const param of urlParams) {
      const value = parsed.searchParams.get(param);
      if (value && value.includes(wcUrl)) {
        let newValue = value;
        // Replace WC order-received URL with our confirmation page
        if (param === "accepturl") {
          newValue = `${appUrl}/ordre-bekraeftelse?order_id=${orderId}`;
        } else if (param === "cancelurl" || param === "declineurl") {
          newValue = `${appUrl}/checkout?cancelled=true&order_id=${orderId}`;
        }
        parsed.searchParams.set(param, newValue);
        modified = true;
        console.log(`[payment] Rewrote ${param}: ${value.slice(0, 80)}... → ${newValue}`);
      }
    }

    // Also check if the URL itself (not params) contains encoded return URLs
    // Some gateways encode the return URL in the path or hash
    if (!modified) {
      // Try replacing WC URLs in the full URL string
      let urlStr = url;
      const wcEncoded = encodeURIComponent(wcUrl);

      // Replace encoded WC order-received URLs
      const orderReceivedPattern = new RegExp(
        wcEncoded.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[^&]*order-received[^&]*',
        'gi'
      );
      if (orderReceivedPattern.test(urlStr)) {
        urlStr = urlStr.replace(orderReceivedPattern, encodeURIComponent(`${appUrl}/ordre-bekraeftelse?order_id=${orderId}`));
        modified = true;
      }

      // Replace encoded WC cart/cancel URLs
      const cancelPattern = new RegExp(
        wcEncoded.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[^&]*cancel_order[^&]*',
        'gi'
      );
      if (cancelPattern.test(urlStr)) {
        urlStr = urlStr.replace(cancelPattern, encodeURIComponent(`${appUrl}/checkout?cancelled=true&order_id=${orderId}`));
        modified = true;
      }

      if (modified) {
        console.log("[payment] Rewrote encoded return URLs in payment redirect");
        return urlStr;
      }
    }

    return modified ? parsed.toString() : url;
  } catch {
    console.warn("[payment] Could not parse redirect URL for rewriting:", url.slice(0, 100));
    return url;
  }
}
