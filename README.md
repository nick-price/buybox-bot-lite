# BuyBox Bot Lite 🛒

A real-time Amazon BuyBox tracking and sales estimation tool for FBA sellers. Monitor BuyBox changes, track competitor sales, and get instant Discord notifications.

## Features

### 🎯 Core Functionality
- **Real-time BuyBox Tracking**: Monitor BuyBox changes every 30 seconds
- **Sales Estimation**: Track stock changes to estimate competitor sales
- **Discord Notifications**: Instant alerts for BuyBox changes and sales
- **Multi-Seller Support**: Track multiple Amazon seller IDs
- **ASIN Management**: Automatically fetch and manage product ASINs

### 🎨 User Interface
- **Modern Dark Mode UI**: Beautiful, responsive design with TailwindCSS
- **Mobile-Friendly**: Works perfectly on all devices
- **Real-time Dashboard**: Live statistics and monitoring
- **Sortable Tables**: Advanced data visualization with pagination

### 🔧 Technical Features
- **Google OAuth**: Secure authentication with Firebase
- **RESTful API**: Node.js/Express backend with Supabase database
- **Rainforest API Integration**: Real Amazon data scraping
- **Rate Limiting**: Respectful API usage with intelligent delays
- **Error Handling**: Robust error management and recovery

## Tech Stack

### Frontend
- **React 18** - Modern UI framework
- **TailwindCSS** - Utility-first CSS framework
- **Firebase Auth** - Google OAuth authentication
- **Lucide React** - Beautiful icons
- **React Hot Toast** - Toast notifications
- **Date-fns** - Date formatting

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Supabase** - PostgreSQL database
- **Rainforest API** - Amazon data scraping
- **Node-cron** - Scheduled tasks
- **Axios** - HTTP client

## Quick Start

### Prerequisites
- Node.js 16+ and npm
- Supabase account
- Rainforest API account
- Firebase project
- Discord server (for webhooks)

### 1. Clone and Install

```bash
git clone <repository-url>
cd buybox-bot-lite
npm run install-all
```

### 2. Environment Setup

#### Backend (.env)
```bash
cd backend
cp env.example .env
```

Edit `.env` with your credentials:
```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Rainforest API Configuration
RAINFOREST_API_KEY=your_rainforest_api_key

# Firebase Configuration
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
```

#### Frontend (.env)
```bash
cd frontend
cp env.example .env
```

Edit `.env` with your Firebase config:
```env
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### 3. Database Setup

Create the following tables in your Supabase database:

```sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  webhook_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seller profiles table
CREATE TABLE seller_profiles (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  seller_id TEXT NOT NULL,
  label TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, seller_id)
);

-- ASINs table
CREATE TABLE asins (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  seller_id TEXT NOT NULL,
  asin TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, asin)
);

-- BuyBox states table
CREATE TABLE buybox_states (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  asin TEXT NOT NULL,
  current_seller TEXT,
  stock_level INTEGER,
  last_seen_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, asin)
);

-- Sales logs table
CREATE TABLE sales_logs (
  id SERIAL PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  asin TEXT NOT NULL,
  seller_id TEXT NOT NULL,
  stock_before INTEGER,
  stock_after INTEGER,
  units_sold_estimate INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. Run the Application

```bash
# Development mode (both frontend and backend)
npm run dev

# Or run separately:
npm run server  # Backend only
npm run client  # Frontend only
```

Visit `http://localhost:3000` to access the application.

## Usage Guide

### 1. Authentication
- Sign in with your Google account
- The app will create your user profile automatically

### 2. Add Sellers
- Go to the "Sellers" tab
- Add Amazon seller IDs with custom labels
- The system will automatically fetch their ASINs

### 3. Configure Discord Webhooks
- Go to "Settings" tab
- Add your Discord webhook URL
- Test the connection

### 4. Monitor Activity
- View real-time statistics on the dashboard
- Check sales data in the "Sales" tab
- Receive instant Discord notifications

## API Endpoints

### Authentication Required
All endpoints require the `x-user-id` header with the user's ID.

### Sellers
- `GET /api/tracker/sellers` - Get all sellers
- `POST /api/tracker/sellers` - Add new seller
- `DELETE /api/tracker/sellers/:sellerId` - Delete seller

### ASINs
- `GET /api/tracker/asins` - Get all ASINs
- `POST /api/tracker/asins/fetch` - Fetch ASINs for all sellers
- `POST /api/tracker/asins/refresh/:sellerId` - Refresh ASINs for specific seller

### Sales
- `GET /api/tracker/sales` - Get sales data (paginated)
- `GET /api/tracker/stats` - Get statistics

### Settings
- `GET /api/tracker/profile` - Get user profile
- `PUT /api/tracker/webhook` - Update webhook URL

## Discord Notifications

### BuyBox Alerts
- ✅ **Gained BuyBox**: When you win the BuyBox
- ❌ **Lost BuyBox**: When you lose the BuyBox to a competitor

### Sales Alerts
- 📉 **Estimated Sale**: When stock decreases while holding BuyBox

### System Alerts
- ℹ️ **Info**: General system updates
- ⚠️ **Warning**: Important notices
- ❌ **Error**: System errors

## Configuration

### Tracking Frequency
The system checks BuyBox status every 30 seconds. You can modify this in `backend/services/buyboxTracker.js`:

```javascript
// Change from 30 seconds to your preferred interval
trackingInterval = cron.schedule('*/30 * * * * *', async () => {
  // tracking logic
});
```

### Rate Limiting
The app respects API rate limits with intelligent delays. Configure in `backend/utils/fetchBuyBox.js`:

```javascript
// Add delay between requests (default: 2 seconds)
await new Promise(resolve => setTimeout(resolve, 2000));
```

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Ensure your `.env` file is properly configured
   - Check that Supabase URL and key are correct

2. **"Rainforest API key not configured"**
   - Add your Rainforest API key to the backend `.env` file
   - Ensure you have sufficient API credits

3. **"Discord webhook failed"**
   - Verify your webhook URL is correct
   - Check that the Discord channel has webhook permissions

4. **"No ASINs found for seller"**
   - Verify the seller ID is correct
   - Some sellers may have no public listings

### Logs
Check the console output for detailed error messages and debugging information.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the API documentation

---

**BuyBox Bot Lite** - Empowering Amazon sellers with real-time insights! 🚀 