const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;

// Logging middleware
app.use((req, res, next) => {
  console.log(`🔍 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log(`📋 Headers:`, req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`📦 Body:`, req.body);
  }
  next();
});

// CORS configuration for production
const allowedOrigins = [
  'http://localhost:3000', 
  'http://localhost:3001',
  'https://buybox-bot-lite-production.up.railway.app',
  'https://buybox-bot-lite.railway.app'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Serve static files from the React app build directory
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
}

// Health check
app.get('/api/health', (req, res) => {
  console.log('✅ Health check requested');
  res.json({ status: 'OK', message: 'Backend is working!' });
});

// Mock user authentication middleware
const authenticateUser = (req, res, next) => {
  console.log('🔐 Authentication check:');
  console.log('  - x-user-id header:', req.headers['x-user-id']);
  console.log('  - authorization header:', req.headers.authorization);
  
  const userId = req.headers['x-user-id'];
  if (!userId) {
    console.log('❌ No user ID found in headers');
    return res.status(401).json({ error: 'User ID required' });
  }
  
  console.log('✅ User authenticated:', userId);
  req.userId = userId;
  next();
};

// Mock API endpoints
app.get('/api/tracker/stats', authenticateUser, (req, res) => {
  console.log('📊 Stats requested for user:', req.userId);
  res.json({
    asins: { totalAsins: 0, totalSellers: 0 },
    sales: { total: 0 }
  });
});

app.get('/api/tracker/sellers', authenticateUser, (req, res) => {
  console.log('👥 Sellers requested for user:', req.userId);
  res.json([]);
});

app.post('/api/tracker/sellers', authenticateUser, (req, res) => {
  const { sellerId, label } = req.body;
  console.log('➕ Adding seller:', { sellerId, label, userId: req.userId });
  if (!sellerId || !label) {
    console.log('❌ Missing sellerId or label');
    return res.status(400).json({ error: 'Seller ID and label are required' });
  }
  console.log('✅ Seller added successfully');
  res.status(201).json({ id: Date.now(), seller_id: sellerId, label });
});

app.delete('/api/tracker/sellers/:sellerId', authenticateUser, (req, res) => {
  console.log('🗑️ Deleting seller:', req.params.sellerId, 'for user:', req.userId);
  res.json({ message: 'Seller deleted successfully' });
});

app.get('/api/tracker/profile', authenticateUser, (req, res) => {
  console.log('👤 Profile requested for user:', req.userId);
  res.json({
    id: req.userId,
    email: 'test@example.com',
    webhookUrl: null,
    createdAt: new Date().toISOString()
  });
});

app.put('/api/tracker/webhook', authenticateUser, (req, res) => {
  const { webhookUrl } = req.body;
  console.log('🔗 Webhook update for user:', req.userId, 'URL:', webhookUrl);
  if (!webhookUrl) {
    return res.status(400).json({ error: 'Webhook URL is required' });
  }
  res.json({ message: 'Webhook URL updated successfully', webhookUrl });
});

app.get('/api/tracker/sales', authenticateUser, (req, res) => {
  console.log('💰 Sales requested for user:', req.userId);
  res.json({
    sales: [],
    pagination: {
      page: 1,
      limit: 50,
      total: 0
    }
  });
});

// Catch all handler: send back React's index.html file for any non-API routes
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 BuyBox Bot Lite backend running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  if (process.env.NODE_ENV === 'production') {
    console.log('📦 Serving frontend build files');
  }
});
