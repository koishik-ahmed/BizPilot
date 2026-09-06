-- ============================================================
-- BIZPILOT DATABASE SCHEMA
-- Version: 1.0
-- Project: BizPilot
-- Purpose: Inventory + Orders + Reporting foundation
-- ============================================================


-- ============================================================
-- 1. CREATE DATABASE
-- ============================================================

CREATE DATABASE IF NOT EXISTS bizpilot_db;

USE bizpilot_db;


-- ============================================================
-- 2. USERS
-- ============================================================
-- Stores BizPilot business owners/users.
-- Orders will belong to a user/business owner.
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(150) NOT NULL UNIQUE,

    password_hash VARCHAR(255) NOT NULL,

    phone VARCHAR(20),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


-- ============================================================
-- 3. PRODUCTS
-- ============================================================
-- This is the main table for Inventory Management.
--
-- stock_quantity = CURRENT stock
-- low_stock_threshold = point at which product becomes low stock
--
-- SKU is unique within each user's product catalog.
-- ============================================================

CREATE TABLE IF NOT EXISTS products (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNSIGNED NOT NULL,

    sku VARCHAR(100) NOT NULL,

    name VARCHAR(255) NOT NULL,

    description TEXT,

    price DECIMAL(10,2) NOT NULL,

    stock_quantity INT NOT NULL DEFAULT 0,

    low_stock_threshold INT NOT NULL DEFAULT 5,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT chk_product_price
        CHECK (price >= 0),

    CONSTRAINT chk_product_stock
        CHECK (stock_quantity >= 0),

    CONSTRAINT chk_low_stock_threshold
        CHECK (low_stock_threshold >= 0),

    CONSTRAINT fk_products_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    UNIQUE KEY uq_products_user_sku (user_id, sku),
    INDEX idx_products_user (user_id)
);


-- ============================================================
-- 4. STOCK HISTORY
-- ============================================================
-- Every meaningful stock change is recorded here.
--
-- Example:
--
-- Before: 20
-- Sale:    -3
-- After:   17
--
-- quantity_changed = -3
--
-- RESTOCK:
-- Before: 17
-- +10
-- After: 27
--
-- quantity_changed = +10
--
-- This gives us an audit/history trail.
-- ============================================================

CREATE TABLE IF NOT EXISTS stock_history (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    product_id INT UNSIGNED NOT NULL,

    change_type ENUM(
        'SALE',
        'RESTOCK',
        'ADJUSTMENT',
        'RETURN',
        'DAMAGE'
    ) NOT NULL,

    quantity_changed INT NOT NULL,

    previous_stock INT NOT NULL,

    new_stock INT NOT NULL,

    reference_type VARCHAR(50),

    reference_id BIGINT UNSIGNED,

    note VARCHAR(500),

    created_by INT UNSIGNED,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_stock_history_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_stock_history_user
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT chk_stock_history_previous
        CHECK (previous_stock >= 0),

    CONSTRAINT chk_stock_history_new
        CHECK (new_stock >= 0),

    INDEX idx_stock_history_product (
        product_id
    ),

    INDEX idx_stock_history_created_at (
        created_at
    ),

    INDEX idx_stock_history_type (
        change_type
    )
);


-- ============================================================
-- 5. ORDERS
-- ============================================================
-- Orders are NOT part of the Inventory UI itself,
-- but Inventory depends on Orders.
--
-- When an order is successfully created:
--
-- orders
--      ↓
-- order_items
--      ↓
-- inventory stock decreases
--      ↓
-- stock_history records the change
--
-- Later this table will also connect to Courier,
-- Invoice, SMS and Reports.
-- ============================================================

CREATE TABLE IF NOT EXISTS orders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNSIGNED NOT NULL,

    platform VARCHAR(50) NOT NULL DEFAULT 'MANUAL',

    customer_name VARCHAR(150) NOT NULL,

    customer_phone VARCHAR(20) NOT NULL,

    customer_email VARCHAR(150),

    shipping_address TEXT NOT NULL,

    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    status ENUM(
        'PENDING',
        'CONFIRMED',
        'PROCESSING',
        'SHIPPED',
        'DELIVERED',
        'CANCELLED',
        'RETURNED'
    ) NOT NULL DEFAULT 'PENDING',

    payment_status ENUM(
        'PENDING',
        'PAID',
        'FAILED',
        'REFUNDED'
    ) NOT NULL DEFAULT 'PENDING',

    inventory_processed BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_orders_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT chk_order_total
        CHECK (total_amount >= 0),

    INDEX idx_orders_user (
        user_id
    ),

    INDEX idx_orders_status (
        status
    ),

    INDEX idx_orders_created_at (
        created_at
    )
);

-- ============================================================
-- 6. CUSTOMERS
-- ============================================================

CREATE TABLE IF NOT EXISTS customers (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(150),
    address TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_customers_phone (phone)
);


-- ============================================================
-- 7. ORDER ITEMS
-- ============================================================
-- An order can contain multiple products.
--
-- Example:
--
-- Order #1001
--     Black T-Shirt × 2
--     Cap          × 1
--
-- This table connects ORDERS and PRODUCTS.
--
-- IMPORTANT:
-- unit_price is stored here even though PRODUCTS has price.
--
-- Why?
-- If product price changes later:
--
-- Today:      T-Shirt = 650
-- Next month: T-Shirt = 700
--
-- Old order must still show 650.
-- ============================================================

CREATE TABLE IF NOT EXISTS order_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    order_id BIGINT UNSIGNED NOT NULL,

    product_id INT UNSIGNED NOT NULL,

    quantity INT UNSIGNED NOT NULL,

    unit_price DECIMAL(10,2) NOT NULL,

    subtotal DECIMAL(12,2) NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_order_items_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT chk_order_item_quantity
        CHECK (quantity > 0),

    CONSTRAINT chk_order_item_price
        CHECK (unit_price >= 0),

    CONSTRAINT chk_order_item_subtotal
        CHECK (subtotal >= 0),

    INDEX idx_order_items_order (
        order_id
    ),

    INDEX idx_order_items_product (
        product_id
    )
);


-- ============================================================
-- 7. SAMPLE PRODUCT DATA
-- 9. VERIFY DATABASE
-- ============================================================

SELECT
    id,
    sku,
    name,
    price,
    stock_quantity,
    low_stock_threshold,
    is_active
FROM products;