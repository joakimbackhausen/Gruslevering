# Gruslevering.dk - Kaervang Materialer ApS

E-commerce for grus, sand, sten, muld, braende og havematerialer med levering i hele Danmark. Produktdata importeres fra gruslevering.dk (WooCommerce) til Strapi CMS.

## Tech Stack

- **Frontend**: React 19 + TypeScript, Wouter routing, TanStack Query, Tailwind CSS v4, shadcn/ui (New York), Framer Motion
- **Backend**: Express.js + TypeScript (ESM), Node.js
- **CMS**: Strapi (produkter, sider, indstillinger)
- **Database**: PostgreSQL + Drizzle ORM
- **Build**: Vite (client), esbuild (server)

## Kommandoer

```bash
npm run dev              # Start dev server (Express + Vite HMR) paa port 3000
npm run build            # Byg til produktion (client -> dist/public, server -> dist/index.cjs)
npm run start            # Start produktion server
npm run check            # TypeScript type check
npm run db:push          # Push Drizzle schema til database
npm run import-products  # Importer produkter fra WooCommerce til Strapi
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
  vite.ts            # Vite dev middleware
  static.ts          # Statisk filservering (prod)
  storage.ts         # Database storage
shared/
  schema.ts          # Drizzle ORM schema
script/
  build.ts           # Build script (esbuild + Vite)
```

## API

- `GET /api/products` - Henter produkter fra Strapi CMS
- `GET /api/products/:id` - Hent enkelt produkt
- `GET /api/categories` - Hent produktkategorier
- `POST /api/orders` - Opret ordre
- `GET /api/pages/:slug` - Hent sideindhold
- `GET /api/site-settings` - Hent siteindstillinger

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

- `PORT` - Server port (default: 5000)
- `NODE_ENV` - development/production
- `DATABASE_URL` - PostgreSQL connection string
- `STRAPI_URL` - Strapi CMS URL
- `STRAPI_TOKEN` - Strapi API token

## Deploy (Railway)

Projektet er konfigureret til Railway via `railway.json`. Nixpacks bygger automatisk.
Tilfoej en PostgreSQL plugin i Railway for database. `DATABASE_URL` saettes automatisk.
