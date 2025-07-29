# 🚀 BuyBox Bot Lite - Deployment Guide

## Quick Deploy to Railway (Recommended)

### Step 1: Prepare Your Repository

1. **Commit all changes to Git:**
```bash
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

### Step 2: Deploy to Railway

1. **Go to [Railway.app](https://railway.app)**
2. **Sign up/Login with GitHub**
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Choose your `buybox-bot-lite` repository**
6. **Click "Deploy Now"**

### Step 3: Configure Environment Variables

In your Railway project dashboard:

1. **Go to "Variables" tab**
2. **Add these environment variables:**

```env
NODE_ENV=production

# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=AIzaSyB7trQBZpwCCp4XxNYGCevoJSoltJAwED0
REACT_APP_FIREBASE_AUTH_DOMAIN=buyboxbot-3cd51.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=buyboxbot-3cd51
REACT_APP_FIREBASE_STORAGE_BUCKET=buyboxbot-3cd51.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=114425801855
REACT_APP_FIREBASE_APP_ID=1:114425801855:web:c163fc64d6eac1e2a7e34a
REACT_APP_FIREBASE_MEASUREMENT_ID=G-53BF1EVKGM

# Supabase Configuration
SUPABASE_URL=https://wybnzhaoqixcsrjvbeih.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5Ym56aGFvcWl4Y3NyanZiZWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MDg4MDYsImV4cCI6MjA2OTM4NDgwNn0.0NdidhevcfTiMVwnV1QZWD5czeuw3Rj-cu3HOS6V3Dc

# Rainforest API Configuration
RAINFOREST_API_KEY=C988D07BD55647CE8F9B77BA915C42AA

# Firebase Configuration
FIREBASE_PROJECT_ID=buyboxbot-3cd51
```

### Step 4: Configure Firebase for Production

1. **Go to [Firebase Console](https://console.firebase.google.com)**
2. **Select your project: `buyboxbot-3cd51`**
3. **Go to Authentication → Settings**
4. **Add your Railway domain to "Authorized domains":**
   - `buybox-bot-lite-production.up.railway.app`
   - `buybox-bot-lite.railway.app`

### Step 5: Test Your Live App

1. **Railway will provide a URL** (e.g., `https://buybox-bot-lite-production.up.railway.app`)
2. **Visit the URL in your browser**
3. **Test the Google login**
4. **Test adding sellers and other features**

## Alternative Deployment Options

### Vercel (Frontend) + Railway (Backend)

1. **Deploy frontend to Vercel:**
   - Connect GitHub repo to Vercel
   - Set build command: `npm run build`
   - Set output directory: `frontend/build`

2. **Deploy backend to Railway** (as above)

3. **Update frontend API URL** to point to Railway backend

### Heroku

1. **Install Heroku CLI**
2. **Create Heroku app:**
```bash
heroku create buybox-bot-lite
```

3. **Set environment variables:**
```bash
heroku config:set NODE_ENV=production
heroku config:set REACT_APP_FIREBASE_API_KEY=AIzaSyB7trQBZpwCCp4XxNYGCevoJSoltJAwED0
# ... (add all other variables)
```

4. **Deploy:**
```bash
git push heroku main
```

## Post-Deployment Checklist

- [ ] ✅ App loads without errors
- [ ] ✅ Google authentication works
- [ ] ✅ Can add/remove sellers
- [ ] ✅ Database operations work
- [ ] ✅ Webhook settings save
- [ ] ✅ All API endpoints respond correctly
- [ ] ✅ Mobile responsive design works
- [ ] ✅ SSL certificate is active (https)

## Monitoring & Maintenance

### Railway Dashboard
- Monitor app performance
- View logs for debugging
- Scale resources as needed

### Firebase Console
- Monitor authentication usage
- View user analytics
- Manage project settings

### Supabase Dashboard
- Monitor database performance
- View table data
- Manage database backups

## Troubleshooting

### Common Issues:

1. **CORS Errors:**
   - Check allowed origins in backend
   - Verify Firebase authorized domains

2. **Authentication Failures:**
   - Verify Firebase configuration
   - Check environment variables

3. **Database Connection Issues:**
   - Verify Supabase credentials
   - Check network connectivity

4. **Build Failures:**
   - Check Railway logs
   - Verify all dependencies are installed

### Getting Help:
- Check Railway logs in dashboard
- Review Firebase console for auth issues
- Verify environment variables are set correctly 