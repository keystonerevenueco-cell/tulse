// ==========================
// FIREBASE CONFIGURATION
// ==========================

// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getAuth, setPersistence, browserLocalPersistence } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js';

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCRkzYNYGXXKsaZmR0Jh9IgQsmTeUP23-g",
    authDomain: "tulse-chat.firebaseapp.com",
    projectId: "tulse-chat",
    storageBucket: "tulse-chat.firebasestorage.app",
    messagingSenderId: "948935694228",
    appId: "1:948935694228:web:9f716b4df941a8f387e181",
    measurementId: "G-HXXMQWJSG0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

// Enable offline persistence
enableIndexedDbPersistence(db, {
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
}).catch((err) => {
    if (err.code === 'failed-precondition') {
        console.warn('⚠️ Multiple tabs open - persistence enabled in first tab only');
    } else if (err.code === 'unimplemented') {
        console.warn('⚠️ Browser doesn\'t support persistence');
    }
});

// Set auth persistence
setPersistence(auth, browserLocalPersistence)
    .catch((err) => {
        console.warn('⚠️ Auth persistence error:', err);
    });

console.log('✅ Firebase initialized successfully');

// Export services
export { app, db, auth, storage, analytics };