# Impetu Webshop Redesign

## Overview
Transform the IEM machine dealer site into a premium webshop for Impetu ApS — an equipment/tool supplier specializing in excavator attachments, mini-loader tools, fuel transport tanks, and welding components. Based in Tjele, Denmark.

## Branding
- **Primary color**: `#E30613` (Impetu red) — replaces green `#1B6B4A`
- **Header background**: `#2D3748` (dark slate, similar to impetu-webshop.dk's `rgb(124,137,153)` but darker/more premium)
- **Dark text**: `#1A1A1A` (keep)
- **Light backgrounds**: `#F5F5F3` (keep)
- **Footer**: `#111111` (keep dark)
- **Logo**: Impetu red box with white italic text (image from impetu-webshop.dk)
- **Contact**: Bromøllevej 21a, 8830 Tjele | +45 21479746 | mk@impetu.dk | CVR 35030476

## Header
- Fixed, single-row header (remove top info bar)
- Logo left, nav center, icons right (search, cart with badge, hamburger menu)
- Mobile: logo left, icons right, hamburger opens full nav
- Nav items: Gravemaskiner, Gummiged & Rendegraver, Minilæssere & Traktor, Transport Tanke, Outlet/Brugt, Se alle

## Pages

### Home (/)
1. **Hero**: Full viewport, dark overlay on equipment image, headline "Redskaber til dit behov", subtitle about quality equipment, red CTA "Se produkter" + phone CTA
2. **Categories**: 4-column grid of category cards with images, hover effects (reuse existing pattern)
3. **Featured products**: "Populære produkter" section, 4-col grid with product cards (image, title, price, "Læg i kurv")
4. **Stats**: Adapt (antal produkter, years experience, satisfied customers)
5. **About**: Company info section with image + text
6. **CTA**: Dark section with "Kontakt os" call-to-action

### Shop (/shop)
- Category filter sidebar (or top filter bar on mobile)
- Sort by: price, name, newest
- Product grid (4 cols desktop, 2 mobile)
- Product cards: image (4:3), title, SKU, price (ekskl. moms), "KØB" button

### Category (/kategori/:slug)
- Same as /shop but filtered to category
- Category hero banner at top

### Product Detail (/produkt/:id)
- Image gallery (main + thumbnails)
- Title, SKU, price, description
- Variant selector (e.g. "Vælg Ophæng") where applicable
- Quantity + "Læg i kurv" button (red)
- Specs table

### Contact (/kontakt)
- Adapt existing contact page with Impetu info

### About (/om-os)
- Adapt existing about page

## Cart System
- Cart state managed via React context + localStorage
- Cart sidebar/drawer slides in from right on "Læg i kurv"
- Shows: product image, title, quantity controls, line price, total
- "Fortsæt til kassen" links to impetu-webshop.dk checkout (or placeholder)
- Cart icon in header shows item count badge

## Data Layer
- Backend scrapes product data from impetu-webshop.dk
- Parse categories, products, images, prices, SKUs, descriptions
- Cache with 10-minute TTL (same pattern as current altimaskiner.dk scraper)
- API endpoints:
  - `GET /api/products` — all products (with optional category filter)
  - `GET /api/products/:id` — single product
  - `GET /api/categories` — all categories

## What to Remove
- IEM branding, logo, contact info
- Green/yellow color scheme
- altimaskiner.dk scraper
- Solis Traktor, Trailer, Finansiering pages
- SpareParts page (replaced by unified shop)
- MachineSlider (replace with product grid)

## What to Keep
- Design quality, animations, Framer Motion transitions
- Tailwind + shadcn/ui component system
- Card patterns, hover effects, responsive grid
- Reveal scroll animations
- Overall premium feel
