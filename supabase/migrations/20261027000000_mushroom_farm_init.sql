-- ====================================================================
-- Mushroom Farm Manager - Production Schema & Migrations
-- Target: Supabase (PostgreSQL 15+)
-- 16 Tables, RLS Policies, Indexes, Triggers, & Stored Procedures
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES (Authenticated Users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT DEFAULT 'farm_manager' CHECK (role IN ('owner', 'farm_manager', 'operator', 'accountant')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. FARMS
CREATE TABLE IF NOT EXISTS public.farms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    gstin TEXT,
    upi_id TEXT,
    currency TEXT DEFAULT 'INR',
    weight_unit TEXT DEFAULT 'kg',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CUSTOMERS
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT NOT NULL,
    total_purchases_amount NUMERIC(14, 2) DEFAULT 0.00,
    total_orders_count INTEGER DEFAULT 0,
    outstanding_balance NUMERIC(14, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SUPPLIERS
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    products_supplied TEXT NOT NULL,
    total_purchases_amount NUMERIC(14, 2) DEFAULT 0.00,
    outstanding_payables NUMERIC(14, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PRODUCTION BATCHES
CREATE TABLE IF NOT EXISTS public.production_batches (
    id TEXT PRIMARY KEY, -- e.g. BATCH-2026-OYS-01
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    variety TEXT NOT NULL CHECK (variety IN ('Oyster (Dhingri)', 'Button (Agaricus)', 'Milky (Calocybe)', 'Shiitake', 'King Oyster', 'Paddy Straw', 'Custom')),
    custom_variety_name TEXT,
    start_date DATE NOT NULL,
    expected_harvest_date DATE NOT NULL,
    actual_harvest_date DATE,
    status TEXT NOT NULL DEFAULT 'Inoculation' CHECK (status IN ('Inoculation', 'Spawn Run', 'Pinheading', 'Fruiting', 'Completed', 'Terminated')),
    bag_count INTEGER NOT NULL DEFAULT 0,
    spawn_quantity_kg NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    spawn_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    spawn_supplier TEXT,
    substrate_type TEXT NOT NULL CHECK (substrate_type IN ('Wheat Straw', 'Paddy Straw', 'Sawdust', 'Sugarcane Bagasse', 'Cotton Waste', 'Compost (Button)', 'Other')),
    substrate_quantity_kg NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    substrate_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    labour_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    electricity_water_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    other_costs NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_harvested_kg NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    rejected_kg NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    saleable_kg NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_batch_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    cost_per_kg NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    biological_efficiency NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. HARVEST RECORDS (Flushes)
CREATE TABLE IF NOT EXISTS public.harvest_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id TEXT NOT NULL REFERENCES public.production_batches(id) ON DELETE CASCADE,
    flush_number INTEGER NOT NULL DEFAULT 1,
    harvest_date DATE NOT NULL,
    quantity_kg NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    rejected_kg NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    saleable_kg NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    grade TEXT DEFAULT 'Grade A',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. INVENTORY ITEMS
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id TEXT PRIMARY KEY,
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    category TEXT NOT NULL CHECK (category IN ('Fresh Mushroom', 'Packaging Material', 'Farming Supply')),
    name TEXT NOT NULL,
    variety TEXT,
    batch_id TEXT REFERENCES public.production_batches(id) ON DELETE SET NULL,
    unit TEXT NOT NULL DEFAULT 'kg',
    harvested_stock NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    reserved_stock NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    sold_stock NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    spoiled_stock NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    available_stock NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    harvest_date DATE,
    expiry_date DATE,
    reorder_level NUMERIC(12, 2) NOT NULL DEFAULT 10.00,
    unit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. INVENTORY MOVEMENTS (Stock Audit Log)
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_item_id TEXT NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('HARVEST_IN', 'ORDER_RESERVED', 'ORDER_RELEASED', 'SALE_FULFILLED', 'SPOILAGE_DEDUCTED', 'MANUAL_ADJUSTMENT')),
    quantity NUMERIC(10, 2) NOT NULL,
    reference_id TEXT, -- e.g. order_id, batch_id, or sale_id
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ORDERS
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY, -- e.g. ORD-2026-101
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    order_date DATE NOT NULL,
    delivery_date DATE NOT NULL,
    variety TEXT NOT NULL,
    quantity_kg NUMERIC(10, 2) NOT NULL,
    price_per_kg NUMERIC(10, 2) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    advance_payment NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    balance_payment NUMERIC(12, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Confirmed', 'Processing', 'Ready for Dispatch', 'Dispatched', 'Completed', 'Cancelled')),
    stock_reserved BOOLEAN NOT NULL DEFAULT FALSE,
    stock_deducted BOOLEAN NOT NULL DEFAULT FALSE,
    sale_invoice_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ORDER ITEMS
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    variety TEXT NOT NULL,
    quantity_kg NUMERIC(10, 2) NOT NULL,
    price_per_kg NUMERIC(10, 2) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL
);

-- 11. SALES (Invoices)
CREATE TABLE IF NOT EXISTS public.sales (
    id TEXT PRIMARY KEY, -- e.g. INV-2026-001
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    order_id TEXT REFERENCES public.orders(id) ON DELETE SET NULL,
    sale_date DATE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT,
    variety TEXT NOT NULL,
    quantity_kg NUMERIC(10, 2) NOT NULL,
    price_per_kg NUMERIC(10, 2) NOT NULL,
    discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    delivery_charges NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL,
    amount_received NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    outstanding_payment NUMERIC(12, 2) NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'UPI', 'Bank Transfer', 'Cheque')),
    payment_status TEXT NOT NULL DEFAULT 'Unpaid' CHECK (payment_status IN ('Paid', 'Partial', 'Unpaid')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. SALE ITEMS
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id TEXT NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    variety TEXT NOT NULL,
    quantity_kg NUMERIC(10, 2) NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL
);

-- 13. PAYMENTS (Collection Transactions)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id TEXT NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    payment_date DATE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'UPI', 'Bank Transfer', 'Cheque')),
    transaction_ref TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. EXPENSES
CREATE TABLE IF NOT EXISTS public.expenses (
    id TEXT PRIMARY KEY, -- e.g. EXP-2026-01
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'UPI', 'Bank Transfer', 'Cheque')),
    supplier TEXT,
    receipt_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. PURCHASE RECORDS (Procurement from Suppliers)
CREATE TABLE IF NOT EXISTS public.purchase_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    purchase_date DATE NOT NULL,
    item_description TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL,
    unit TEXT NOT NULL,
    total_cost NUMERIC(12, 2) NOT NULL,
    amount_paid NUMERIC(12, 2) NOT NULL,
    outstanding NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- Performance Indexes
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_batches_farm ON public.production_batches(farm_id);
CREATE INDEX IF NOT EXISTS idx_batches_variety ON public.production_batches(variety);
CREATE INDEX IF NOT EXISTS idx_batches_status ON public.production_batches(status);
CREATE INDEX IF NOT EXISTS idx_flushes_batch ON public.harvest_records(batch_id);
CREATE INDEX IF NOT EXISTS idx_inventory_farm ON public.inventory_items(farm_id);
CREATE INDEX IF NOT EXISTS idx_orders_farm ON public.orders(farm_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_sales_farm ON public.sales(farm_id);
CREATE INDEX IF NOT EXISTS idx_expenses_farm ON public.expenses(farm_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);

-- ====================================================================
-- Row Level Security (RLS) Policies
-- User can only access data belonging to their assigned farm
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.harvest_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can select/update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Farms: Owners/Managers can access their farms
CREATE POLICY "Users can access their farms" ON public.farms FOR ALL USING (owner_id = auth.uid());

-- Batches, Orders, Sales, Inventory: Filtered by farm ownership
CREATE POLICY "Farm batches access" ON public.production_batches FOR ALL USING (
    farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid())
);
CREATE POLICY "Farm inventory access" ON public.inventory_items FOR ALL USING (
    farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid())
);
CREATE POLICY "Farm orders access" ON public.orders FOR ALL USING (
    farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid())
);
CREATE POLICY "Farm sales access" ON public.sales FOR ALL USING (
    farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid())
);
CREATE POLICY "Farm expenses access" ON public.expenses FOR ALL USING (
    farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid())
);
CREATE POLICY "Farm customers access" ON public.customers FOR ALL USING (
    farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid())
);
CREATE POLICY "Farm suppliers access" ON public.suppliers FOR ALL USING (
    farm_id IN (SELECT id FROM public.farms WHERE owner_id = auth.uid())
);

-- ====================================================================
-- Critical Atomic Procedure: Complete & Fulfill Order
-- Prevents duplicate stock deductions and duplicate invoice creation
-- ====================================================================
CREATE OR REPLACE FUNCTION public.fulfill_order(p_order_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_new_sale_id TEXT;
    v_stock RECORD;
BEGIN
    -- 1. Fetch and lock order row
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;

    IF v_order.stock_deducted THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order already completed and stock deducted');
    END IF;

    -- 2. Deduct from inventory
    SELECT * INTO v_stock FROM public.inventory_items 
    WHERE farm_id = v_order.farm_id AND variety = v_order.variety AND category = 'Fresh Mushroom'
    FOR UPDATE;

    IF FOUND THEN
        UPDATE public.inventory_items
        SET 
            reserved_stock = GREATEST(0, reserved_stock - v_order.quantity_kg),
            sold_stock = sold_stock + v_order.quantity_kg,
            available_stock = GREATEST(0, harvested_stock - (reserved_stock - v_order.quantity_kg) - (sold_stock + v_order.quantity_kg) - spoiled_stock),
            updated_at = NOW()
        WHERE id = v_stock.id;
    END IF;

    -- 3. Create Sale Invoice
    v_new_sale_id := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 900 + 100)::TEXT, 3, '0');

    INSERT INTO public.sales (
        id, farm_id, order_id, sale_date, customer_name, customer_phone,
        customer_address, variety, quantity_kg, price_per_kg, discount,
        delivery_charges, total_amount, amount_received, outstanding_payment,
        payment_method, payment_status, notes
    ) VALUES (
        v_new_sale_id, v_order.farm_id, v_order.id, CURRENT_DATE, v_order.customer_name,
        v_order.customer_phone, v_order.delivery_address, v_order.variety,
        v_order.quantity_kg, v_order.price_per_kg, 0.00, 0.00, v_order.total_amount,
        v_order.advance_payment, GREATEST(0, v_order.total_amount - v_order.advance_payment),
        'UPI', CASE WHEN v_order.advance_payment >= v_order.total_amount THEN 'Paid' WHEN v_order.advance_payment > 0 THEN 'Partial' ELSE 'Unpaid' END,
        'Auto-generated from fulfilled Order #' || v_order.id
    );

    -- 4. Mark order as completed and stock deducted
    UPDATE public.orders
    SET 
        status = 'Completed',
        stock_reserved = FALSE,
        stock_deducted = TRUE,
        sale_invoice_id = v_new_sale_id,
        updated_at = NOW()
    WHERE id = p_order_id;

    RETURN jsonb_build_object('success', true, 'invoice_id', v_new_sale_id);
END;
$$;
