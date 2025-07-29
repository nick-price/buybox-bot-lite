const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Database schema initialization
const initializeDatabase = async () => {
  try {
    // Create tables if they don't exist (this would typically be done via migrations)
    console.log('📊 Database connection established');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
};

// User operations
const userOperations = {
  async createUser(userId, email) {
    const { data, error } = await supabase
      .from('users')
      .upsert({ id: userId, email, created_at: new Date().toISOString() })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getUser(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateWebhook(userId, webhookUrl) {
    const { data, error } = await supabase
      .from('users')
      .update({ webhook_url: webhookUrl })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Seller operations
const sellerOperations = {
  async addSeller(userId, sellerId, label) {
    const { data, error } = await supabase
      .from('seller_profiles')
      .insert({
        user_id: userId,
        seller_id: sellerId,
        label: label
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getSellers(userId) {
    const { data, error } = await supabase
      .from('seller_profiles')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data;
  },

  async deleteSeller(userId, sellerId) {
    const { error } = await supabase
      .from('seller_profiles')
      .delete()
      .eq('user_id', userId)
      .eq('seller_id', sellerId);
    
    if (error) throw error;
  }
};

// ASIN operations
const asinOperations = {
  async addAsin(userId, sellerId, asin, title = null) {
    const { data, error } = await supabase
      .from('asins')
      .upsert({
        user_id: userId,
        seller_id: sellerId,
        asin: asin,
        title: title
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getAsins(userId) {
    const { data, error } = await supabase
      .from('asins')
      .select(`
        *,
        seller_profiles!inner(label)
      `)
      .eq('user_id', userId);
    
    if (error) throw error;
    return data;
  },

  async deleteAsin(userId, asin) {
    const { error } = await supabase
      .from('asins')
      .delete()
      .eq('user_id', userId)
      .eq('asin', asin);
    
    if (error) throw error;
  }
};

// BuyBox state operations
const buyboxOperations = {
  async updateBuyBoxState(userId, asin, currentSeller, stockLevel) {
    const { data, error } = await supabase
      .from('buybox_states')
      .upsert({
        user_id: userId,
        asin: asin,
        current_seller: currentSeller,
        stock_level: stockLevel,
        last_seen_timestamp: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getBuyBoxState(userId, asin) {
    const { data, error } = await supabase
      .from('buybox_states')
      .select('*')
      .eq('user_id', userId)
      .eq('asin', asin)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data;
  }
};

// Sales log operations
const salesOperations = {
  async logSale(userId, asin, sellerId, stockBefore, stockAfter, unitsSoldEstimate) {
    const { data, error } = await supabase
      .from('sales_logs')
      .insert({
        user_id: userId,
        asin: asin,
        seller_id: sellerId,
        stock_before: stockBefore,
        stock_after: stockAfter,
        units_sold_estimate: unitsSoldEstimate,
        timestamp: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getSalesLogs(userId, limit = 100, offset = 0) {
    const { data, error } = await supabase
      .from('sales_logs')
      .select(`
        *,
        seller_profiles!inner(label)
      `)
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return data;
  },

  async getSalesCount(userId) {
    const { count, error } = await supabase
      .from('sales_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (error) throw error;
    return count;
  }
};

module.exports = {
  supabase,
  initializeDatabase,
  userOperations,
  sellerOperations,
  asinOperations,
  buyboxOperations,
  salesOperations
}; 