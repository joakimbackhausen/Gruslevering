/**
 * Data source — exclusively uses Strapi CMS.
 * Re-exports all data fetching functions and types from strapi.ts.
 */

import {
  fetchAllProducts,
  fetchProductById,
  fetchCategories,
  fetchPageBySlug,
  fetchSiteSettings,
  createOrder,
} from './strapi.js';

export {
  fetchAllProducts,
  fetchProductById,
  fetchCategories,
  fetchPageBySlug,
  fetchSiteSettings,
  createOrder,
};

export type {
  Product,
  Category,
  VariantGroup,
  VariantOption,
  TieredPrice,
  OrderLine,
  CreateOrderInput,
} from './strapi.js';
