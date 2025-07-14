-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table (Platform Users: Sellers, Admins)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  telegram_id BIGINT UNIQUE,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'seller', -- 'seller', 'admin'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stores Table (Telegram Shops)
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  telegram_bot_token TEXT UNIQUE,
  telegram_bot_username TEXT UNIQUE,
  telegram_chat_id BIGINT, -- Chat ID for notifications
  currency TEXT NOT NULL DEFAULT 'UZS',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories Table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  order_index INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products Table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  discount_price NUMERIC(10, 2),
  image_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders Table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  customer_telegram_id BIGINT NOT NULL,
  customer_username TEXT,
  customer_first_name TEXT,
  customer_last_name TEXT,
  total_amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'shipped', 'completed', 'cancelled'
  payment_method TEXT, -- 'telegram', 'payme', 'click', 'cash'
  payment_status TEXT NOT NULL DEFAULT 'unpaid', -- 'unpaid', 'paid', 'refunded'
  delivery_address TEXT,
  contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Items Table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INT NOT NULL,
  price_at_purchase NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments Table (for tracking payment transactions)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  method TEXT NOT NULL, -- 'telegram', 'payme', 'click'
  transaction_id TEXT UNIQUE, -- External transaction ID
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'failed', 'refunded'
  payload JSONB, -- Raw payment gateway response
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications Table (for platform-level notifications)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'new_order', 'payment_success', 'system_alert'
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Settings Table (Platform-wide settings, e.g., commission rates)
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Policies for 'users' table
CREATE POLICY "Allow all for admins" ON users FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
CREATE POLICY "Allow self-read for users" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow self-update for users" ON users FOR UPDATE USING (auth.uid() = id);

-- Policies for 'stores' table
CREATE POLICY "Allow all for admins" ON stores FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
CREATE POLICY "Allow sellers to manage their stores" ON stores FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Allow anonymous read for storefront" ON stores FOR SELECT USING (TRUE);

-- Policies for 'categories' table
CREATE POLICY "Allow all for admins" ON categories FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
CREATE POLICY "Allow sellers to manage their categories" ON categories FOR ALL USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Allow anonymous read for storefront" ON categories FOR SELECT USING (TRUE);

-- Policies for 'products' table
CREATE POLICY "Allow all for admins" ON products FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
CREATE POLICY "Allow sellers to manage their products" ON products FOR ALL USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Allow anonymous read for storefront" ON products FOR SELECT USING (TRUE);

-- Policies for 'orders' table
CREATE POLICY "Allow all for admins" ON orders FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
CREATE POLICY "Allow sellers to manage their orders" ON orders FOR ALL USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Allow anonymous read for storefront" ON orders FOR SELECT USING (TRUE); -- For order status check by customer

-- Policies for 'order_items' table
CREATE POLICY "Allow all for admins" ON order_items FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
CREATE POLICY "Allow sellers to manage their order items" ON order_items FOR ALL USING (order_id IN (SELECT id FROM orders WHERE store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())));
CREATE POLICY "Allow anonymous read for storefront" ON order_items FOR SELECT USING (TRUE);

-- Policies for 'payments' table
CREATE POLICY "Allow all for admins" ON payments FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
CREATE POLICY "Allow sellers to view their payments" ON payments FOR SELECT USING (order_id IN (SELECT id FROM orders WHERE store_id IN (SELECT id FROM stores WHERE user_id = auth.uid())));
CREATE POLICY "Allow anonymous insert for payment webhooks" ON payments FOR INSERT WITH CHECK (TRUE); -- Payment gateways will insert

-- Policies for 'notifications' table
CREATE POLICY "Allow all for admins" ON notifications FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
CREATE POLICY "Allow users to manage their notifications" ON notifications FOR ALL USING (user_id = auth.uid());

-- Policies for 'settings' table
CREATE POLICY "Allow all for admins" ON settings FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
CREATE POLICY "Allow anonymous read for public settings" ON settings FOR SELECT USING (TRUE); -- If some settings are public

-- Functions for Supabase Auth (if using email/password for sellers/admins)
-- These are examples and might need adjustment based on Supabase's exact auth setup
-- For Telegram Auth, Supabase's built-in OAuth or custom JWT handling will be used.

-- Function to get user role (example, Supabase RLS handles most of this)
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID) RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN (SELECT role FROM users WHERE id = user_id);
END;
$$;

-- Trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


