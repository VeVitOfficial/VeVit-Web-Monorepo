DROP TABLE IF EXISTS store_download_entitlements, store_inventory_movements, store_payment_events,
    store_security_rate_limits, store_download_grants, store_checkout_snapshots,
    store_order_items, store_orders, store_products CASCADE;

CREATE TABLE store_products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    short_desc VARCHAR(255),
    price DECIMAL(10,2) NOT NULL,
    sale_price DECIMAL(10,2) NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('physical','digital')),
    stock INT NULL,
    images TEXT,
    download_file VARCHAR(500) NULL,
    stripe_price_id VARCHAR(100) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    featured BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE store_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(20) NOT NULL UNIQUE,
    user_id TEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','paid','processing','shipped','delivered','cancelled','refunded')),
    total DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'czk',
    stripe_session_id VARCHAR(255) NULL,
    stripe_payment_intent VARCHAR(255) NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    shipping_address TEXT,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE store_order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES store_orders(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES store_products(id) ON DELETE RESTRICT,
    product_name VARCHAR(255) NOT NULL,
    product_type VARCHAR(20) NOT NULL CHECK (product_type IN ('physical','digital')),
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    download_token VARCHAR(64) NULL,
    download_expires_at TIMESTAMP NULL,
    download_count INT NOT NULL DEFAULT 0
);
