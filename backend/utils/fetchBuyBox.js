const axios = require('axios');

const RAINFOREST_API_KEY = process.env.RAINFOREST_API_KEY;
const RAINFOREST_BASE_URL = 'https://api.rainforestapi.com/request';

if (!RAINFOREST_API_KEY) {
  console.error('❌ Missing RAINFOREST_API_KEY environment variable');
}

/**
 * Fetch BuyBox information for a specific ASIN
 * @param {string} asin - Amazon ASIN
 * @param {string} country - Country code (default: 'co.uk' for UK)
 * @returns {Object} BuyBox data including current seller and price
 */
const fetchBuyBoxInfo = async (asin, country = 'co.uk') => {
  try {
    if (!RAINFOREST_API_KEY) {
      throw new Error('Rainforest API key not configured');
    }

    const params = {
      api_key: RAINFOREST_API_KEY,
      type: 'product',
      amazon_domain: `amazon.${country}`,
      asin: asin,
      include_offers: true
    };

    console.log(`🔍 Fetching BuyBox info for ASIN: ${asin}`);
    
    const response = await axios.get(RAINFOREST_BASE_URL, { params });
    
    if (response.data && response.data.product) {
      const product = response.data.product;
      const buyBoxWinner = product.buybox_winner;
      
      if (buyBoxWinner) {
        return {
          asin: asin,
          currentSeller: buyBoxWinner.merchant_info?.name || 'Unknown',
          sellerId: buyBoxWinner.merchant_info?.id || null,
          price: buyBoxWinner.price?.value || null,
          currency: buyBoxWinner.price?.currency || 'GBP',
          isPrime: buyBoxWinner.delivery?.is_prime_eligible || false,
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          asin: asin,
          currentSeller: null,
          sellerId: null,
          price: null,
          currency: 'GBP',
          isPrime: false,
          timestamp: new Date().toISOString(),
          error: 'No BuyBox winner found'
        };
      }
    } else {
      throw new Error('Invalid response from Rainforest API');
    }
  } catch (error) {
    console.error(`❌ Error fetching BuyBox info for ASIN ${asin}:`, error.message);
    
    if (error.response?.status === 429) {
      console.warn('⚠️ Rate limit exceeded, waiting before retry...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    return {
      asin: asin,
      currentSeller: null,
      sellerId: null,
      price: null,
      currency: 'GBP',
      isPrime: false,
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
};

/**
 * Fetch stock level for a specific ASIN and seller
 * @param {string} asin - Amazon ASIN
 * @param {string} sellerId - Seller ID
 * @param {string} country - Country code (default: 'co.uk' for UK)
 * @returns {Object} Stock information
 */
const fetchStockLevel = async (asin, sellerId, country = 'co.uk') => {
  try {
    if (!RAINFOREST_API_KEY) {
      throw new Error('Rainforest API key not configured');
    }

    const params = {
      api_key: RAINFOREST_API_KEY,
      type: 'product',
      amazon_domain: `amazon.${country}`,
      asin: asin,
      include_offers: true
    };

    console.log(`📦 Fetching stock level for ASIN: ${asin}, Seller: ${sellerId}`);
    
    const response = await axios.get(RAINFOREST_BASE_URL, { params });
    
    if (response.data && response.data.product && response.data.product.offers) {
      const offers = response.data.product.offers;
      
      // Find the specific seller's offer
      const sellerOffer = offers.find(offer => 
        offer.merchant_info?.id === sellerId || 
        offer.merchant_info?.name === sellerId
      );
      
      if (sellerOffer) {
        return {
          asin: asin,
          sellerId: sellerId,
          stockLevel: sellerOffer.availability?.stock_level || null,
          availability: sellerOffer.availability?.type || 'unknown',
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          asin: asin,
          sellerId: sellerId,
          stockLevel: null,
          availability: 'not_found',
          timestamp: new Date().toISOString(),
          error: 'Seller offer not found'
        };
      }
    } else {
      throw new Error('Invalid response from Rainforest API');
    }
  } catch (error) {
    console.error(`❌ Error fetching stock level for ASIN ${asin}, Seller ${sellerId}:`, error.message);
    
    if (error.response?.status === 429) {
      console.warn('⚠️ Rate limit exceeded, waiting before retry...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    return {
      asin: asin,
      sellerId: sellerId,
      stockLevel: null,
      availability: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
};

/**
 * Fetch ASINs for a specific seller
 * @param {string} sellerId - Seller ID
 * @param {string} country - Country code (default: 'co.uk' for UK)
 * @param {number} limit - Number of ASINs to fetch (default: 50)
 * @returns {Array} Array of ASINs with product information
 */
const fetchSellerAsins = async (sellerId, country = 'co.uk', limit = 50) => {
  try {
    if (!RAINFOREST_API_KEY) {
      throw new Error('Rainforest API key not configured');
    }

    const params = {
      api_key: RAINFOREST_API_KEY,
      type: 'search',
      amazon_domain: `amazon.${country}`,
      search_term: `seller:${sellerId}`,
      sort_by: 'featured',
      limit: limit
    };

    console.log(`🔍 Fetching ASINs for seller: ${sellerId}`);
    
    const response = await axios.get(RAINFOREST_BASE_URL, { params });
    
    if (response.data && response.data.search_results) {
      return response.data.search_results.map(result => ({
        asin: result.asin,
        title: result.title,
        price: result.price?.value,
        currency: result.price?.currency || 'GBP',
        rating: result.rating,
        ratings_total: result.ratings_total,
        image: result.image,
        sellerId: sellerId
      }));
    } else {
      throw new Error('Invalid response from Rainforest API');
    }
  } catch (error) {
    console.error(`❌ Error fetching ASINs for seller ${sellerId}:`, error.message);
    
    if (error.response?.status === 429) {
      console.warn('⚠️ Rate limit exceeded, waiting before retry...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    return [];
  }
};

module.exports = {
  fetchBuyBoxInfo,
  fetchStockLevel,
  fetchSellerAsins
}; 