// ==========================
// FIREBASE AUTHENTICATION
// ==========================

import { auth } from './config.js';
import { 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    onAuthStateChanged,
    updateProfile,
    sendEmailVerification
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

import { db } from './config.js';
import { doc, setDoc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { COLLECTIONS } from './collections.js';

// ==========================
// REGISTER NEW USER
// ==========================
export async function registerUser(email, password, userData = {}) {
    try {
        // Create auth user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update profile with display name
        if (userData.fullName) {
            await updateProfile(user, {
                displayName: userData.fullName
            });
        }
        
        // Send email verification
        await sendEmailVerification(user);
        
        // Create user document in Firestore
        const userDoc = {
            email: user.email,
            fullName: userData.fullName || email.split('@')[0],
            company: userData.company || '',
            phone: userData.phone || '',
            role: userData.role || 'client',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            emailVerified: false,
            isActive: true,
            package: userData.package || 'free',
            onboardingComplete: false,
            lastLogin: new Date().toISOString(),
            ...userData
        };
        
        await setDoc(doc(db, COLLECTIONS.USERS, user.uid), userDoc);
        
        // Also create chat document for this user
        await setDoc(doc(db, COLLECTIONS.CHATS, user.email), {
            email: user.email,
            fullName: userData.fullName || email.split('@')[0],
            createdAt: new Date().toISOString(),
            isActive: true
        });
        
        return {
            success: true,
            user: user,
            userData: userDoc,
            message: 'Registration successful! Please check your email to verify.'
        };
    } catch (error) {
        console.error('Registration error:', error);
        return {
            success: false,
            error: error.message,
            code: error.code
        };
    }
}

// ==========================
// LOGIN USER
// ==========================
export async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update last login
        await updateDoc(doc(db, COLLECTIONS.USERS, user.uid), {
            lastLogin: new Date().toISOString()
        });
        
        // Get user data
        const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
        const userData = userDoc.exists() ? userDoc.data() : null;
        
        return {
            success: true,
            user: user,
            userData: userData,
            message: 'Login successful!'
        };
    } catch (error) {
        console.error('Login error:', error);
        return {
            success: false,
            error: error.message,
            code: error.code
        };
    }
}

// ==========================
// LOGOUT USER
// ==========================
export async function logoutUser() {
    try {
        await signOut(auth);
        // Clear all local storage
        localStorage.removeItem('tulse_account_data');
        localStorage.removeItem('tulse_is_admin');
        return {
            success: true,
            message: 'Logged out successfully'
        };
    } catch (error) {
        console.error('Logout error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ==========================
// PASSWORD RESET
// ==========================
export async function resetPassword(email) {
    try {
        await sendPasswordResetEmail(auth, email);
        return {
            success: true,
            message: 'Password reset email sent!'
        };
    } catch (error) {
        console.error('Password reset error:', error);
        return {
            success: false,
            error: error.message,
            code: error.code
        };
    }
}

// ==========================
// GET CURRENT USER
// ==========================
export function getCurrentUser() {
    return auth.currentUser;
}

// ==========================
// CHECK USER ROLE
// ==========================
export async function getUserRole(uid) {
    try {
        const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, uid));
        if (userDoc.exists()) {
            return userDoc.data().role || 'client';
        }
        return 'client';
    } catch (error) {
        console.error('Error getting user role:', error);
        return 'client';
    }
}

// ==========================
// AUTH STATE OBSERVER
// ==========================
export function onAuthStateChangedListener(callback) {
    return onAuthStateChanged(auth, async (user) => {
        if (user) {
            // User is signed in
            const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
            const userData = userDoc.exists() ? userDoc.data() : null;
            callback({
                isAuthenticated: true,
                user: user,
                userData: userData
            });
        } else {
            // User is signed out
            callback({
                isAuthenticated: false,
                user: null,
                userData: null
            });
        }
    });
}

export default {
    registerUser,
    loginUser,
    logoutUser,
    resetPassword,
    getCurrentUser,
    getUserRole,
    onAuthStateChangedListener
};