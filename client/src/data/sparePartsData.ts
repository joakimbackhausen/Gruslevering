export interface SparePart {
  id: number;
  title: string;
  brand: string;
  category: string;
  categorySlug: string;
  price: number;
  priceInclMoms: number;
  image: string;
  description: string;
  inStock: boolean;
  sku: string;
}

export interface SparePartCategory {
  name: string;
  slug: string;
  description: string;
  image: string;
  count?: number;
}

export const sparePartCategories: SparePartCategory[] = [
  { name: 'Minigravere', slug: 'minigravere', description: 'Dele til Eurocomach, Neomach m.fl.', image: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=600&h=400&fit=crop' },
  { name: 'Minilæssere', slug: 'minilaessere', description: 'Dele til diverse minilæssere', image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=400&fit=crop' },
  { name: 'Rendegravere', slug: 'rendegravere', description: 'Ford, New Holland & Case dele', image: 'https://images.unsplash.com/photo-1621922688758-8d99de7bff09?w=600&h=400&fit=crop' },
  { name: 'Hjullæssere & Dumpere', slug: 'hjullaessere-dumpere', description: 'Venieri og andre mærker', image: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=600&h=400&fit=crop' },
  { name: 'Larvefødder & dæk', slug: 'larvefoedder-daek', description: 'Gummilarvefødder og dæk til alle mærker', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop' },
  { name: 'Hydraulikslanger', slug: 'hydraulikslanger', description: 'Slanger, koblinger og fittings', image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&h=400&fit=crop' },
  { name: 'Filtre & servicepakker', slug: 'filtre-servicepakker', description: 'Komplet service-kit til din maskine', image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&h=400&fit=crop' },
  { name: 'Olie & smøremidler', slug: 'olie-smoerremidler', description: 'Motorolie, hydraulikvæske og fedt', image: 'https://images.unsplash.com/photo-1600861194802-a928854a4918?w=600&h=400&fit=crop' },
];

export const spareParts: SparePart[] = [
  // ── Minigravere ──
  { id: 1, title: 'Skovltænder sæt (5 stk)', brand: 'Eurocomach', category: 'Minigravere', categorySlug: 'minigravere', price: 1450, priceInclMoms: 1813, image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop', description: 'Universelle skovltænder til Eurocomach minigravere', inStock: true, sku: 'RD-1001' },
  { id: 2, title: 'Hydraulikcylinder 50/30', brand: 'Eurocomach', category: 'Minigravere', categorySlug: 'minigravere', price: 4850, priceInclMoms: 6063, image: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=400&h=300&fit=crop', description: 'Original hydraulikcylinder til ES50 og ES55', inStock: true, sku: 'RD-1002' },
  { id: 3, title: 'Bom-bolt sæt komplet', brand: 'Eurocomach', category: 'Minigravere', categorySlug: 'minigravere', price: 2200, priceInclMoms: 2750, image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400&h=300&fit=crop', description: 'Bolt, bøsninger og smørenippler til bom', inStock: true, sku: 'RD-1003' },
  { id: 4, title: 'Kabinefilter til ES35/ES40', brand: 'Eurocomach', category: 'Minigravere', categorySlug: 'minigravere', price: 385, priceInclMoms: 481, image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop', description: 'Kabinefilter / pollenfilter', inStock: true, sku: 'RD-1004' },
  { id: 5, title: 'Toprulle til ES18/ES22', brand: 'Eurocomach', category: 'Minigravere', categorySlug: 'minigravere', price: 1890, priceInclMoms: 2363, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop', description: 'Toprulle/carrier roller', inStock: false, sku: 'RD-1005' },
  { id: 6, title: 'Bundrulle til ES30/ES35', brand: 'Eurocomach', category: 'Minigravere', categorySlug: 'minigravere', price: 2450, priceInclMoms: 3063, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop', description: 'Bundrulle/track roller komplet', inStock: true, sku: 'RD-1006' },

  // ── Minilæssere ──
  { id: 7, title: 'Skovl 1200mm universal', brand: 'Neomach', category: 'Minilæssere', categorySlug: 'minilaessere', price: 5900, priceInclMoms: 7375, image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop', description: 'Universal planeringsskovl 1200mm', inStock: true, sku: 'RD-2001' },
  { id: 8, title: 'Pallegafler sæt', brand: 'Neomach', category: 'Minilæssere', categorySlug: 'minilaessere', price: 3200, priceInclMoms: 4000, image: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400&h=300&fit=crop', description: 'Pallegafler til minilæsser', inStock: true, sku: 'RD-2002' },
  { id: 9, title: 'Hydraulikpumpe komplet', brand: 'Neomach', category: 'Minilæssere', categorySlug: 'minilaessere', price: 8500, priceInclMoms: 10625, image: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=400&h=300&fit=crop', description: 'Original hydraulikpumpe', inStock: false, sku: 'RD-2003' },
  { id: 10, title: 'Drivrem til NM-serie', brand: 'Neomach', category: 'Minilæssere', categorySlug: 'minilaessere', price: 680, priceInclMoms: 850, image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop', description: 'Drivrem for alle NM-modeller', inStock: true, sku: 'RD-2004' },
  { id: 11, title: 'Styrecylinder komplet', brand: 'Neomach', category: 'Minilæssere', categorySlug: 'minilaessere', price: 5400, priceInclMoms: 6750, image: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=400&h=300&fit=crop', description: 'Styrecylinder med endestykker', inStock: true, sku: 'RD-2005' },

  // ── Rendegravere ──
  { id: 12, title: 'Stabilisator cylinder', brand: 'Ford/New Holland', category: 'Rendegravere', categorySlug: 'rendegravere', price: 6200, priceInclMoms: 7750, image: 'https://images.unsplash.com/photo-1621922688758-8d99de7bff09?w=400&h=300&fit=crop', description: 'Stabilisatorcylinder til Ford 555/655', inStock: true, sku: 'RD-3001' },
  { id: 13, title: 'Bremsesko sæt (4 stk)', brand: 'Case', category: 'Rendegravere', categorySlug: 'rendegravere', price: 2800, priceInclMoms: 3500, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop', description: 'Bremsesko komplet sæt med hardware', inStock: true, sku: 'RD-3002' },
  { id: 14, title: 'Tændingslås komplet', brand: 'Ford/New Holland', category: 'Rendegravere', categorySlug: 'rendegravere', price: 950, priceInclMoms: 1188, image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400&h=300&fit=crop', description: 'Tændingslås med 2 nøgler', inStock: true, sku: 'RD-3003' },
  { id: 15, title: 'Vandpumpe NH85/95', brand: 'New Holland', category: 'Rendegravere', categorySlug: 'rendegravere', price: 3600, priceInclMoms: 4500, image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop', description: 'Vandpumpe komplet med pakning', inStock: false, sku: 'RD-3004' },
  { id: 16, title: 'Forruder NH-serie', brand: 'New Holland', category: 'Rendegravere', categorySlug: 'rendegravere', price: 4200, priceInclMoms: 5250, image: 'https://images.unsplash.com/photo-1621922688758-8d99de7bff09?w=400&h=300&fit=crop', description: 'Lamineret forrude', inStock: true, sku: 'RD-3005' },
  { id: 17, title: 'Sæde med armlæn', brand: 'Universal', category: 'Rendegravere', categorySlug: 'rendegravere', price: 3900, priceInclMoms: 4875, image: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400&h=300&fit=crop', description: 'Komfortsæde med justerbare armlæn', inStock: true, sku: 'RD-3006' },

  // ── Hjullæssere & Dumpere ──
  { id: 18, title: 'Skovl 1800mm Venieri', brand: 'Venieri', category: 'Hjullæssere & Dumpere', categorySlug: 'hjullaessere-dumpere', price: 12500, priceInclMoms: 15625, image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop', description: 'Original skovl til Venieri VF2.63', inStock: true, sku: 'RD-4001' },
  { id: 19, title: 'Transmission oliepumpe', brand: 'Venieri', category: 'Hjullæssere & Dumpere', categorySlug: 'hjullaessere-dumpere', price: 7800, priceInclMoms: 9750, image: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=400&h=300&fit=crop', description: 'Oliepumpe til ZF transmission', inStock: false, sku: 'RD-4002' },
  { id: 20, title: 'Kardanaksel komplet', brand: 'Venieri', category: 'Hjullæssere & Dumpere', categorySlug: 'hjullaessere-dumpere', price: 9200, priceInclMoms: 11500, image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop', description: 'Kardanaksel for- og bagaksel', inStock: true, sku: 'RD-4003' },
  { id: 21, title: 'Dæk 405/70-20 industri', brand: 'BKT', category: 'Hjullæssere & Dumpere', categorySlug: 'hjullaessere-dumpere', price: 4500, priceInclMoms: 5625, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop', description: 'Industridæk 405/70-20 16PR', inStock: true, sku: 'RD-4004' },
  { id: 22, title: 'Liftcylinder VF1.63', brand: 'Venieri', category: 'Hjullæssere & Dumpere', categorySlug: 'hjullaessere-dumpere', price: 11800, priceInclMoms: 14750, image: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=400&h=300&fit=crop', description: 'Original liftcylinder til Venieri', inStock: true, sku: 'RD-4005' },

  // ── Larvefødder & dæk ──
  { id: 23, title: 'Gummilarvefod 300x52.5x80', brand: 'Universal', category: 'Larvefødder & dæk', categorySlug: 'larvefoedder-daek', price: 3800, priceInclMoms: 4750, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop', description: 'Til 3-4 tons gravemaskiner', inStock: true, sku: 'RD-5001' },
  { id: 24, title: 'Gummilarvefod 230x48x66', brand: 'Universal', category: 'Larvefødder & dæk', categorySlug: 'larvefoedder-daek', price: 2600, priceInclMoms: 3250, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop', description: 'Til 1.5-2.5 tons gravemaskiner', inStock: true, sku: 'RD-5002' },
  { id: 25, title: 'Gummilarvefod 400x72.5x74', brand: 'Universal', category: 'Larvefødder & dæk', categorySlug: 'larvefoedder-daek', price: 5200, priceInclMoms: 6500, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop', description: 'Til 5-7 tons gravemaskiner', inStock: true, sku: 'RD-5003' },
  { id: 26, title: 'Dæk 10.0/75-15.3 12PR', brand: 'BKT', category: 'Larvefødder & dæk', categorySlug: 'larvefoedder-daek', price: 2100, priceInclMoms: 2625, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop', description: 'Implementdæk til diverse maskiner', inStock: true, sku: 'RD-5004' },
  { id: 27, title: 'Kompakt dæk 12-16.5 14PR', brand: 'Galaxy', category: 'Larvefødder & dæk', categorySlug: 'larvefoedder-daek', price: 3400, priceInclMoms: 4250, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop', description: 'Bobcat/minilæsser dæk', inStock: false, sku: 'RD-5005' },
  { id: 28, title: 'Stållarve komplet 300mm', brand: 'ITR', category: 'Larvefødder & dæk', categorySlug: 'larvefoedder-daek', price: 8900, priceInclMoms: 11125, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop', description: 'Stållarve komplet sæt (2 stk)', inStock: true, sku: 'RD-5006' },

  // ── Hydraulikslanger ──
  { id: 29, title: 'Hydraulikslange 1/2" 2m', brand: 'Parker', category: 'Hydraulikslanger', categorySlug: 'hydraulikslanger', price: 480, priceInclMoms: 600, image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop', description: '2-tråds hydraulikslange DN12 med koblinger', inStock: true, sku: 'RD-6001' },
  { id: 30, title: 'Hydraulikslange 3/4" 3m', brand: 'Parker', category: 'Hydraulikslanger', categorySlug: 'hydraulikslanger', price: 780, priceInclMoms: 975, image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop', description: '2-tråds hydraulikslange DN20 med koblinger', inStock: true, sku: 'RD-6002' },
  { id: 31, title: 'Hurtigkobling sæt flat-face', brand: 'Faster', category: 'Hydraulikslanger', categorySlug: 'hydraulikslanger', price: 1250, priceInclMoms: 1563, image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop', description: 'Flat-face hurtigkobling 1/2" han+hun', inStock: true, sku: 'RD-6003' },
  { id: 32, title: 'Slangeklemme sæt (10 stk)', brand: 'Universal', category: 'Hydraulikslanger', categorySlug: 'hydraulikslanger', price: 185, priceInclMoms: 231, image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop', description: 'Rustfri slangeklemmer Ø20-32mm', inStock: true, sku: 'RD-6004' },
  { id: 33, title: 'Hydraulik manifold 3-vejs', brand: 'Parker', category: 'Hydraulikslanger', categorySlug: 'hydraulikslanger', price: 2400, priceInclMoms: 3000, image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=300&fit=crop', description: '3-vejs fordelerblok med BSP-tilslutning', inStock: false, sku: 'RD-6005' },

  // ── Filtre & servicepakker ──
  { id: 34, title: 'Servicepakke ES35 komplet', brand: 'Eurocomach', category: 'Filtre & servicepakker', categorySlug: 'filtre-servicepakker', price: 1850, priceInclMoms: 2313, image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop', description: 'Alle filtre + 10L olie + fedtpatron', inStock: true, sku: 'RD-7001' },
  { id: 35, title: 'Servicepakke ES50 komplet', brand: 'Eurocomach', category: 'Filtre & servicepakker', categorySlug: 'filtre-servicepakker', price: 2250, priceInclMoms: 2813, image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop', description: 'Alle filtre + 15L olie + fedtpatron', inStock: true, sku: 'RD-7002' },
  { id: 36, title: 'Oliefilter universal sæt', brand: 'Mann', category: 'Filtre & servicepakker', categorySlug: 'filtre-servicepakker', price: 320, priceInclMoms: 400, image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop', description: 'Motoroliefilter til diverse maskiner', inStock: true, sku: 'RD-7003' },
  { id: 37, title: 'Brændstoffilter sæt', brand: 'Mann', category: 'Filtre & servicepakker', categorySlug: 'filtre-servicepakker', price: 450, priceInclMoms: 563, image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop', description: 'For- og finfilter til diesel', inStock: true, sku: 'RD-7004' },
  { id: 38, title: 'Hydraulikfilter returlinje', brand: 'Mann', category: 'Filtre & servicepakker', categorySlug: 'filtre-servicepakker', price: 580, priceInclMoms: 725, image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop', description: 'Returlinjefilter 10 micron', inStock: true, sku: 'RD-7005' },
  { id: 39, title: 'Luftfilter ES-serie', brand: 'Eurocomach', category: 'Filtre & servicepakker', categorySlug: 'filtre-servicepakker', price: 520, priceInclMoms: 650, image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop', description: 'Primær + sekundær luftfilter sæt', inStock: false, sku: 'RD-7006' },

  // ── Olie & smøremidler ──
  { id: 40, title: 'Motorolie 15W-40 5L', brand: 'Q8', category: 'Olie & smøremidler', categorySlug: 'olie-smoerremidler', price: 345, priceInclMoms: 431, image: 'https://images.unsplash.com/photo-1600861194802-a928854a4918?w=400&h=300&fit=crop', description: 'Mineralsk motorolie ACEA E7', inStock: true, sku: 'RD-8001' },
  { id: 41, title: 'Motorolie 15W-40 20L', brand: 'Q8', category: 'Olie & smøremidler', categorySlug: 'olie-smoerremidler', price: 1150, priceInclMoms: 1438, image: 'https://images.unsplash.com/photo-1600861194802-a928854a4918?w=400&h=300&fit=crop', description: 'Mineralsk motorolie ACEA E7 dunk', inStock: true, sku: 'RD-8002' },
  { id: 42, title: 'Hydraulikolie HLP46 20L', brand: 'Q8', category: 'Olie & smøremidler', categorySlug: 'olie-smoerremidler', price: 980, priceInclMoms: 1225, image: 'https://images.unsplash.com/photo-1600861194802-a928854a4918?w=400&h=300&fit=crop', description: 'Hydraulikolie ISO VG46', inStock: true, sku: 'RD-8003' },
  { id: 43, title: 'Hydraulikolie HLP46 200L', brand: 'Q8', category: 'Olie & smøremidler', categorySlug: 'olie-smoerremidler', price: 6500, priceInclMoms: 8125, image: 'https://images.unsplash.com/photo-1600861194802-a928854a4918?w=400&h=300&fit=crop', description: 'Hydraulikolie ISO VG46 tønde', inStock: true, sku: 'RD-8004' },
  { id: 44, title: 'Universalfedt EP2 400g', brand: 'Q8', category: 'Olie & smøremidler', categorySlug: 'olie-smoerremidler', price: 65, priceInclMoms: 81, image: 'https://images.unsplash.com/photo-1600861194802-a928854a4918?w=400&h=300&fit=crop', description: 'Lithium EP2 fedtpatron', inStock: true, sku: 'RD-8005' },
  { id: 45, title: 'Gearolie 80W-90 5L', brand: 'Q8', category: 'Olie & smøremidler', categorySlug: 'olie-smoerremidler', price: 420, priceInclMoms: 525, image: 'https://images.unsplash.com/photo-1600861194802-a928854a4918?w=400&h=300&fit=crop', description: 'GL-5 gearolie til akseldrev', inStock: true, sku: 'RD-8006' },
  { id: 46, title: 'Kølervæske -36°C 5L', brand: 'Q8', category: 'Olie & smøremidler', categorySlug: 'olie-smoerremidler', price: 195, priceInclMoms: 244, image: 'https://images.unsplash.com/photo-1600861194802-a928854a4918?w=400&h=300&fit=crop', description: 'Blå kølervæske klar til brug', inStock: true, sku: 'RD-8007' },
  { id: 47, title: 'Multispray 500ml', brand: 'CRC', category: 'Olie & smøremidler', categorySlug: 'olie-smoerremidler', price: 85, priceInclMoms: 106, image: 'https://images.unsplash.com/photo-1600861194802-a928854a4918?w=400&h=300&fit=crop', description: 'Smøre-, rust- og beskyttelsesmiddel', inStock: true, sku: 'RD-8008' },
];
