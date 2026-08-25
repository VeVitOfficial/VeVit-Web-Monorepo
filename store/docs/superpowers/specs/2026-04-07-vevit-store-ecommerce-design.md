# VeVit Store — E-commerce Platform Design

**Date:** 2026-04-07
**Status:** Approved for implementation

---

## Overview

Full-featured e-commerce platform for `vevit.store` supporting both physical and digital products with Stripe Checkout payments, guest checkout, and admin management panel.

---

## Technical Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vanilla HTML5 + JavaScript (ES6+) + Tailwind CSS (CDN) |
| Backend | PHP 8.x with PDO (no framework, no Composer) |
| Database | MySQL/MariaDB, charset `utf8`, collation `utf8_czech_ci` |
| Hosting | Wedos Apache shared hosting (no npm, no build tools) |
| Payments | Stripe PHP standalone library (`lib/stripe-php/init.php`) |
| Font | Sora from Google Fonts |
| Icons | Lucide Icons via CDN |

---

## Design System

**Style:** Neomorphic/soft UI, dark theme

| Element | Value |
|---------|-------|
| Background (page) | `#0f0f14` |
| Background (cards/panels) | `#1a1a24` |
| Background (elevated/hover) | `#22223a` |
| Primary accent | `#7c3aed` (fialová) |
| Accent hover | `#a855f7` |
| Success/in-stock | `#22c55e` (zelená) |
| Sold out | `#ef4444` (červená) |
| Primary text | `#e2e2f0` |
| Muted text | `#8b8ba8` |
| Heading text | `#ffffff` |
| Border | `rgba(255,255,255,0.08)` default, `rgba(255,255,255,0.15)` hover |
| Box shadow | `inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 24px rgba(0,0,0,0.4)` |
| Border radius | 16px cards, 12px buttons, 8px inputs |
| Font weights | 400/500/600 |

---

## Database Schema

### Tables

**store_categories**
- `id` (int, PK, auto_increment)
- `name` (varchar 100)
- `slug` (varchar 100, unique)
- `icon` (varchar 50, nullable)
- `sort_order` (int, default 0)

**store_products**
- `id` (int, PK, auto_increment)
- `category_id` (int, nullable FK)
- `name`, `slug`, `description`, `short_desc`
- `price`, `sale_price` (decimal 10,2)
- `type` (enum: physical/digital)
- `stock` (int, nullable — NULL = unlimited for digital)
- `images` (text, JSON array)
- `download_file` (varchar 500, path for digital products)
- `stripe_price_id` (varchar 100, nullable)
- `is_active`, `featured` (tinyint)
- `created_at` (datetime)

**store_orders**
- `id` (int, PK, auto_increment)
- `order_number` (varchar 20, unique, format: VVS-YYYY-XXXXX)
- `user_id` (varchar 36, nullable — guest checkout)
- `status` (enum: pending/paid/processing/shipped/delivered/cancelled/refunded)
- `total`, `currency`
- `stripe_session_id`, `stripe_payment_intent`
- `customer_email`, `customer_name`
- `shipping_address` (text, JSON)
- `notes` (text)
- `created_at`, `updated_at`

**store_order_items**
- `id` (int, PK, auto_increment)
- `order_id`, `product_id` (int)
- `product_name` (snapshot at purchase time)
- `product_type` (enum: physical/digital)
- `quantity`, `unit_price`
- `download_token` (varchar 64, one-time download link)
- `download_expires_at` (datetime, 72h window)
- `download_count` (int, max 5)

### Demo Data

- 3 categories: Merch, Digitální produkty, Elektronika
- 5 products: VeVit Tričko, VeVit Hrnek, VeVit Hoodie, VeVit UI Kit, VeVit Ikonky

---

## File Structure

```
vevit.store/
├── index.php                  # Product catalog
├── product.php                # Product detail
├── cart.php                   # Shopping cart
├── checkout.php               # Checkout form
├── success.php                # Payment success
├── cancel.php                 # Payment cancelled
├── download.php               # Digital product download
├── config.php                 # DB connection
├── config_secret.php          # Stripe keys (gitignored)
├── schema.sql                 # DB schema + demo data
├── .htaccess                  # Apache routing + security
├── admin/
│   ├── index.php              # Admin dashboard
│   ├── products.php           # Product CRUD
│   ├── orders.php             # Order management
│   ├── auth.php               # Admin login
│   └── middleware.php         # Auth check
├── api/
│   ├── create-checkout.php    # Stripe session creation
│   ├── webhook.php            # Stripe webhook handler
│   └── products.php           # Product API (filter/paginate)
├── lib/
│   └── stripe-php/
│       └── init.php            # Stripe PHP library
└── assets/
    ├── css/style.css
    └── js/
        ├── app.js             # Global init, navbar, toast
        ├── cart.js            # Cart logic (localStorage)
        └── store.js           # Product listing, filtering
```

---

## Page Specifications

### index.php — Product Catalog

**Navbar:**
- Logo left (VeVit Store, fialový text)
- Search field center (live search via JS)
- Right: cart icon with badge, "Přihlásit se" (placeholder for future SSO)

**Sidebar Filters:**
- Categories (checkboxes)
- Type: Physical / Digital / All
- Price range slider
- Sort: Newest | Cheapest | Most Expensive | Featured

**Product Grid:**
- Responsive: 4 cols (desktop) → 2 cols (tablet) → 1 col (mobile)
- Card: gradient placeholder image, name, short description, price, badge (new/sale), "Add to cart" + "Buy now" icons

**Pagination:** 12 products per page, JS fetch for smooth loading

### product.php — Product Detail

- Large photo gallery (or gradient placeholder)
- Breadcrumb: Home > Category > Product
- Name, description, price
- Physical: quantity selector, "Add to cart", "Buy now"
- Digital: "Buy and download immediately" button

### cart.php — Shopping Cart

- Item list: image, name, price, quantity (+/-), remove
- Summary: subtotal, shipping (free over 1000 Kč, else 99 Kč), total
- "Proceed to checkout" button

### checkout.php — Checkout

**Two-column layout:**

Left — Form:
- Contact: Name, Email
- Shipping address (only if cart contains physical items): Street, City, ZIP, Country
- Order notes (optional)

Right — Order summary:
- Item thumbnails and names
- Total price
- "Pay via Stripe" button → calls `/api/create-checkout.php`

### success.php — Payment Success

- Large green checkmark icon
- "Order received! Order number: VVS-XXXX-XXXXX"
- For digital: immediate download button(s)
- For physical: "We'll notify you when shipped"
- "Back to store" button

### download.php — Digital Download

- Validates token from URL
- Checks: token exists, not expired (72h), order status = paid, download count < 5
- Increments download counter
- Streams file to browser

### Admin Panel

**auth.php:** Separate admin login (bcrypt password in config_secret.php)

**index.php:** Dashboard
- Cards: Total revenue, Orders today, Products in stock, Pending orders

**products.php:** Product management
- Table: ID, Image, Name, Type, Price, Stock, Active, Actions
- Modal form for add/edit
- Soft delete (set is_active = 0)

**orders.php:** Order management
- Table: Number, Date, Customer, Items, Total, Status, Actions
- Filter by status
- Detail view: change status, add notes

---

## API Endpoints

### GET /api/products.php

Query params:
- `category` (slug)
- `type` (physical/digital)
- `search` (string)
- `sort` (featured/cheapest/expensive/newest)
- `page` (int)

Returns: `{ products: [...], page: int }`

### POST /api/create-checkout.php

Body: `{ items: [{product_id, quantity}], email, name, shipping, user_id }`

Returns: `{ url: stripe_checkout_url, order_number }`

### POST /api/webhook.php

Stripe webhook endpoint for payment confirmation

---

## JavaScript Modules

### cart.js

- Cart stored in localStorage as JSON array
- Methods: `get()`, `save()`, `add()`, `remove()`, `updateQuantity()`, `total()`, `count()`, `clear()`, `hasPhysical()`, `updateBadge()`
- Syncs with API at checkout

### store.js

- Product listing with filters and pagination
- Live search with debounce
- Add to cart / buy now actions

### app.js

- Global initialization
- Navbar mobile menu
- Toast notifications

---

## Security Requirements

1. **SQL injection:** All queries via PDO prepared statements
2. **XSS:** All output via `htmlspecialchars()` or `.textContent` (never `.innerHTML` with DB data)
3. **File upload:** MIME type validation (not just extension), max 5MB, store outside web root or .htaccess deny
4. **Download tokens:** `bin2hex(random_bytes(32))` — unpredictable
5. **Admin session:** `session_regenerate_id(true)` after login
6. **CORS:** API allows only `https://vevit.store`
7. **Rate limiting:** Max 5 checkout requests per minute per IP

---

## Product Image Placeholders

Category-based CSS gradients:

| Category | Gradient |
|----------|----------|
| Merch | `linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)` |
| Digitální produkty | `linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)` |
| Elektronika | `linear-gradient(135deg, #14b8a6 0%, #22c55e 100%)` |

---

## Implementation Order

1. `config.php` + `config_secret.php` (template with placeholders)
2. `schema.sql`
3. `.htaccess`
4. `assets/css/style.css`
5. `assets/js/app.js` + `assets/js/cart.js`
6. `index.php` (full catalog page)
7. `product.php`
8. `cart.php`
9. `checkout.php`
10. `api/products.php`
11. `api/create-checkout.php`
12. `api/webhook.php`
13. `success.php` + `cancel.php` + `download.php`
14. `admin/auth.php` + `admin/middleware.php`
15. `admin/index.php` + `admin/products.php` + `admin/orders.php`

---

## Out of Scope (Future Iterations)

- VeVit SSO integration (`vevit_auth` cookie)
- Product image uploads
- Email notifications
- Order history for logged-in users
- Multiple currency support
- Inventory management beyond stock count