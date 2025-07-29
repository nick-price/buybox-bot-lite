-- BuyBox Bot Lite Database Schema
-- Run this in your Supabase SQL editor

-- Enable Row Level Security (RLS)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret-here';

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  webhook_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seller profiles table
CREATE TABLE IF NOT EXISTS seller_profiles (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id TEXT NOT NULL,
  label TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, seller_id)
);

-- ASINs table
CREATE TABLE IF NOT EXISTS asins (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id TEXT NOT NULL,
  asin TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, asin)
);

-- BuyBox states table
CREATE TABLE IF NOT EXISTS buybox_states (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asin TEXT NOT NULL,
  current_seller TEXT,
  stock_level INTEGER,
  last_seen_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, asin)
);

-- Sales logs table
CREATE TABLE IF NOT EXISTS sales_logs (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asin TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  stock_before INTEGER,
  stock_after INTEGER,
  units_sold_estimate INTEGER NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_seller_profiles_user_id ON seller_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_profiles_seller_id ON seller_profiles(seller_id);
CREATE INDEX IF NOT EXISTS idx_asins_user_id ON asins(user_id);
CREATE INDEX IF NOT EXISTS idx_asins_seller_id ON asins(seller_id);
CREATE INDEX IF NOT EXISTS idx_asins_asin ON asins(asin);
CREATE INDEX IF NOT EXISTS idx_buybox_states_user_id ON buybox_states(user_id);
CREATE INDEX IF NOT EXISTS idx_buybox_states_asin ON buybox_states(asin);
CREATE INDEX IF NOT EXISTS idx_sales_logs_user_id ON sales_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_logs_asin ON sales_logs(asin);
CREATE INDEX IF NOT EXISTS idx_sales_logs_timestamp ON sales_logs(timestamp);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seller_profiles_updated_at BEFORE UPDATE ON seller_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asins_updated_at BEFORE UPDATE ON asins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_buybox_states_updated_at BEFORE UPDATE ON buybox_states
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE asins ENABLE ROW LEVEL SECURITY;
ALTER TABLE buybox_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid()::text = id);

-- Seller profiles policies
CREATE POLICY "Users can view own seller profiles" ON seller_profiles
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own seller profiles" ON seller_profiles
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own seller profiles" ON seller_profiles
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own seller profiles" ON seller_profiles
    FOR DELETE USING (auth.uid()::text = user_id);

-- ASINs policies
CREATE POLICY "Users can view own ASINs" ON asins
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own ASINs" ON asins
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own ASINs" ON asins
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own ASINs" ON asins
    FOR DELETE USING (auth.uid()::text = user_id);

-- BuyBox states policies
CREATE POLICY "Users can view own buybox states" ON buybox_states
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own buybox states" ON buybox_states
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own buybox states" ON buybox_states
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own buybox states" ON buybox_states
    FOR DELETE USING (auth.uid()::text = user_id);

-- Sales logs policies
CREATE POLICY "Users can view own sales logs" ON sales_logs
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own sales logs" ON sales_logs
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Create views for easier data access
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    u.id as user_id,
    u.email,
    COUNT(DISTINCT sp.id) as total_sellers,
    COUNT(DISTINCT a.id) as total_asins,
    COUNT(DISTINCT sl.id) as total_sales
FROM users u
LEFT JOIN seller_profiles sp ON u.id = sp.user_id
LEFT JOIN asins a ON u.id = a.user_id
LEFT JOIN sales_logs sl ON u.id = sl.user_id
GROUP BY u.id, u.email;

-- Create function to get sales summary
CREATE OR REPLACE FUNCTION get_sales_summary(p_user_id TEXT, p_limit INTEGER DEFAULT 50, p_offset INTEGER DEFAULT 0)
RETURNS TABLE (
    asin TEXT,
    seller_label TEXT,
    stock_before INTEGER,
    stock_after INTEGER,
    units_sold_estimate INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sl.asin,
        sp.label as seller_label,
        sl.stock_before,
        sl.stock_after,
        sl.units_sold_estimate,
        sl.timestamp
    FROM sales_logs sl
    LEFT JOIN seller_profiles sp ON sl.seller_id = sp.seller_id AND sl.user_id = sp.user_id
    WHERE sl.user_id = p_user_id
    ORDER BY sl.timestamp DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Insert sample data (optional - for testing)
-- INSERT INTO users (id, email) VALUES ('test-user-1', 'test@example.com');
-- INSERT INTO seller_profiles (user_id, seller_id, label) VALUES ('test-user-1', 'A1B2C3D4E5', 'Test Seller'); 