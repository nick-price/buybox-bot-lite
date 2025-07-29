const express = require('express');
const router = express.Router();

const { 
  userOperations, 
  sellerOperations, 
  asinOperations, 
  salesOperations 
} = require('../db/supabaseClient');
const { 
  fetchAllUserAsins, 
  refreshSellerAsins, 
  getAsinStats 
} = require('../services/asinFetcher');
const { 
  triggerUserTracking 
} = require('../services/buyboxTracker');
const { verifyIdToken } = require('../config/firebaseAdmin');

// Middleware to verify user authentication
const authenticateUser = async (req, res, next) => {
  try {
    // Try Firebase token first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1];
      const decodedToken = await verifyIdToken(idToken);
      
      // Get or create user in database
      let user = await userOperations.getUser(decodedToken.uid);
      if (!user) {
        user = await userOperations.createUser(decodedToken.uid, decodedToken.email);
      }

      req.user = user;
      req.userId = decodedToken.uid;
      next();
      return;
    }

    // Fallback to old x-user-id method
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const user = await userOperations.getUser(userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    req.userId = userId;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Apply authentication middleware to all routes
router.use(authenticateUser);

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    res.json({
      id: req.user.id,
      email: req.user.email,
      webhookUrl: req.user.webhook_url,
      createdAt: req.user.created_at
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update webhook URL
router.put('/webhook', async (req, res) => {
  try {
    const { webhookUrl } = req.body;
    
    if (!webhookUrl) {
      return res.status(400).json({ error: 'Webhook URL is required' });
    }

    const updatedUser = await userOperations.updateWebhook(req.userId, webhookUrl);
    res.json({ 
      message: 'Webhook URL updated successfully',
      webhookUrl: updatedUser.webhook_url 
    });
  } catch (error) {
    console.error('Error updating webhook:', error);
    res.status(500).json({ error: 'Failed to update webhook URL' });
  }
});

// Seller management routes
router.get('/sellers', async (req, res) => {
  try {
    const sellers = await sellerOperations.getSellers(req.userId);
    res.json(sellers);
  } catch (error) {
    console.error('Error fetching sellers:', error);
    res.status(500).json({ error: 'Failed to fetch sellers' });
  }
});

router.post('/sellers', async (req, res) => {
  try {
    const { sellerId, label } = req.body;
    
    if (!sellerId || !label) {
      return res.status(400).json({ error: 'Seller ID and label are required' });
    }

    const seller = await sellerOperations.addSeller(req.userId, sellerId, label);
    res.status(201).json(seller);
  } catch (error) {
    console.error('Error adding seller:', error);
    res.status(500).json({ error: 'Failed to add seller' });
  }
});

router.delete('/sellers/:sellerId', async (req, res) => {
  try {
    const { sellerId } = req.params;
    await sellerOperations.deleteSeller(req.userId, sellerId);
    res.json({ message: 'Seller deleted successfully' });
  } catch (error) {
    console.error('Error deleting seller:', error);
    res.status(500).json({ error: 'Failed to delete seller' });
  }
});

// ASIN management routes
router.get('/asins', async (req, res) => {
  try {
    const asins = await asinOperations.getAsins(req.userId);
    res.json(asins);
  } catch (error) {
    console.error('Error fetching ASINs:', error);
    res.status(500).json({ error: 'Failed to fetch ASINs' });
  }
});

router.post('/asins/fetch', async (req, res) => {
  try {
    const result = await fetchAllUserAsins(req.userId);
    res.json(result);
  } catch (error) {
    console.error('Error fetching ASINs:', error);
    res.status(500).json({ error: 'Failed to fetch ASINs' });
  }
});

router.post('/asins/refresh/:sellerId', async (req, res) => {
  try {
    const { sellerId } = req.params;
    const result = await refreshSellerAsins(req.userId, sellerId);
    res.json(result);
  } catch (error) {
    console.error('Error refreshing ASINs:', error);
    res.status(500).json({ error: 'Failed to refresh ASINs' });
  }
});

router.delete('/asins/:asin', async (req, res) => {
  try {
    const { asin } = req.params;
    await asinOperations.deleteAsin(req.userId, asin);
    res.json({ message: 'ASIN deleted successfully' });
  } catch (error) {
    console.error('Error deleting ASIN:', error);
    res.status(500).json({ error: 'Failed to delete ASIN' });
  }
});

// Sales data routes
router.get('/sales', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    const [sales, totalCount] = await Promise.all([
      salesOperations.getSalesLogs(req.userId, parseInt(limit), offset),
      salesOperations.getSalesCount(req.userId)
    ]);

    res.json({
      sales,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: 'Failed to fetch sales data' });
  }
});

// Statistics routes
router.get('/stats', async (req, res) => {
  try {
    const [asinStats, salesCount] = await Promise.all([
      getAsinStats(req.userId),
      salesOperations.getSalesCount(req.userId)
    ]);

    res.json({
      asins: asinStats,
      sales: {
        total: salesCount
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Manual tracking trigger
router.post('/track', async (req, res) => {
  try {
    await triggerUserTracking(req.userId);
    res.json({ message: 'Tracking triggered successfully' });
  } catch (error) {
    console.error('Error triggering tracking:', error);
    res.status(500).json({ error: 'Failed to trigger tracking' });
  }
});

// Health check for tracking system
router.get('/health', async (req, res) => {
  try {
    const { getTrackingStatus } = require('../services/buyboxTracker');
    const trackingStatus = getTrackingStatus();
    
    res.json({
      status: 'OK',
      tracking: trackingStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking health:', error);
    res.status(500).json({ error: 'Health check failed' });
  }
});

module.exports = router; 