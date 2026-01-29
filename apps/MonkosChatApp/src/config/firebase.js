/**
 * Firebase Configuration for MONKOS Chat
 *
 * This file initializes Firebase services for the mobile app.
 * Uses Firebase Web SDK (compatible with Expo).
 *
 * To get your config values:
 * 1. Go to Firebase Console (https://console.firebase.google.com)
 * 2. Select your project (monkos-3c6e4)
 * 3. Go to Project Settings > General
 * 4. Scroll down to "Your apps" > Web app
 * 5. Copy the firebaseConfig object
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyC4oaxM2aLHpTkph1hKF7WN4avOl0-1LZ0',
  authDomain: 'monkos-3c6e4.firebaseapp.com',
  projectId: 'monkos-3c6e4',
  storageBucket: 'monkos-3c6e4.firebasestorage.app',
  messagingSenderId: '676916736379',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:676916736379:web:fd1231c0df21927aec4dde',
  measurementId: 'G-JPZWSJ3323',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
