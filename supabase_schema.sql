-- ==============================================================================
-- ⚡ VORTEX APEX E-COMMERCE ENGINE // SUPABASE POSTGRESQL SCHEMA
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY DEFAULT 'usr_' || replace(uuid_generate_v4()::text, '-', ''),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY DEFAULT 'prod_' || replace(uuid_generate_v4()::text, '-', ''),
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    tag TEXT,
    category TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    original_price NUMERIC(10, 2) CHECK (original_price >= price),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    rating NUMERIC(3, 2) DEFAULT 5.0,
    reviews_count INTEGER DEFAULT 0,
    image_url TEXT NOT NULL,
    description TEXT NOT NULL,
    features JSONB DEFAULT '[]'::jsonb,
    specs JSONB DEFAULT '{}'::jsonb,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CART ITEMS TABLE (Persistent Cart State Engine)
CREATE TABLE IF NOT EXISTS public.cart_items (
    id TEXT PRIMARY KEY DEFAULT 'cart_' || replace(uuid_generate_v4()::text, '-', ''),
    cart_key TEXT NOT NULL, -- user_id or guest_session_id
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    added_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (cart_key, product_id)
);

-- 4. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY DEFAULT 'ord_' || replace(uuid_generate_v4()::text, '-', ''),
    order_number TEXT UNIQUE NOT NULL,
    user_id TEXT,
    customer_email TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    shipping_address JSONB NOT NULL,
    shipping_method TEXT NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    discount_amount NUMERIC(10, 2) DEFAULT 0,
    discount_code TEXT,
    tax NUMERIC(10, 2) NOT NULL,
    shipping_cost NUMERIC(10, 2) NOT NULL,
    total NUMERIC(10, 2) NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'STRIPE_SANDBOX_CARD',
    payment_status TEXT NOT NULL DEFAULT 'PAID' CHECK (payment_status IN ('PAID', 'PENDING', 'REFUNDED', 'FAILED')),
    payment_intent_id TEXT NOT NULL,
    refunded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
    id TEXT PRIMARY KEY DEFAULT 'oi_' || replace(uuid_generate_v4()::text, '-', ''),
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    sku TEXT,
    price NUMERIC(10, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    image_url TEXT,
    subtotal NUMERIC(10, 2) NOT NULL
);

-- 6. INVENTORY AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.inventory_logs (
    id TEXT PRIMARY KEY DEFAULT 'inv_log_' || replace(uuid_generate_v4()::text, '-', ''),
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    change_amount INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reason TEXT NOT NULL CHECK (reason IN ('INITIAL_CATALOG_SEED', 'ORDER_CHECKOUT', 'ORDER_REFUND', 'ADMIN_ADJUSTMENT', 'OPERATOR_MANUAL_OVERRIDE')),
    reference_id TEXT,
    order_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SANDBOX TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.sandbox_transactions (
    id TEXT PRIMARY KEY DEFAULT 'tx_' || replace(uuid_generate_v4()::text, '-', ''),
    payment_intent_id TEXT NOT NULL,
    order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'succeeded',
    card_brand TEXT,
    card_last4 TEXT,
    risk_score INTEGER DEFAULT 10,
    latency_ms INTEGER DEFAULT 500,
    three_d_secure BOOLEAN DEFAULT FALSE,
    raw_payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. COUPONS TABLE
CREATE TABLE IF NOT EXISTS public.coupons (
    code TEXT PRIMARY KEY,
    discount_percent INTEGER CHECK (discount_percent BETWEEN 1 AND 100),
    discount_amount NUMERIC(10, 2) CHECK (discount_amount >= 0),
    description TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 🚀 POSTGRESQL ATOMIC TRANSACTION FUNCTION (Checkout + Stock Decrement)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.execute_atomic_checkout(
    p_order_id TEXT,
    p_order_number TEXT,
    p_user_id TEXT,
    p_customer_email TEXT,
    p_customer_name TEXT,
    p_shipping_address JSONB,
    p_shipping_method TEXT,
    p_subtotal NUMERIC,
    p_discount_amount NUMERIC,
    p_discount_code TEXT,
    p_tax NUMERIC,
    p_shipping_cost NUMERIC,
    p_total NUMERIC,
    p_payment_intent_id TEXT,
    p_card_brand TEXT,
    p_card_last4 TEXT,
    p_latency_ms INTEGER,
    p_three_d_secure BOOLEAN,
    p_items JSONB -- array of objects: [{"productId": "...", "quantity": 1, "price": 100, "name": "..."}]
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_item JSONB;
    v_product_id TEXT;
    v_qty INTEGER;
    v_current_stock INTEGER;
    v_prod_name TEXT;
    v_sku TEXT;
    v_image_url TEXT;
    v_stock_logs JSONB := '[]'::jsonb;
BEGIN
    -- 1. Validate and atomically lock/decrement stock for all items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := v_item->>'productId';
        v_qty := (v_item->>'quantity')::INTEGER;

        -- Lock row with FOR UPDATE
        SELECT stock_quantity, name, sku, image_url
        INTO v_current_stock, v_prod_name, v_sku, v_image_url
        FROM public.products
        WHERE id = v_product_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product with ID % does not exist.', v_product_id;
        END IF;

        IF v_current_stock < v_qty THEN
            RAISE EXCEPTION 'Insufficient stock for "%". Required: %, Available: %', v_prod_name, v_qty, v_current_stock;
        END IF;

        -- Decrement stock atomically
        UPDATE public.products
        SET stock_quantity = stock_quantity - v_qty
        WHERE id = v_product_id;

        -- Insert into audit log
        INSERT INTO public.inventory_logs (
            product_id, product_name, change_amount, previous_stock, new_stock, reason, reference_id, order_number
        ) VALUES (
            v_product_id, v_prod_name, -v_qty, v_current_stock, (v_current_stock - v_qty), 'ORDER_CHECKOUT', p_order_id, p_order_number
        );
    END LOOP;

    -- 2. Insert Order
    INSERT INTO public.orders (
        id, order_number, user_id, customer_email, customer_name, shipping_address, shipping_method,
        subtotal, discount_amount, discount_code, tax, shipping_cost, total, payment_method, payment_status, payment_intent_id
    ) VALUES (
        p_order_id, p_order_number, p_user_id, p_customer_email, p_customer_name, p_shipping_address, p_shipping_method,
        p_subtotal, p_discount_amount, p_discount_code, p_tax, p_shipping_cost, p_total, 'STRIPE_SANDBOX_CARD', 'PAID', p_payment_intent_id
    );

    -- 3. Insert Order Items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        INSERT INTO public.order_items (
            order_id, product_id, product_name, sku, price, quantity, image_url, subtotal
        ) VALUES (
            p_order_id,
            v_item->>'productId',
            v_item->>'name',
            v_item->>'sku',
            (v_item->>'price')::NUMERIC,
            (v_item->>'quantity')::INTEGER,
            v_item->>'image_url',
            ((v_item->>'price')::NUMERIC * (v_item->>'quantity')::INTEGER)
        );
    END LOOP;

    -- 4. Insert Sandbox Transaction
    INSERT INTO public.sandbox_transactions (
        payment_intent_id, order_id, order_number, amount, currency, status, card_brand, card_last4, latency_ms, three_d_secure
    ) VALUES (
        p_payment_intent_id, p_order_id, p_order_number, p_total, 'USD', 'succeeded', p_card_brand, p_card_last4, p_latency_ms, p_three_d_secure
    );

    -- 5. Clear Cart Items for this user/session
    IF p_user_id IS NOT NULL THEN
        DELETE FROM public.cart_items WHERE cart_key = p_user_id OR cart_key = p_customer_email;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'order_number', p_order_number,
        'total', p_total
    );
END;
$$;
