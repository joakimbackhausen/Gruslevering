import { sql } from "drizzle-orm";
import {
  pgTable, text, serial, integer, numeric, boolean, jsonb, timestamp, pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const unitEnum = pgEnum("unit", ["bigbag", "saek", "stk", "m3"]);
export const deliveryMethodEnum = pgEnum("delivery_method", ["bigbag", "tipvogn", "afhentning"]);
export const orderStatusEnum = pgEnum("order_status", ["modtaget", "bekraeftet", "under_levering", "leveret"]);

// Users (for AdminJS auth)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull().default(""),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  wcId: integer("wc_id").unique(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").default(""),
  image: text("image").default(""),
  sortOrder: integer("sort_order").default(0),
  parentId: integer("parent_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Products
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  wcId: integer("wc_id").unique(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  sku: text("sku").default(""),
  description: text("description").default(""),
  basePrice: numeric("base_price", { precision: 10, scale: 2 }).notNull(),
  salePrice: numeric("sale_price", { precision: 10, scale: 2 }),
  currency: text("currency").default("DKK"),
  weight: text("weight").default(""),
  volume: text("volume").default(""),
  unit: unitEnum("unit").default("stk"),
  deliveryIncluded: boolean("delivery_included").default(true),
  image: text("image").default(""),
  images: jsonb("images").default([]),
  variants: jsonb("variants"),
  tieredPricing: jsonb("tiered_pricing"),
  featured: boolean("featured").default(false),
  seoTitle: text("seo_title").default(""),
  seoDescription: text("seo_description").default(""),
  categoryId: integer("category_id"),
  categoryIds: jsonb("category_ids").default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  wcOrderId: integer("wc_order_id"),
  paymentUrl: text("payment_url").default(""),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerAddress: text("customer_address").default(""),
  customerZip: text("customer_zip").default(""),
  customerCity: text("customer_city").default(""),
  customerCompany: text("customer_company").default(""),
  lines: jsonb("lines").notNull(),
  deliveryMethod: deliveryMethodEnum("delivery_method").notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).default("0"),
  deliveryFee: numeric("delivery_fee", { precision: 10, scale: 2 }).default("0"),
  total: numeric("total", { precision: 10, scale: 2 }).default("0"),
  status: orderStatusEnum("status").default("modtaget"),
  notes: text("notes").default(""),
  discountCode: text("discount_code").default(""),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Pages
export const pages = pgTable("pages", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").default(""),
  seoTitle: text("seo_title").default(""),
  seoDescription: text("seo_description").default(""),
  published: boolean("published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Site Settings (single row)
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").default("Kaervang Materialer ApS"),
  phone: text("phone").default("+45 72 49 44 44"),
  email: text("email").default("Info@kaervangmaterialer.dk"),
  address: text("address").default("Tylstrupvej 1, 9382 Tylstrup"),
  openingHours: text("opening_hours").default("Hverdage 8:00 - 16:00"),
  usps: jsonb("usps"),
  socialMedia: jsonb("social_media"),
  trustpilotUrl: text("trustpilot_url").default(""),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users).pick({ email: true, password: true, name: true });
export const insertProductSchema = createInsertSchema(products);
export const insertCategorySchema = createInsertSchema(categories);
export const insertOrderSchema = createInsertSchema(orders);
export const insertPageSchema = createInsertSchema(pages);

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Product = typeof products.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Page = typeof pages.$inferSelect;
export type SiteSettings = typeof siteSettings.$inferSelect;
