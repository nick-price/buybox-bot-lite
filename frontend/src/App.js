import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import { Toaster } from 'react-hot-toast';

import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import LoadingSpinner from './components/LoadingSpinner';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB7trQBZpwCCp4XxNYGCevoJSoltJAwED0",
  authDomain: "buyboxbot-3cd51.firebaseapp.com",
  projectId: "buyboxbot-3cd51",
  storageBucket: "buyboxbot-3cd51.firebasestorage.app",
  messagingSenderId: "114425801855",
  appId: "1:114425801855:web:c163fc64d6eac1e2a7e34a",
  measurementId: "G-53BF1EVKGM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);

// Add this console log to see if Firebase is initialized
console.log('Firebase app:', app);
console.log('Firebase auth:', auth);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      
      // Store user ID in localStorage for API calls
      if (user) {
        localStorage.setItem('userId', user.uid);
      } else {
        localStorage.removeItem('userId');
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
        
        <Routes>
          <Route 
            path="/login" 
            element={user ? <Navigate to="/dashboard" /> : <LoginPage auth={auth} />} 
          />
          <Route 
            path="/dashboard" 
            element={user ? <Dashboard auth={auth} user={user} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/" 
            element={<Navigate to={user ? "/dashboard" : "/login"} />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 