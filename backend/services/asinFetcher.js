const { fetchSellerAsins } = require('../utils/fetchBuyBox');
const { asinOperations, sellerOperations } = require('../db/supabaseClient');

/**
 * Fetch and store ASINs for a specific seller
 * @param {string} userId - User ID
 * @param {string} sellerId - Seller ID
 * @param {string} sellerLabel - Seller label
 * @param {number} limit - Maximum number of ASINs to fetch
 * @returns {Promise<Array>} Array of fetched ASINs
 */
const fetchAndStoreAsins = async (userId, sellerId, sellerLabel, limit = 50) => {
  try {
    console.log(`🔄 Fetching ASINs for seller: ${sellerLabel} (${sellerId})`);
    
    // Fetch ASINs from Rainforest API (UK marketplace)
    const asins = await fetchSellerAsins(sellerId, 'co.uk', limit);
    
    if (asins.length === 0) {
      console.warn(`⚠️ No ASINs found for seller: ${sellerLabel}`);
      return [];
    }

    console.log(`📦 Found ${asins.length} ASINs for seller: ${sellerLabel}`);
    
    // Store ASINs in database
    const storedAsins = [];
    for (const asinData of asins) {
      try {
        const storedAsin = await asinOperations.addAsin(
          userId,
          sellerId,
          asinData.asin,
          asinData.title
        );
        storedAsins.push(storedAsin);
      } catch (error) {
        console.error(`❌ Error storing ASIN ${asinData.asin}:`, error.message);
      }
    }

    console.log(`✅ Successfully stored ${storedAsins.length} ASINs for seller: ${sellerLabel}`);
    return storedAsins;
    
  } catch (error) {
    console.error(`❌ Error fetching ASINs for seller ${sellerLabel}:`, error.message);
    return [];
  }
};

/**
 * Fetch ASINs for all tracked sellers of a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Summary of fetched ASINs
 */
const fetchAllUserAsins = async (userId) => {
  try {
    console.log(`🔄 Fetching ASINs for user: ${userId}`);
    
    // Get all tracked sellers for the user
    const sellers = await sellerOperations.getSellers(userId);
    
    if (sellers.length === 0) {
      console.log(`ℹ️ No sellers found for user: ${userId}`);
      return { totalSellers: 0, totalAsins: 0, sellers: [] };
    }

    const results = [];
    let totalAsins = 0;

    // Fetch ASINs for each seller
    for (const seller of sellers) {
      const asins = await fetchAndStoreAsins(
        userId,
        seller.seller_id,
        seller.label,
        50
      );
      
      results.push({
        sellerId: seller.seller_id,
        sellerLabel: seller.label,
        asinCount: asins.length,
        asins: asins
      });
      
      totalAsins += asins.length;
    }

    console.log(`✅ Completed ASIN fetch for user ${userId}: ${totalAsins} total ASINs across ${sellers.length} sellers`);
    
    return {
      totalSellers: sellers.length,
      totalAsins: totalAsins,
      sellers: results
    };
    
  } catch (error) {
    console.error(`❌ Error fetching ASINs for user ${userId}:`, error.message);
    return { totalSellers: 0, totalAsins: 0, sellers: [], error: error.message };
  }
};

/**
 * Refresh ASINs for a specific seller
 * @param {string} userId - User ID
 * @param {string} sellerId - Seller ID
 * @returns {Promise<Object>} Refresh results
 */
const refreshSellerAsins = async (userId, sellerId) => {
  try {
    // Get seller information
    const sellers = await sellerOperations.getSellers(userId);
    const seller = sellers.find(s => s.seller_id === sellerId);
    
    if (!seller) {
      throw new Error(`Seller ${sellerId} not found for user ${userId}`);
    }

    // Delete existing ASINs for this seller
    const existingAsins = await asinOperations.getAsins(userId);
    const sellerAsins = existingAsins.filter(asin => asin.seller_id === sellerId);
    
    for (const asin of sellerAsins) {
      await asinOperations.deleteAsin(userId, asin.asin);
    }

    console.log(`🗑️ Deleted ${sellerAsins.length} existing ASINs for seller: ${seller.label}`);

    // Fetch fresh ASINs
    const newAsins = await fetchAndStoreAsins(userId, sellerId, seller.label, 50);
    
    return {
      sellerId: sellerId,
      sellerLabel: seller.label,
      deletedCount: sellerAsins.length,
      newCount: newAsins.length,
      asins: newAsins
    };
    
  } catch (error) {
    console.error(`❌ Error refreshing ASINs for seller ${sellerId}:`, error.message);
    throw error;
  }
};

/**
 * Get ASIN statistics for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} ASIN statistics
 */
const getAsinStats = async (userId) => {
  try {
    const asins = await asinOperations.getAsins(userId);
    const sellers = await sellerOperations.getSellers(userId);
    
    const stats = {
      totalAsins: asins.length,
      totalSellers: sellers.length,
      asinsPerSeller: {}
    };

    // Calculate ASINs per seller
    for (const seller of sellers) {
      const sellerAsins = asins.filter(asin => asin.seller_id === seller.seller_id);
      stats.asinsPerSeller[seller.label] = sellerAsins.length;
    }

    return stats;
    
  } catch (error) {
    console.error(`❌ Error getting ASIN stats for user ${userId}:`, error.message);
    throw error;
  }
};

module.exports = {
  fetchAndStoreAsins,
  fetchAllUserAsins,
  refreshSellerAsins,
  getAsinStats
}; 