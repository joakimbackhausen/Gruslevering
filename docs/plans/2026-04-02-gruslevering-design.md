# Gruslevering.dk - Designdokument

## Oversigt

Tilpasning af Impetu ApS-projektet til Gruslevering.dk (Kærvang Materialer ApS). E-commerce platform for salg af grus, sand, sten, muld, brænde og havematerialer i bigbags med levering i hele DK.

## Virksomhed

- **Navn:** Kærvang Materialer ApS
- **Adresse:** Tylstrupvej 1, 9382 Tylstrup
- **Telefon:** +45 72 49 44 44
- **Email:** Info@kaervangmaterialer.dk
- **Etableret:** 2008

## 1. Produktmodel & Variationer

### Product (Strapi Content Type)

| Felt | Type | Beskrivelse |
|------|------|-------------|
| title | Text | Produktnavn |
| slug | UID | URL-slug |
| description | Rich Text | Produktbeskrivelse |
| sku | Text | Varenummer |
| images | Media (multiple) | Produktbilleder (galleri) |
| basePrice | Decimal | Basispris i DKK |
| salePrice | Decimal | Tilbudspris (valgfri) |
| weight | Text | Vægt (f.eks. "500kg", "1000kg") |
| volume | Text | Volumen (f.eks. "0.5m³") |
| unit | Enum | bigbag / sæk / stk / m³ |
| deliveryIncluded | Boolean | Fri levering inkluderet i pris |
| category | Relation | Kategori (many-to-one) |
| variants | Component (repeatable) | Variantgrupper |
| seoTitle | Text | Meta title |
| seoDescription | Text | Meta description |
| featured | Boolean | Vis på forside |
| published | Boolean | Synlig i shop |

### ProductVariantGroup (Component)

| Felt | Type | Beskrivelse |
|------|------|-------------|
| label | Text | Gruppenavn (f.eks. "Størrelse", "Kornstørrelse") |
| options | Component (repeatable) | Variantmuligheder |

### ProductVariantOption (Component)

| Felt | Type | Beskrivelse |
|------|------|-------------|
| name | Text | Optionsnavn (f.eks. "500kg bigbag") |
| priceDiff | Decimal | Prisforskel (+/- DKK fra basispris) |
| image | Media | Eget billede (valgfri) |
| skuSuffix | Text | SKU-suffix (f.eks. "-500") |
| inStock | Boolean | Lagerstatus |

### Category (Strapi Content Type)

| Felt | Type | Beskrivelse |
|------|------|-------------|
| name | Text | Kategorinavn |
| slug | UID | URL-slug |
| description | Text | Beskrivelse |
| image | Media | Kategoribillede |
| parent | Relation | Forælderkategori (self-relation) |
| sortOrder | Integer | Sorteringsrækkefølge |

### Øvrige Content Types

- **Page** - Statiske sider (Om os, Levering) med rich text-indhold
- **SiteSettings** (singleton) - Firmanavn, kontaktinfo, åbningstider, USP-tekster, sociale medier
- **Order** - Ordrer med kundeinfo, linjer, status, leveringsmetode

## 2. Design

### Farvepalette

| Rolle | Farve | Brug |
|-------|-------|------|
| Primær | `#3f9b3f` | Knapper, links, accents |
| Primær dark | `#2d7a2d` | Hover, aktiv states |
| Primær light | `#e8f5e8` | Baggrunde, badges |
| Neutral dark | `#1a1a2e` | Tekst, header |
| Neutral bg | `#f8f9fa` | Sidebaggrund |
| Accent | `#f59e0b` | Tilbud, stjerner, CTA |

### Sider

| Rute | Side | Indhold |
|------|------|---------|
| `/` | Forside | Hero (video/billede), USP-bar, populære kategorier, udvalgte produkter, trustpilot, testimonials |
| `/shop/:kategori?` | Produktoversigt | Produktgrid, filtre (kategori/pris/størrelse), sortering, animeret layout |
| `/produkt/:slug` | Produktdetaljer | Billedgalleri, variantvælger (visuelt grid), live prisopdatering, sticky add-to-cart, relaterede produkter, leveringsinfo |
| `/volumenberegner` | Volumenberegner | Interaktiv: vælg form (rektangel/cirkel), indtast mål, få anbefalet antal bigbags |
| `/levering` | Leveringsinfo | Betingelser, priser, dækningsområde |
| `/om-os` | Om os | Kærvang Materialer historie, billeder, værdier |
| `/kontakt` | Kontakt | Formular, kort, åbningstider |
| `/checkout` | Checkout | Multi-step: Kurv → Oplysninger → Levering → Bekræftelse |
| `/ordre-bekraeftelse` | Ordrebekræftelse | Ordrenummer, opsummering, forventet levering |

### Premium UI-elementer

- Smooth page transitions (Framer Motion)
- Produktkort med hover-zoom og quick-add
- Sticky "tilføj til kurv"-bar ved scroll på produktside
- Animeret kurv-drawer med live opdatering
- Variant-vælger som visuelt grid (ikke dropdown)
- Skeleton loading states
- Mobil-first med bottom navigation

## 3. Data Pipeline

### Engangsscrape

Script (`script/import-products.ts`) der:
1. Scraper gruslevering.dk for alle produkter, kategorier, priser, billeder, variationer
2. Downloader produktbilleder
3. Uploader billeder til Strapi Media Library
4. Opretter kategorier i Strapi
5. Opretter produkter med variationer i Strapi

### Arkitektur i produktion

- Strapi er eneste datakilde (ingen scraper-fallback)
- `data-source.ts` forenkles til kun Strapi-klient
- Strapi API med populated relations for varianter og kategorier

## 4. Checkout & Ordrehåndtering

### Multi-step checkout

1. **Kurv** - oversigt, rediger antal, variantvisning, rabatkode-felt
2. **Kundeoplysninger** - navn, adresse, email, telefon (React Hook Form + Zod)
3. **Levering** - leveringsmetode (bigbag-levering / tipvogn / afhentning i Tylstrup)
4. **Bekræftelse** - ordrenummer, opsummering, forventet levering

### Order (Strapi Content Type)

| Felt | Type | Beskrivelse |
|------|------|-------------|
| orderNumber | Text | Auto-genereret ordrenummer |
| customerName | Text | Kundens navn |
| customerEmail | Text | Email |
| customerPhone | Text | Telefon |
| customerAddress | Text | Leveringsadresse |
| lines | JSON | Produktlinjer (produkt, variant, antal, pris) |
| deliveryMethod | Enum | bigbag / tipvogn / afhentning |
| subtotal | Decimal | Subtotal |
| total | Decimal | Total inkl. levering |
| status | Enum | modtaget / bekræftet / under_levering / leveret |
| notes | Text | Bemærkninger |

### V1 betaling

Ordren oprettes og kunden kontaktes for betaling. Betalingsgateway (MobilePay/kort) tilføjes i v2.

### Email-notifikationer

- Ordrebekræftelse til kunden
- Ny ordre-notifikation til Info@kaervangmaterialer.dk

## 5. Tech Stack

Bevares fra Impetu-projektet:
- **Frontend:** React 19, TypeScript, Wouter, TanStack Query, Tailwind CSS v4, shadcn/ui, Framer Motion
- **Backend:** Express.js, TypeScript (ESM)
- **CMS:** Strapi 5
- **Build:** Vite + esbuild
- **Deploy:** Railway
