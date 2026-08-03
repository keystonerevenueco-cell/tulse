// ==========================
// FIREBASE INITIALIZATION
// ==========================

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
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Enable offline persistence for better performance
db.enablePersistence()
    .catch((err) => {
        console.warn('Firebase persistence error:', err);
    });

console.log('✅ Firebase initialized successfully');