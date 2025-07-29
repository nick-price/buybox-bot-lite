# 🚀 Frontend Deployment to Vercel

## Step 1: Deploy Frontend to Vercel

1. **Go to [Vercel.com](https://vercel.com)**
2. **Sign up/Login with GitHub**
3. **Click "New Project"**
4. **Import your GitHub repository**: `buybox-bot-lite`
5. **Configure the project**:
   - **Framework Preset**: `Create React App`
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `cd frontend && npm run build`
   - **Output Directory**: `frontend/build`
6. **Click "Deploy"**

## Step 2: Configure Environment Variables

In your Vercel project dashboard:

1. **Go to "Settings" → "Environment Variables"**
2. **Add these variables**:

```env
REACT_APP_FIREBASE_API_KEY=AIzaSyB7trQBZpwCCp4XxNYGCevoJSoltJAwED0
REACT_APP_FIREBASE_AUTH_DOMAIN=buyboxbot-3cd51.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=buyboxbot-3cd51
REACT_APP_FIREBASE_STORAGE_BUCKET=buyboxbot-3cd51.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=114425801855
REACT_APP_FIREBASE_APP_ID=1:114425801855:web:c163fc64d6eac1e2a7e34a
REACT_APP_FIREBASE_MEASUREMENT_ID=G-53BF1EVKGM
```

## Step 3: Update Firebase Authorized Domains

1. **Go to [Firebase Console](https://console.firebase.google.com)**
2. **Select your project**: `buyboxbot-3cd51`
3. **Go to Authentication → Settings**
4. **Add your Vercel domain to "Authorized domains"**:
   - `buybox-bot-lite.vercel.app`
   - `buybox-bot-lite-frontend.vercel.app`

## Step 4: Test the Deployment

1. **Visit your Vercel URL** (e.g., `https://buybox-bot-lite.vercel.app`)
2. **Test Google authentication**
3. **Verify API calls work** (they should call the Railway backend)

## Architecture

- **Frontend**: Vercel (React app)
- **Backend**: Railway (Node.js API)
- **Database**: Supabase
- **Authentication**: Firebase

## URLs

- **Frontend**: `https://buybox-bot-lite.vercel.app`
- **Backend**: `https://buybox-bot-lite-production.up.railway.app`
- **API Calls**: Frontend → Backend via CORS 