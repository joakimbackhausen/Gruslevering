# Impetu Webshop Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the IEM machine dealer site into a premium webshop for Impetu ApS with red branding, product scraping from impetu-webshop.dk, ecommerce header icons, and a functioning cart.

**Architecture:** Keep the existing React + Express + Tailwind + shadcn stack. Replace the maskinbladet.dk scraper with one that scrapes impetu-webshop.dk for products/categories. Add a CartContext with localStorage persistence. Rebrand all colors from green/yellow to red, update header with ecommerce icons.

**Tech Stack:** React 19, TypeScript, Wouter, TanStack Query, Tailwind CSS v4, shadcn/ui, Framer Motion, Cheerio (scraping), Express

---

### Task 1: Rebrand Colors — CSS Variables & Theme

**Files:**
- Modify: `client/src/index.css`

**Step 1: Replace color variables**

In `client/src/index.css`, replace the brand color variables. Change all instances of:

- `--iem-green: #1B6B4A` → `--impetu-red: #E30613`
- `--iem-yellow: #FFF100` → `--impetu-dark: #2D3748`
- `--iem-dark: #1a1a1a` → keep as `--impetu-text: #1a1a1a`

Update the CSS custom properties in `:root`:
```css
--impetu-red: #E30613;
--impetu-red-hover: #C00511;
--impetu-dark: #2D3748;
--impetu-text: #1a1a1a;
--impetu-header: #3D4F65;
```

**Step 2: Verify the CSS compiles**

Run: `npm run check`
Expected: No errors

**Step 3: Commit**

```bash
git add client/src/index.css
git commit -m "feat: rebrand CSS variables from IEM green/yellow to Impetu red"
```

---

### Task 2: Cart Context & State Management

**Files:**
- Create: `client/src/contexts/CartContext.tsx`
- Modify: `client/src/App.tsx`

**Step 1: Create CartContext**

Create `client/src/contexts/CartContext.tsx`:

```tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
  sku?: string;
  variant?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | null>(null);

const STORAGE_KEY = "impetu-cart";

function loadCart(): CartItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (newItem: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const key = newItem.variant ? `${newItem.id}-${newItem.variant}` : newItem.id;
      const existing = prev.find((i) => (i.variant ? `${i.id}-${i.variant}` : i.id) === key);
      if (existing) {
        return prev.map((i) =>
          (i.variant ? `${i.id}-${i.variant}` : i.id) === key
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...newItem, quantity: 1 }];
    });
    setIsOpen(true);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => (i.variant ? `${i.id}-${i.variant}` : i.id) !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) return removeItem(id);
    setItems((prev) =>
      prev.map((i) =>
        (i.variant ? `${i.id}-${i.variant}` : i.id) === id ? { ...i, quantity } : i
      )
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, isOpen, setIsOpen, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
```

**Step 2: Wrap App with CartProvider**

In `client/src/App.tsx`, import and wrap:

```tsx
import { CartProvider } from "@/contexts/CartContext";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </CartProvider>
    </QueryClientProvider>
  );
}
```

**Step 3: Verify**

Run: `npm run check`
Expected: No type errors

**Step 4: Commit**

```bash
git add client/src/contexts/CartContext.tsx client/src/App.tsx
git commit -m "feat: add CartContext with localStorage persistence"
```

---

### Task 3: Cart Drawer Component

**Files:**
- Create: `client/src/components/CartDrawer.tsx`

**Step 1: Create the cart drawer**

Create `client/src/components/CartDrawer.tsx` — a slide-in drawer from the right showing cart items, quantities, totals. Use the existing Sheet component from shadcn if available, or create a custom drawer with Framer Motion.

Key requirements:
- Slides in from right when `isOpen` is true
- Shows each cart item: image (48x48), title, variant, quantity +/- controls, line price, remove button
- Footer: total price (ekskl. moms), "Gå til kassen" button (red)
- Empty state: "Din kurv er tom" with shopping bag icon
- Backdrop overlay that closes drawer on click
- Use `useCart()` for all state

Color scheme:
- "Fjern" / remove: gray text
- "Gå til kassen" button: `bg-[#E30613] hover:bg-[#C00511]` white text
- Quantity buttons: border with rounded-full
- Header: "Indkøbskurv" with item count and close X button

**Step 2: Verify**

Run: `npm run check`

**Step 3: Commit**

```bash
git add client/src/components/CartDrawer.tsx
git commit -m "feat: add CartDrawer slide-in component"
```

---

### Task 4: New Scraper for impetu-webshop.dk

**Files:**
- Rewrite: `server/scraper.ts`

**Step 1: Rewrite the scraper**

Replace the entire `server/scraper.ts` with a new scraper that targets `impetu-webshop.dk`. The site structure (observed from browsing):

- Category pages: `https://impetu-webshop.dk/shop/{id}-{slug}/`
- Product listing pages within categories
- Product details with prices in DKK (ekskl. moms)

New Product interface:
```typescript
export interface Product {
  id: string;
  title: string;
  sku: string;
  price: number; // in DKK, ekskl. moms
  currency: string;
  image: string;
  images: string[];
  category: string;
  categorySlug: string;
  description: string;
  variants?: { label: string; options: string[] }[];
  url: string; // original URL on impetu-webshop.dk
}

export interface Category {
  slug: string;
  name: string;
  image: string;
  count: number;
}
```

Scraping approach:
1. Fetch the homepage to discover category links from the nav menu
2. For each category, fetch its page to get subcategories and products
3. Parse product cards: image, title, SKU, price, "Læg i kurv" button
4. For variant products (with dropdown selectors), extract variant options
5. Cache everything with 10-min TTL (same pattern as current scraper)

Export functions:
- `fetchAllProducts(): Promise<Product[]>`
- `fetchProductById(id: string): Promise<Product | undefined>`
- `fetchCategories(): Promise<Category[]>`

**Step 2: Test the scraper manually**

Run: `npx tsx -e "import { fetchAllProducts } from './server/scraper'; fetchAllProducts().then(p => console.log(p.length, 'products', p[0]))"`
Expected: Products scraped and logged

**Step 3: Commit**

```bash
git add server/scraper.ts
git commit -m "feat: rewrite scraper for impetu-webshop.dk products"
```

---

### Task 5: Update API Routes

**Files:**
- Modify: `server/routes.ts`

**Step 1: Update routes to use new scraper**

Replace machine endpoints with product endpoints:

```typescript
import { fetchAllProducts, fetchProductById, fetchCategories } from "./scraper";

// GET /api/products — all products, optional ?category= filter
app.get("/api/products", async (req, res) => {
  const products = await fetchAllProducts();
  const category = req.query.category as string | undefined;
  if (category) {
    return res.json(products.filter(p => p.categorySlug === category));
  }
  res.json(products);
});

// GET /api/products/:id — single product
app.get("/api/products/:id", async (req, res) => {
  const product = await fetchProductById(req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

// GET /api/categories — category list
app.get("/api/categories", async (req, res) => {
  const categories = await fetchCategories();
  res.json(categories);
});
```

Keep the `/api/image-check` endpoint and `/sitemap.xml` (update sitemap base URL to impetu domain).

Remove old `/api/machines` and `/api/machines/:id` routes.

**Step 2: Verify**

Run: `npm run check`

**Step 3: Commit**

```bash
git add server/routes.ts
git commit -m "feat: update API routes for products instead of machines"
```

---

### Task 6: Header Redesign

**Files:**
- Modify: `client/src/components/Header.tsx`

**Step 1: Redesign the header**

Replace the entire Header component:

- Remove the top info bar
- Single-row header: dark background `bg-[#3D4F65]`
- Logo left: Impetu logo (use image from `https://shop86014.sfstatic.io/upload_dir/pics/Impetu_roed_box_web.jpg` — download to `/client/public/images/impetu-logo.png` or reference directly)
- Nav center: category links (Gravemaskiner, Gummiged, Minilæssere, Transport Tanke, Outlet, Se alle)
- Icons right: Search (magnifying glass), Cart (shopping bag with red badge showing `totalItems`), Hamburger menu
- Icons use lucide-react: `Search`, `ShoppingBag`, `Menu`, `X`
- Cart icon onClick: `setIsOpen(true)` from useCart
- Mobile: logo left, icons right (search + cart + hamburger), nav in dropdown

Color scheme:
- Background: `bg-[#3D4F65]`
- Text: white, `hover:text-white/80`
- Active link: `bg-white/10 rounded-lg`
- Cart badge: `bg-[#E30613]` absolute positioned, small circle with count

**Step 2: Download/save Impetu logo**

Save the Impetu logo image to `client/public/images/impetu-logo.png`.

**Step 3: Verify visually**

Run: `npm run dev` and check the header renders correctly

**Step 4: Commit**

```bash
git add client/src/components/Header.tsx client/public/images/
git commit -m "feat: redesign header with Impetu branding and ecommerce icons"
```

---

### Task 7: Update Footer

**Files:**
- Modify: `client/src/components/Footer.tsx`

**Step 1: Update footer content**

Replace IEM content with Impetu:
- Company: Impetu ApS
- Address: Bromøllevej 21a, 8830 Tjele
- Phone: +45 21479746
- Email: mk@impetu.dk
- CVR: 35030476
- Replace green accent color `text-[#1B6B4A]` with `text-[#E30613]`
- Update nav links to match new routes: Shop, Kategorier, Om os, Kontakt
- Update copyright: "Impetu ApS"

**Step 2: Commit**

```bash
git add client/src/components/Footer.tsx
git commit -m "feat: update footer with Impetu branding and contact info"
```

---

### Task 8: Home Page Transformation

**Files:**
- Modify: `client/src/pages/Home.tsx`

**Step 1: Update hero section**

- Change headline: "Redskaber til dit behov"
- Subtitle: "Kvalitetsredskaber til gravemaskiner, minilæssere og meget mere"
- Yellow label → red label: `text-[#E30613]` → "Impetu ApS — Tjele"
- CTA button: `bg-[#E30613] hover:bg-[#C00511]` text "Se produkter" → links to `/shop`
- Phone CTA: update number to 21479746
- Replace hero background image or use a generic equipment image

**Step 2: Update category cards**

Replace existing 3 category cards with Impetu's categories (use fetched category data from `/api/categories`). Show 4-6 categories in a grid. Each card: category image, name, product count. Link to `/shop?kategori={slug}`.

**Step 3: Replace machine grid with product grid**

- Fetch from `/api/products` instead of `/api/machines`
- Show "Populære produkter" section
- Product cards: image, title, price formatted as "X.XXX,XX DKK", "Læg i kurv" button (red)
- Card click navigates to `/produkt/:id`
- Replace green accents with red

**Step 4: Update stats section**

- Dynamic product count from fetched data
- Keep "Tilfredse kunder" and experience stats but update numbers for Impetu

**Step 5: Update about section**

- Company description for Impetu
- Update CTA buttons to red

**Step 6: Update dark CTA section**

- "Har du brug for specialredskaber?" or similar
- Red CTA button
- Contact phone for Impetu

**Step 7: Verify**

Run: `npm run dev` and check homepage renders

**Step 8: Commit**

```bash
git add client/src/pages/Home.tsx
git commit -m "feat: transform home page to Impetu webshop with products and red branding"
```

---

### Task 9: Shop Page (replaces Machines.tsx)

**Files:**
- Rename/rewrite: `client/src/pages/Machines.tsx` → keep file but rewrite as Shop page
- Modify: `client/src/App.tsx` (update route)

**Step 1: Rewrite Machines.tsx as Shop page**

- Fetch from `/api/products` and `/api/categories`
- Filter bar: search input, category dropdown, sort dropdown (Pris lav-høj, Pris høj-lav, Navn A-Å, Nyeste)
- Product grid: 4 columns (xl), 2 (sm), 1 (mobile)
- Product card: image (aspect 4:3), title, SKU, price "X.XXX,XX DKK (ekskl. moms)", red "KØB" button
- "KØB" button calls `addItem()` from CartContext
- Replace all green `#1B6B4A` with red `#E30613`
- Selected category filter: `bg-[#E30613] text-white` instead of green

**Step 2: Update routes in App.tsx**

```tsx
<Route path="/shop/:kategori?" component={Machines} />
```

Add the new route, keep or redirect old `/maskiner` to `/shop`.

**Step 3: Verify**

Run: `npm run dev`, navigate to `/shop`, check products load and filters work

**Step 4: Commit**

```bash
git add client/src/pages/Machines.tsx client/src/App.tsx
git commit -m "feat: rewrite Machines page as Shop with Impetu products and cart integration"
```

---

### Task 10: Product Detail Page (replaces MachineDetail.tsx)

**Files:**
- Rewrite: `client/src/pages/MachineDetail.tsx`

**Step 1: Rewrite as product detail**

- Fetch single product from `/api/products/:id`
- Image gallery: main image + thumbnails (keep existing pattern but update highlight color from yellow to red `border-[#E30613]`)
- Product info: title, SKU, category breadcrumb
- Price display: large red price "XX.XXX,XX DKK" with "(ekskl. moms)" note
- Variant selector: if product has variants, show dropdown(s)
- Quantity input + "Læg i kurv" button (red, full width)
- Description section
- Specs table if available
- Contact card: Impetu phone/email with red accent
- Replace all green/yellow accent colors with red

**Step 2: Update route in App.tsx**

```tsx
<Route path="/produkt/:id" component={MachineDetail} />
```

**Step 3: Verify**

Run: `npm run dev`, navigate to a product detail page

**Step 4: Commit**

```bash
git add client/src/pages/MachineDetail.tsx client/src/App.tsx
git commit -m "feat: rewrite product detail page with cart integration and red branding"
```

---

### Task 11: Wire CartDrawer into Layout

**Files:**
- Modify: `client/src/components/Header.tsx` (or wherever the layout wrapper is)

**Step 1: Add CartDrawer to the app**

Import and render `<CartDrawer />` in the Header component (since Header is rendered on every page). Place it at the end of the Header JSX:

```tsx
import CartDrawer from "./CartDrawer";
// ... at the end of the Header component return:
<CartDrawer />
```

The CartDrawer uses `useCart().isOpen` to show/hide itself, so it just needs to be in the DOM.

**Step 2: Verify full cart flow**

1. Navigate to `/shop`
2. Click "KØB" on a product → cart drawer opens
3. Adjust quantity → total updates
4. Close drawer → badge on cart icon shows count
5. Refresh page → cart persists from localStorage

**Step 3: Commit**

```bash
git add client/src/components/Header.tsx
git commit -m "feat: wire CartDrawer into layout for full cart flow"
```

---

### Task 12: Remove IEM-specific Pages & Clean Up

**Files:**
- Delete: `client/src/pages/SolisTraktor.tsx`
- Delete: `client/src/pages/Trailer.tsx`
- Delete: `client/src/pages/Finansiering.tsx`
- Delete: `client/src/pages/SpareParts.tsx`
- Modify: `client/src/App.tsx` (remove old routes, add new ones)
- Modify: `client/src/pages/About.tsx` (rebrand to Impetu)
- Modify: `client/src/pages/Contact.tsx` (rebrand to Impetu)

**Step 1: Remove unused pages**

Delete the 4 IEM-specific page files.

**Step 2: Update App.tsx routes**

Final routes:
```tsx
<Route path="/" component={Home} />
<Route path="/shop/:kategori?" component={Shop} />
<Route path="/produkt/:id" component={ProductDetail} />
<Route path="/om-os" component={About} />
<Route path="/kontakt" component={Contact} />
<Route component={Home} />
```

**Step 3: Update About page**

Replace IEM content with Impetu:
- Company name, description, stats
- Replace green accents with red
- Update contact info

**Step 4: Update Contact page**

- Impetu contact details
- Replace green accents with red
- Update address, phone, email

**Step 5: Verify**

Run: `npm run check` — no import errors for deleted files
Run: `npm run dev` — all routes work

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: remove IEM pages, update About/Contact with Impetu branding, clean up routes"
```

---

### Task 13: Update CLAUDE.md & Sitemap

**Files:**
- Modify: `CLAUDE.md`
- Modify: `server/routes.ts` (sitemap section)

**Step 1: Update CLAUDE.md**

Replace all IEM references with Impetu:
- Project description
- Branding colors
- Contact info
- API endpoints
- Route descriptions

**Step 2: Update sitemap**

In `server/routes.ts`, update the sitemap:
- Base URL: `https://impetu-webshop.dk` (or the deployed URL)
- Routes: `/`, `/shop`, `/produkt/*`, `/om-os`, `/kontakt`

**Step 3: Commit**

```bash
git add CLAUDE.md server/routes.ts
git commit -m "docs: update CLAUDE.md and sitemap for Impetu webshop"
```

---

### Task 14: Global Color Sweep

**Files:**
- All files in `client/src/`

**Step 1: Find and replace remaining IEM colors**

Search across all files for:
- `#1B6B4A` → `#E30613` (green → red)
- `#155d3f` → `#C00511` (green hover → red hover)
- `#FFF100` → `#E30613` (yellow accent → red)
- `#C4A800` → `#B0040F` (gold → dark red)
- `text-[#1B6B4A]` → `text-[#E30613]`
- `bg-[#1B6B4A]` → `bg-[#E30613]`
- `bg-[#FFF100]` → `bg-[#E30613]`
- `border-[#FFF100]` → `border-[#E30613]`
- Any remaining "IEM", "Ib E. Mortensen", "iem.dk", "Kastbjerg", "Havndal" references

**Step 2: Verify**

Run: `grep -r "1B6B4A\|FFF100\|iem\|Kastbjerg\|Havndal" client/src/ --include="*.tsx" --include="*.ts" --include="*.css"`
Expected: No matches (except possibly in comments)

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: complete color sweep — replace all IEM green/yellow with Impetu red"
```

---

### Task 15: Final Verification & Polish

**Step 1: Type check**

Run: `npm run check`
Expected: No errors

**Step 2: Dev server test**

Run: `npm run dev`
Verify:
- Homepage loads with Impetu branding, red colors, products from impetu-webshop.dk
- Header: dark slate background, Impetu logo, search/cart/menu icons
- Cart: click KØB → drawer opens, quantities work, persists on refresh
- Shop page: products load, filtering works, sorting works
- Product detail: images, price, add to cart works
- Footer: Impetu contact info
- Mobile responsive: header collapses, grids stack

**Step 3: Build check**

Run: `npm run build`
Expected: Builds successfully

**Step 4: Commit any final fixes**

```bash
git add -A
git commit -m "fix: final polish and fixes for Impetu webshop"
```
