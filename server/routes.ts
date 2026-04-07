import type { Express } from "express";
import type { Server } from "http";
import {
  fetchAllProducts,
  fetchProductById,
  fetchCategories,
  fetchPageBySlug,
  fetchSiteSettings,
  createOrder,
} from "./data-source";
import type { CreateOrderInput } from "./data-source";
import { wcGet, calculateShippingRates } from "./woocommerce";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // GET /api/products — all products, optional ?category= and ?featured= filters
  app.get('/api/products', async (req, res) => {
    try {
      let products = await fetchAllProducts();
      const category = req.query.category as string | undefined;
      const featured = req.query.featured as string | undefined;

      if (category) {
        products = products.filter(p => p.categorySlug === category);
      }
      if (featured === 'true') {
        products = products.filter(p => p.featured);
      }
      res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
      res.json(products);
    } catch (err) {
      console.error('Error fetching products:', err);
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  });

  // GET /api/products/:id — single product (supports both id and slug)
  app.get('/api/products/:id', async (req, res) => {
    try {
      const product = await fetchProductById(req.params.id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json(product);
    } catch (err) {
      console.error('Error fetching product:', err);
      res.status(500).json({ error: 'Failed to fetch product' });
    }
  });

  // GET /api/categories — category list
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await fetchCategories();
      res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
      res.json(categories);
    } catch (err) {
      console.error('Error fetching categories:', err);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });

  // POST /api/orders — create an order in WooCommerce + local DB
  app.post('/api/orders', async (req, res) => {
    try {
      const input = req.body as CreateOrderInput;

      // Basic validation
      if (!input.customerName || !input.customerEmail || !input.customerPhone) {
        return res.status(400).json({ error: 'Missing required customer fields' });
      }
      if (!input.lines || input.lines.length === 0) {
        return res.status(400).json({ error: 'Order must have at least one line' });
      }
      if (!input.deliveryMethod) {
        return res.status(400).json({ error: 'Missing delivery method' });
      }

      const result = await createOrder(input);
      res.json({
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        total: result.total,
        paymentUrl: result.paymentUrl,
      });
    } catch (err) {
      console.error('Error creating order:', err);
      res.status(500).json({ error: 'Failed to create order' });
    }
  });

  // POST /api/shipping/calculate — calculate available shipping rates via WC Store API
  app.post('/api/shipping/calculate', async (req, res) => {
    try {
      const { items, address } = req.body as {
        items: { wcProductId?: number; wcVariationId?: number; quantity: number; productId?: string }[];
        address: { address_1?: string; city?: string; postcode: string; country?: string };
      };

      if (!items || items.length === 0) {
        return res.status(400).json({ error: 'Cart must have at least one item' });
      }
      if (!address?.postcode) {
        return res.status(400).json({ error: 'Shipping address with postcode is required' });
      }

      // Resolve WC product IDs: if wcProductId is missing, look up from our DB cache
      const allProducts = await fetchAllProducts();
      const resolvedItems = items.map((item) => {
        let wcProductId = item.wcProductId;
        if (!wcProductId && item.productId) {
          const product = allProducts.find((p) => p.id === item.productId);
          if (product?.wcId) wcProductId = product.wcId;
        }
        // If still no wcProductId, try using the number directly (might be PG ID = WC ID in some cases)
        if (!wcProductId) {
          const numId = Number(item.productId || item.wcProductId);
          if (!isNaN(numId)) wcProductId = numId;
        }
        return {
          wcProductId: wcProductId || 0,
          wcVariationId: item.wcVariationId,
          quantity: item.quantity,
        };
      }).filter((i) => i.wcProductId > 0);

      if (resolvedItems.length === 0) {
        return res.status(400).json({ error: 'Could not resolve WooCommerce product IDs' });
      }

      const shippingPackages = await calculateShippingRates(resolvedItems, address);

      // Flatten all rates from all packages and format for frontend
      const rates = shippingPackages.flatMap((pkg) =>
        pkg.shipping_rates.map((rate) => ({
          rateId: rate.rate_id,
          name: rate.name,
          description: rate.description || '',
          methodId: rate.method_id,
          instanceId: rate.instance_id,
          // Price is in minor units (øre) — convert to DKK
          price: parseInt(rate.price, 10) / Math.pow(10, rate.currency_minor_unit || 2),
          priceFormatted:
            parseInt(rate.price, 10) === 0
              ? 'Gratis'
              : `${(parseInt(rate.price, 10) / Math.pow(10, rate.currency_minor_unit || 2)).toLocaleString('da-DK', { minimumFractionDigits: 2 })} kr.`,
          deliveryTime: rate.delivery_time || '',
          selected: rate.selected,
        }))
      );

      res.json({ rates });
    } catch (err) {
      console.error('Error calculating shipping:', err);
      res.status(500).json({ error: 'Failed to calculate shipping rates' });
    }
  });

  // GET /api/orders/:wcId — fetch order status from WooCommerce
  app.get('/api/orders/:wcId', async (req, res) => {
    try {
      const wcId = req.params.wcId;
      const order = await wcGet<any>(`/orders/${wcId}`);
      res.json({
        id: order.id,
        status: order.status,
        total: order.total,
        paymentUrl: order.payment_url || null,
        orderNumber: String(order.number),
      });
    } catch (err) {
      console.error('Error fetching WC order:', err);
      res.status(500).json({ error: 'Failed to fetch order' });
    }
  });

  /**
   * Clean up WordPress HTML so it renders nicely on the frontend.
   * - Converts <div> wrappers to <p> tags
   * - Converts text-bullet lines (•) into proper <ul><li> lists
   * - Converts unicode separator lines (⸻ / ——) into <hr>
   * - Removes empty <div> and <p> tags
   * - Converts standalone <strong> paragraphs into <h3> when they look like headings
   */
  function cleanWpHtml(html: string): string {
    let out = html;

    // 1. Convert bullet lines: <div>•text</div> → collect into <ul><li>
    out = out.replace(
      /(?:<div>\s*[•·–-]\s*(.*?)\s*<\/div>\s*)+/gi,
      (match) => {
        const items = [...match.matchAll(/<div>\s*[•·–-]\s*(.*?)\s*<\/div>/gi)];
        if (items.length === 0) return match;
        const lis = items.map((m) => `<li>${m[1].trim()}</li>`).join('\n');
        return `<ul>\n${lis}\n</ul>`;
      }
    );

    // 2. Convert separator lines to <hr>
    out = out.replace(/<div>\s*[⸻—–]{1,}\s*<\/div>/g, '<hr>');
    out = out.replace(/<p>\s*[⸻—–]{1,}\s*<\/p>/g, '<hr>');

    // 3. Remove empty <div></div> tags
    out = out.replace(/<div>\s*<\/div>/g, '');

    // 4. Convert remaining <div>content</div> to <p>content</p>
    // but skip divs that contain block-level elements
    out = out.replace(
      /<div>((?:(?!<(?:div|h[1-6]|ul|ol|table|blockquote|figure|hr)[ >])[\s\S])*?)<\/div>/gi,
      (_, content) => {
        const trimmed = content.trim();
        if (!trimmed) return '';
        return `<p>${trimmed}</p>`;
      }
    );

    // 5. Convert standalone <p><strong>Text</strong></p> to <h3> if it looks like a heading
    // (strong is the only child, text is short, no period at end)
    out = out.replace(
      /<p>\s*<strong>(.*?)<\/strong>\s*<\/p>/gi,
      (match, text) => {
        const clean = text.replace(/<[^>]*>/g, '').trim();
        // If it's short (< 120 chars) and doesn't end with period → likely a heading
        if (clean.length < 120 && !clean.endsWith('.') && !clean.endsWith(':')) {
          return `<h3>${text}</h3>`;
        }
        return match;
      }
    );

    // 6. Remove <strong> wrapping inside h2 (WP often does <h2><strong>...</strong></h2>)
    out = out.replace(
      /<h2>\s*<strong>(.*?)<\/strong>\s*<\/h2>/gi,
      '<h2>$1</h2>'
    );

    // 7. Remove empty <p></p>
    out = out.replace(/<p>\s*<\/p>/g, '');

    return out.trim();
  }

  // GET /api/articles/:slug — fetch WordPress blog post by slug (cached 1 hour)
  const articleCache = new Map<string, { data: any; ts: number }>();
  const ARTICLE_CACHE_TTL = 60 * 60 * 1000; // 1 hour

  app.get('/api/articles/:slug', async (req, res) => {
    const { slug } = req.params;
    try {
      // Check cache
      const cached = articleCache.get(slug);
      if (cached && Date.now() - cached.ts < ARTICLE_CACHE_TTL) {
        return res.json(cached.data);
      }

      const WC_URL = process.env.WC_URL || 'https://gruslevering.dk';
      const wpRes = await fetch(
        `${WC_URL}/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&_fields=id,slug,title,content,excerpt,featured_media,date`
      );
      if (!wpRes.ok) {
        return res.status(502).json({ error: 'Failed to fetch article from WordPress' });
      }
      const posts = await wpRes.json() as any[];
      if (posts.length === 0) {
        return res.status(404).json({ error: 'Article not found' });
      }

      const post = posts[0];

      // Fetch featured image if available
      let featuredImage = '';
      if (post.featured_media) {
        try {
          const mediaRes = await fetch(
            `${WC_URL}/wp-json/wp/v2/media/${post.featured_media}?_fields=source_url`
          );
          if (mediaRes.ok) {
            const media = await mediaRes.json() as any;
            featuredImage = media.source_url || '';
          }
        } catch { /* ignore */ }
      }

      const article = {
        id: post.id,
        slug: post.slug,
        title: post.title?.rendered || '',
        content: cleanWpHtml(post.content?.rendered || ''),
        excerpt: post.excerpt?.rendered || '',
        featuredImage,
        date: post.date,
      };

      articleCache.set(slug, { data: article, ts: Date.now() });
      res.json(article);
    } catch (err) {
      console.error('Error fetching article:', err);
      res.status(500).json({ error: 'Failed to fetch article' });
    }
  });

  // GET /api/articles — list recent articles for haveguide
  app.get('/api/articles', async (_req, res) => {
    try {
      const WC_URL = process.env.WC_URL || 'https://gruslevering.dk';
      const wpRes = await fetch(
        `${WC_URL}/wp-json/wp/v2/posts?per_page=12&_fields=id,slug,title,excerpt,featured_media,date`
      );
      if (!wpRes.ok) {
        return res.status(502).json({ error: 'Failed to fetch articles from WordPress' });
      }
      const posts = await wpRes.json() as any[];

      // Fetch featured images in parallel
      const articles = await Promise.all(posts.map(async (post: any) => {
        let featuredImage = '';
        if (post.featured_media) {
          try {
            const mediaRes = await fetch(
              `${WC_URL}/wp-json/wp/v2/media/${post.featured_media}?_fields=source_url`
            );
            if (mediaRes.ok) {
              const media = await mediaRes.json() as any;
              featuredImage = media.source_url || '';
            }
          } catch { /* ignore */ }
        }
        return {
          id: post.id,
          slug: post.slug,
          title: post.title?.rendered || '',
          excerpt: post.excerpt?.rendered || '',
          featuredImage,
          date: post.date,
        };
      }));

      res.json(articles);
    } catch (err) {
      console.error('Error fetching articles:', err);
      res.status(500).json({ error: 'Failed to fetch articles' });
    }
  });

  // GET /api/pages/:slug — fetch page content from Strapi
  app.get('/api/pages/:slug', async (req, res) => {
    try {
      const page = await fetchPageBySlug(req.params.slug);
      if (!page) {
        return res.status(404).json({ error: 'Page not found' });
      }
      res.json(page);
    } catch (err) {
      console.error('Error fetching page:', err);
      res.status(500).json({ error: 'Failed to fetch page' });
    }
  });

  // GET /api/site-settings — fetch site settings singleton
  app.get('/api/site-settings', async (req, res) => {
    try {
      const settings = await fetchSiteSettings();
      if (!settings) {
        return res.status(404).json({ error: 'Site settings not found' });
      }
      res.json(settings);
    } catch (err) {
      console.error('Error fetching site settings:', err);
      res.status(500).json({ error: 'Failed to fetch site settings' });
    }
  });

  // In-memory image cache (LRU-style, max 200 entries / ~100MB)
  const imageCache = new Map<string, { buffer: Buffer; contentType: string; ts: number }>();
  const IMAGE_CACHE_MAX = 200;
  const IMAGE_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

  function pruneImageCache() {
    if (imageCache.size <= IMAGE_CACHE_MAX) return;
    // Remove oldest entries
    const sorted = Array.from(imageCache.entries()).sort((a, b) => a[1].ts - b[1].ts);
    const toRemove = sorted.slice(0, imageCache.size - IMAGE_CACHE_MAX);
    for (const [key] of toRemove) imageCache.delete(key);
  }

  // Optimizing image proxy — resizes, converts to WebP, and caches in memory
  app.get("/api/img", async (req, res) => {
    const url = req.query.url as string;
    const width = Math.min(Math.max(parseInt(req.query.w as string) || 600, 32), 1600);
    const quality = Math.min(Math.max(parseInt(req.query.q as string) || 80, 10), 100);

    if (!url || !url.startsWith("https://")) {
      return res.status(400).json({ error: "Invalid image URL" });
    }

    const acceptsWebP = (req.headers.accept || "").includes("image/webp");
    const format = acceptsWebP ? "webp" : "jpeg";
    const cacheKey = `${url}|${width}|${quality}|${format}`;

    // Serve from memory cache
    const cached = imageCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < IMAGE_CACHE_TTL) {
      res.setHeader("Content-Type", cached.contentType);
      res.setHeader("Cache-Control", "public, max-age=604800, immutable");
      res.setHeader("Vary", "Accept");
      res.setHeader("X-Cache", "HIT");
      return res.send(cached.buffer);
    }

    try {
      const sharp = (await import("sharp")).default;
      const response = await fetch(url);
      if (!response.ok) return res.status(response.status).send("Image not found");

      const inputBuffer = Buffer.from(await response.arrayBuffer());
      let pipeline = sharp(inputBuffer).resize(width, width, {
        fit: "inside",
        withoutEnlargement: true,
      });

      let contentType: string;
      if (acceptsWebP) {
        pipeline = pipeline.webp({ quality });
        contentType = "image/webp";
      } else {
        pipeline = pipeline.jpeg({ quality, mozjpeg: true });
        contentType = "image/jpeg";
      }

      const outputBuffer = await pipeline.toBuffer();

      // Store in memory cache
      imageCache.set(cacheKey, { buffer: outputBuffer, contentType, ts: Date.now() });
      pruneImageCache();

      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=604800, immutable");
      res.setHeader("Vary", "Accept");
      res.setHeader("X-Cache", "MISS");
      res.send(outputBuffer);
    } catch (err) {
      // Fallback: serve original image without processing
      try {
        const response = await fetch(url);
        if (!response.ok) return res.status(response.status).send("Image not found");
        const contentType = response.headers.get("content-type") || "image/jpeg";
        res.setHeader("Content-Type", contentType);
        res.setHeader("Cache-Control", "public, max-age=86400");
        res.send(Buffer.from(await response.arrayBuffer()));
      } catch {
        res.status(500).send("Failed to fetch image");
      }
    }
  });

  // SEO: Dynamic sitemap with all category and product pages
  app.get('/sitemap.xml', async (req, res) => {
    try {
      const categories = await fetchCategories();
      const products = await fetchAllProducts();
      const baseUrl = 'https://gruslevering.dk';
      const today = new Date().toISOString().split('T')[0];

      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/shop</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;

      for (const cat of categories) {
        xml += `
  <url>
    <loc>${baseUrl}${cat.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;
      }

      for (const product of products) {
        const productPath = product.slug || product.id;
        xml += `
  <url>
    <loc>${baseUrl}/produkt/${productPath}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      }

      xml += `
</urlset>`;

      res.set('Content-Type', 'application/xml');
      res.send(xml);
    } catch (error) {
      console.error('Error generating sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  return httpServer;
}
