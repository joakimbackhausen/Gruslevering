# WooCommerce Headless Architecture Design

**Date**: 2026-04-05
**Status**: Approved

## Overview

Migrate Gruslevering.dk from local PostgreSQL-only backend to headless WooCommerce architecture. WooCommerce becomes the single source of truth for products, categories, orders, and payments. PostgreSQL serves as a read cache for fast product/category queries.

## Architecture

```
React Frontend (port 3000)
    |
Express API Middleware
    |
    +-- GET /api/products, /api/categories --> PostgreSQL cache (synced from WC)
    +-- POST /api/orders --> WooCommerce REST API v3
    +-- GET /api/orders/:id --> WooCommerce REST API v3
    +-- POST /api/checkout --> Create WC order + get Worldline payment URL
    |
WooCommerce REST API v3 (gruslevering.dk/wp-json/wc/v3/)
    |
Worldline Payment Gateway (redirect-based)
```

## Key Decisions

1. **Full headless WooCommerce** - all products, orders, payments managed in WooCommerce admin
2. **Own checkout UI** - React checkout form, creates WooCommerce order behind the scenes
3. **PostgreSQL as cache** - products/categories synced every 10-15 min for fast reads
4. **Worldline payments** - redirect-based flow via WooCommerce payment gateway
5. **REST API for everything** - full bidirectional data flow

## WooCommerce REST API Endpoints

| Purpose | Method | Endpoint |
|---------|--------|----------|
| List products | GET | `/wp-json/wc/v3/products` |
| Single product | GET | `/wp-json/wc/v3/products/{id}` |
| List categories | GET | `/wp-json/wc/v3/products/categories` |
| Create order | POST | `/wp-json/wc/v3/orders` |
| Get order | GET | `/wp-json/wc/v3/orders/{id}` |
| Payment gateways | GET | `/wp-json/wc/v3/payment_gateways` |

## Authentication

WooCommerce REST API v3 with Consumer Key/Secret (HTTP Basic Auth over HTTPS):
- `WC_CONSUMER_KEY` and `WC_CONSUMER_SECRET` in `.env`
- Base URL: `WC_URL` (https://gruslevering.dk)

## Checkout Flow

1. Customer fills out React checkout form (shipping, billing, notes)
2. Express API creates WooCommerce order via REST API (`status: pending`)
3. WooCommerce returns order with Worldline payment URL
4. Customer is redirected to Worldline payment page
5. After payment, Worldline redirects back to `/ordre-bekraeftelse?order_id=X`
6. Express API fetches order status from WooCommerce to confirm payment

## Product Sync

- Periodic sync every 10-15 minutes via `setInterval` in Express server
- Full product list fetched from WooCommerce REST API v3
- Upserted into PostgreSQL `products` and `categories` tables
- Frontend reads only from PostgreSQL cache (fast, no WC latency)
- Manual sync trigger via admin endpoint (optional)

## Files to Modify

- `server/woocommerce.ts` - NEW: WC REST API client with auth
- `server/data-source.ts` - Update to sync from WC REST API v3
- `server/routes.ts` - Add order creation via WC, checkout endpoint
- `server/index.ts` - Add periodic sync timer
- `shared/schema.ts` - Add `wc_id` fields for WC entity mapping
- `client/src/pages/Checkout.tsx` - Update to use new checkout flow
- `client/src/pages/OrderConfirmation.tsx` - Fetch order status from WC
