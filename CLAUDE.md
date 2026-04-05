# Gruslevering.dk - Kaervang Materialer ApS

E-commerce for grus, sand, sten, muld, braende og havematerialer med levering i hele Danmark. Produktdata importeres fra gruslevering.dk (WooCommerce) direkte til PostgreSQL.

## Tech Stack

- **Frontend**: React 19 + TypeScript, Wouter routing, TanStack Query, Tailwind CSS v4, shadcn/ui (New York), Framer Motion
- **Backend**: Express.js + TypeScript (ESM), Node.js
- **Database**: PostgreSQL + Drizzle ORM
- **Build**: Vite (client), esbuild (server)
- **CMS/Backend**: WooCommerce REST API v3 (headless CMS/backend)

## Arkitektur

WooCommerce paa gruslevering.dk bruges som headless CMS/backend:
- **Produkter/kategorier**: Synkroniseres fra WooCommerce REST API v3 til PostgreSQL cache hvert 10. minut
- **Ordrer**: Oprettes i WooCommerce via REST API, betaling via Worldline (redirect)
- **PostgreSQL**: Cache-lag for hurtige product reads, lokal kopi af ordrer

Flow: React Frontend -> Express API -> WooCommerce REST API v3 -> Worldline betaling

## Kommandoer

```bash
npm run dev              # Start dev server (Express + Vite HMR) paa port 3000
npm run build            # Byg til produktion (client -> dist/public, server -> dist/index.cjs)
npm run start            # Start produktion server
npm run check            # TypeScript type check
npm run seed             # Importer produkter fra WooCommerce til PostgreSQL + opret admin bruger
```

## Projektstruktur

```
client/              # React frontend
  src/
    pages/           # Sider: Home, Shop, ProductDetail, VolumeCalculator, Delivery, About, Contact, Checkout, OrderConfirmation
    components/      # Header, Footer, SmartImage + ui/ (shadcn)
    hooks/           # use-mobile, use-toast
    lib/             # queryClient, utils
server/              # Express backend
  index.ts           # App entry point
  routes.ts          # API endpoints
  db.ts              # PostgreSQL/Drizzle connection
  data-source.ts     # Database queries (produkter, kategorier, ordrer, sider, indstillinger)
  vite.ts            # Vite dev middleware
  woocommerce.ts     # WooCommerce REST API v3 client (auth + HTTP helpers)
  static.ts          # Statisk filservering (prod)
shared/
  schema.ts          # Drizzle ORM schema (users, products, categories, orders, pages, site_settings)
script/
  build.ts           # Build script (esbuild + Vite)
  import-products.ts # Seed script (WooCommerce -> PostgreSQL)
```

## API

- `GET /api/products` - Henter produkter fra PostgreSQL
- `GET /api/products/:id` - Hent enkelt produkt (by slug eller id)
- `GET /api/categories` - Hent produktkategorier
- `POST /api/orders` - Opret ordre
- `GET /api/pages/:slug` - Hent sideindhold
- `GET /api/site-settings` - Hent siteindstillinger
- `GET /api/orders/:wcId` - Hent ordre fra WooCommerce

## Ruter (frontend)

- `/` - Forside
- `/shop/:kategori?` - Produktoversigt
- `/produkt/:slug` - Produktdetaljer
- `/volumenberegner` - Volumenberegner
- `/levering` - Leveringsinfo
- `/om-os` - Om os
- `/kontakt` - Kontakt
- `/checkout` - Checkout
- `/ordre-bekraeftelse` - Ordrebekraeftelse
## Branding

- **Farver**: `#3f9b3f` (groen, primaer) + `#1a1a2e` (neutral dark, header) + `#f8f9fa` (neutral bg) + `#f59e0b` (accent)
- **Kontakt**: +45 72 49 44 44 / Info@kaervangmaterialer.dk
- **Adresse**: Tylstrupvej 1, 9382 Tylstrup

## Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - development/production
- `DATABASE_URL` - PostgreSQL connection string (paakraevet)
- `WC_URL` - WooCommerce site URL (default: https://gruslevering.dk)
- `WC_CONSUMER_KEY` - WooCommerce REST API consumer key (paakraevet)
- `WC_CONSUMER_SECRET` - WooCommerce REST API consumer secret (paakraevet)

## Deploy (Railway)

Projektet er konfigureret til Railway via `railway.json`. Nixpacks bygger automatisk.
Tilfoej en PostgreSQL plugin i Railway for database. `DATABASE_URL` saettes automatisk.
