# Reservedele Webshop — Frontend Design

## Oversigt
Webshop-lignende katalog for IEM reservedele. Kun frontend med hardcoded demo-data, klar til CMS-kobling senere.

## Ruter
- `/reservedele` — Hovedside med hero + kategorier + produktgrid
- `/reservedele/:kategori` — Filtreret på kategori via URL

## Sektioner

### Hero
Mørk baggrund, gul #FFF100 accent-linje, overskrift + undertekst, søgefelt centreret.

### Kategorier
8 kategorier som runde pills (samme stil som maskinfiltre):
1. Minigravere
2. Minilæssere
3. Rendegravere
4. Hjullæssere & Dumpere
5. Larvefødder & dæk
6. Hydraulikslanger
7. Filtre & servicepakker
8. Olie & smøremidler

### Produktgrid
- 4 kolonner desktop, 2 tablet, 1 mobil
- Produktkort: billede, titel, mærke, pris (eks./inkl. moms), "Kontakt os"-knap
- Søgefelt + mærkefilter dropdown

### USP-strip
3 USP'er: "Levering 1-2 dage" / "Teknisk rådgivning" / "Originale & universelle dele"

## Demo-data
~40-50 produkter i JSON, fordelt på 8 kategorier. Realistiske navne, priser, mærker. Placeholder-billeder.

## Komponenter
- `SpareParts.tsx` — Hovedside
- `SparePartCard.tsx` — Produktkort
- `sparePartsData.ts` — Hardcoded demo-data

## Navigation
Nyt menupunkt "Reservedele" i Header mellem "Maskiner" og "Service".

## Designsprog
Samme som resten: Outfit font, gul #FFF100 accent, grøn #1B6B4A CTA, mørk #1A1A1A tekst, afrundede kort med hover-animation.
