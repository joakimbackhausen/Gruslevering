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
import { wcGet } from "./woocommerce";

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
    <loc>${baseUrl}/shop/${cat.slug}</loc>
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
