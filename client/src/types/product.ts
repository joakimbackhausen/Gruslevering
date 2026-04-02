export interface VariantGroup {
  label: string;
  options: VariantOption[];
}

export interface VariantOption {
  name: string;
  priceDiff: number;
  image?: string;
  skuSuffix?: string;
  inStock: boolean;
}

export interface TieredPrice {
  minQty: number;
  maxQty: number | null;
  price: number;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  sku: string;
  basePrice: number;
  salePrice: number | null;
  currency: string;
  image: string;
  images: string[];
  category: string;
  categorySlug: string;
  description: string;
  weight: string;
  volume: string;
  unit: 'bigbag' | 'saek' | 'stk' | 'm3';
  deliveryIncluded: boolean;
  variants: VariantGroup[] | null;
  tieredPricing: TieredPrice[] | null;
  featured: boolean;
  url: string;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  description: string;
  image: string;
  count: number;
  url: string;
  parentId: number | null;
  sortOrder: number;
}

export interface OrderLine {
  productId: string;
  title: string;
  variant?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface SiteSettings {
  companyName: string;
  phone: string;
  email: string;
  address: string;
  openingHours: string;
  usps: { icon: string; text: string }[];
  socialMedia: Record<string, string>;
  trustpilotUrl: string;
}
