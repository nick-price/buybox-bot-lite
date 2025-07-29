const cron = require('node-cron');
const { 
  fetchBuyBoxInfo, 
  fetchStockLevel 
} = require('../utils/fetchBuyBox');
const { 
  sendBuyBoxAlert, 
  sendSalesAlert 
} = require('../utils/sendWebhook');
const { 
  asinOperations, 
  buyboxOperations, 
  salesOperations, 
  userOperations 
} = require('../db/supabaseClient');

let isTracking = false;
let trackingInterval = null;

/**
 * Process a single ASIN for BuyBox changes and stock monitoring
 * @param {Object} asinData - ASIN data from database
 * @param {string} userId - User ID
 * @param {string} webhookUrl - Discord webhook URL
 */
const processAsin = async (asinData, userId, webhookUrl) => {
  try {
    const { asin, seller_id, title } = asinData;
    
    // Fetch current BuyBox information
    const buyBoxInfo = await fetchBuyBoxInfo(asin);
    
    if (buyBoxInfo.error) {
      console.warn(`⚠️ Error fetching BuyBox for ASIN ${asin}: ${buyBoxInfo.error}`);
      return;
    }

    // Get previous BuyBox state
    const previousState = await buyboxOperations.getBuyBoxState(userId, asin);
    
    // Update current BuyBox state
    await buyboxOperations.updateBuyBoxState(
      userId,
      asin,
      buyBoxInfo.currentSeller,
      buyBoxInfo.price
    );

    // Check for BuyBox changes
    if (previousState && previousState.current_seller !== buyBoxInfo.currentSeller) {
      console.log(`🔄 BuyBox change detected for ASIN ${asin}: ${previousState.current_seller} → ${buyBoxInfo.currentSeller}`);
      
      // Determine if this is a gain or loss for tracked sellers
      const trackedSellers = await require('./asinFetcher').getAsinStats(userId);
      const isGain = trackedSellers.asinsPerSeller[buyBoxInfo.currentSeller];
      const isLoss = previousState.current_seller && trackedSellers.asinsPerSeller[previousState.current_seller];
      
      // Send Discord alert
      if (webhookUrl) {
        await sendBuyBoxAlert(webhookUrl, {
          asin: asin,
          oldSeller: previousState.current_seller,
          newSeller: buyBoxInfo.currentSeller,
          price: buyBoxInfo.price,
          currency: buyBoxInfo.currency,
          isGain: isGain
        });
      }
    }

    // If current BuyBox holder is a tracked seller, monitor stock
    if (buyBoxInfo.currentSeller && buyBoxInfo.sellerId) {
      const trackedSellers = await require('./asinFetcher').getAsinStats(userId);
      const isTrackedSeller = Object.values(trackedSellers.asinsPerSeller).some(count => count > 0);
      
      if (isTrackedSeller) {
        // Fetch stock level for the current BuyBox holder
        const stockInfo = await fetchStockLevel(asin, buyBoxInfo.sellerId);
        
        if (stockInfo.stockLevel !== null) {
          // Get previous stock level
          const previousStock = previousState ? previousState.stock_level : null;
          
          // Check for stock decrease (potential sale)
          if (previousStock !== null && 
              stockInfo.stockLevel < previousStock && 
              stockInfo.stockLevel >= 0) {
            
            const unitsSold = previousStock - stockInfo.stockLevel;
            
            console.log(`📉 Stock decrease detected for ASIN ${asin}: ${previousStock} → ${stockInfo.stockLevel} (${unitsSold} units)`);
            
            // Log estimated sale
            await salesOperations.logSale(
              userId,
              asin,
              buyBoxInfo.sellerId,
              previousStock,
              stockInfo.stockLevel,
              unitsSold
            );
            
            // Send Discord alert
            if (webhookUrl) {
              await sendSalesAlert(webhookUrl, {
                asin: asin,
                sellerLabel: buyBoxInfo.currentSeller,
                stockBefore: previousStock,
                stockAfter: stockInfo.stockLevel,
                unitsSold: unitsSold,
                productTitle: title
              });
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.error(`❌ Error processing ASIN ${asinData.asin}:`, error.message);
  }
};

/**
 * Process all ASINs for a specific user
 * @param {string} userId - User ID
 */
const processUserAsins = async (userId) => {
  try {
    // Get user's webhook URL
    const user = await userOperations.getUser(userId);
    if (!user) {
      console.warn(`⚠️ User ${userId} not found`);
      return;
    }

    // Get all ASINs for the user
    const asins = await asinOperations.getAsins(userId);
    
    if (asins.length === 0) {
      console.log(`ℹ️ No ASINs found for user ${userId}`);
      return;
    }

    console.log(`🔄 Processing ${asins.length} ASINs for user ${userId}`);
    
    // Process each ASIN with a small delay to avoid rate limiting
    for (let i = 0; i < asins.length; i++) {
      await processAsin(asins[i], userId, user.webhook_url);
      
      // Add delay between requests to respect API rate limits
      if (i < asins.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`✅ Completed processing ASINs for user ${userId}`);
    
  } catch (error) {
    console.error(`❌ Error processing ASINs for user ${userId}:`, error.message);
  }
};

/**
 * Process all users' ASINs
 */
const processAllUsers = async () => {
  try {
    console.log('🔄 Starting BuyBox tracking cycle...');
    
    // Get all users (this would need to be implemented based on your user management)
    // For now, we'll process a single user or implement a user discovery mechanism
    
    // This is a placeholder - you'll need to implement user discovery
    // const users = await getAllUsers();
    
    // For demonstration, we'll assume we have a way to get active users
    // You might want to store active user IDs in a separate table or cache
    
    console.log('✅ Completed BuyBox tracking cycle');
    
  } catch (error) {
    console.error('❌ Error in BuyBox tracking cycle:', error.message);
  }
};

/**
 * Initialize BuyBox tracking scheduler
 */
const initializeTracking = () => {
  if (isTracking) {
    console.log('⚠️ BuyBox tracking is already running');
    return;
  }

  console.log('🚀 Initializing BuyBox tracking...');
  
  // Start tracking every 30 seconds
  trackingInterval = cron.schedule('*/30 * * * * *', async () => {
    if (!isTracking) {
      isTracking = true;
      await processAllUsers();
      isTracking = false;
    }
  }, {
    scheduled: false
  });

  trackingInterval.start();
  console.log('✅ BuyBox tracking initialized and running every 30 seconds');
};

/**
 * Stop BuyBox tracking
 */
const stopTracking = () => {
  if (trackingInterval) {
    trackingInterval.stop();
    trackingInterval = null;
    isTracking = false;
    console.log('⏹️ BuyBox tracking stopped');
  }
};

/**
 * Get tracking status
 */
const getTrackingStatus = () => {
  return {
    isRunning: isTracking,
    hasInterval: !!trackingInterval
  };
};

/**
 * Manually trigger tracking for a specific user
 * @param {string} userId - User ID
 */
const triggerUserTracking = async (userId) => {
  try {
    console.log(`🔄 Manually triggering tracking for user ${userId}`);
    await processUserAsins(userId);
    console.log(`✅ Manual tracking completed for user ${userId}`);
  } catch (error) {
    console.error(`❌ Error in manual tracking for user ${userId}:`, error.message);
    throw error;
  }
};

module.exports = {
  initializeTracking,
  stopTracking,
  getTrackingStatus,
  processUserAsins,
  processAllUsers,
  triggerUserTracking,
  processAsin
}; 