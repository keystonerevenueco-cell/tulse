// ==========================
// FIRESTORE DATABASE OPERATIONS
// ==========================

import { db } from './config.js';
import { 
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    addDoc,
    onSnapshot,
    serverTimestamp,
    increment,
    arrayUnion,
    arrayRemove,
    writeBatch
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import { COLLECTIONS } from './collections.js';
import { getCurrentUser } from './auth.js';

// ==========================
// USER OPERATIONS
// ==========================

// Get user by ID
export async function getUser(userId) {
    try {
        const docSnap = await getDoc(doc(db, COLLECTIONS.USERS, userId));
        if (docSnap.exists()) {
            return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
        }
        return { success: false, error: 'User not found' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Update user profile
export async function updateUserProfile(userId, data) {
    try {
        await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
            ...data,
            updatedAt: new Date().toISOString()
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Get all users (admin only)
export async function getAllUsers() {
    try {
        const querySnapshot = await getDocs(collection(db, COLLECTIONS.USERS));
        const users = [];
        querySnapshot.forEach((doc) => {
            users.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, data: users };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ==========================
// CHAT/MESSAGE OPERATIONS
// ==========================

// Send message
export async function sendMessage(clientEmail, messageData) {
    try {
        // Create chat document if it doesn't exist
        const chatRef = doc(db, COLLECTIONS.CHATS, clientEmail);
        const chatSnap = await getDoc(chatRef);
        if (!chatSnap.exists()) {
            await setDoc(chatRef, {
                email: clientEmail,
                createdAt: new Date().toISOString(),
                isActive: true,
                lastMessage: messageData.text || '',
                lastMessageTime: new Date().toISOString()
            });
        }
        
        // Add message to subcollection
        const messagesRef = collection(db, COLLECTIONS.CHATS, clientEmail, COLLECTIONS.MESSAGES);
        const newMessage = {
            ...messageData,
            timestamp: new Date().toISOString(),
            read: false
        };
        
        const docRef = await addDoc(messagesRef, newMessage);
        
        // Update chat document with last message
        await updateDoc(chatRef, {
            lastMessage: messageData.text || '',
            lastMessageTime: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
        
        return { success: true, id: docRef.id, data: newMessage };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Get messages for a client
export async function getMessages(clientEmail, limitCount = 50) {
    try {
        const messagesRef = collection(db, COLLECTIONS.CHATS, clientEmail, COLLECTIONS.MESSAGES);
        const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(limitCount));
        const querySnapshot = await getDocs(q);
        
        const messages = [];
        querySnapshot.forEach((doc) => {
            messages.push({ id: doc.id, ...doc.data() });
        });
        
        return { success: true, data: messages.reverse() };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Mark message as read
export async function markMessageRead(clientEmail, messageId) {
    try {
        await updateDoc(doc(db, COLLECTIONS.CHATS, clientEmail, COLLECTIONS.MESSAGES, messageId), {
            read: true,
            readAt: new Date().toISOString()
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Mark all messages as read for a client
export async function markAllMessagesRead(clientEmail) {
    try {
        const messagesRef = collection(db, COLLECTIONS.CHATS, clientEmail, COLLECTIONS.MESSAGES);
        const q = query(messagesRef, where('read', '==', false));
        const querySnapshot = await getDocs(q);
        
        const batch = writeBatch(db);
        querySnapshot.forEach((doc) => {
            batch.update(doc.ref, { 
                read: true,
                readAt: new Date().toISOString()
            });
        });
        await batch.commit();
        
        return { success: true, count: querySnapshot.size };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Get unread count for a client
export async function getUnreadCount(clientEmail) {
    try {
        const messagesRef = collection(db, COLLECTIONS.CHATS, clientEmail, COLLECTIONS.MESSAGES);
        const q = query(messagesRef, where('read', '==', false), where('sender', '==', 'client'));
        const querySnapshot = await getDocs(q);
        return { success: true, count: querySnapshot.size };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Get all chats (admin only)
export async function getAllChats() {
    try {
        const querySnapshot = await getDocs(collection(db, COLLECTIONS.CHATS));
        const chats = [];
        querySnapshot.forEach((doc) => {
            chats.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, data: chats };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ==========================
// PROJECT OPERATIONS
// ==========================

export async function createProject(projectData) {
    try {
        const user = getCurrentUser();
        if (!user) {
            throw new Error('You must be logged in to create a project');
        }

        const docRef = await addDoc(collection(db, COLLECTIONS.PROJECTS), {
            ...projectData,
            userId: user.uid,
            userEmail: user.email,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: projectData.status || 'active',
            progress: projectData.progress || 0,
            tasks: projectData.tasks || []
        });

        return { 
            success: true, 
            id: docRef.id,
            message: 'Project created successfully!'
        };
    } catch (error) {
        console.error('Create project error:', error);
        return { success: false, error: error.message };
    }
}

export async function getUserProjects(userId) {
    try {
        const q = query(
            collection(db, COLLECTIONS.PROJECTS),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const projects = [];
        querySnapshot.forEach((doc) => {
            projects.push({ id: doc.id, ...doc.data() });
        });
        
        return { success: true, data: projects };
    } catch (error) {
        console.error('Get projects error:', error);
        return { success: false, error: error.message };
    }
}

export async function getAllProjects() {
    try {
        const querySnapshot = await getDocs(collection(db, COLLECTIONS.PROJECTS));
        const projects = [];
        querySnapshot.forEach((doc) => {
            projects.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, data: projects };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function updateProject(projectId, updateData) {
    try {
        await updateDoc(doc(db, COLLECTIONS.PROJECTS, projectId), {
            ...updateData,
            updatedAt: new Date().toISOString()
        });
        return { success: true, message: 'Project updated!' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function deleteProject(projectId) {
    try {
        await deleteDoc(doc(db, COLLECTIONS.PROJECTS, projectId));
        return { success: true, message: 'Project deleted!' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ==========================
// STORAGE OPERATIONS (for files)
// ==========================

// Note: Files will be stored in Firebase Storage
// We'll add this in a separate storage.js file

export default {
    getUser,
    updateUserProfile,
    getAllUsers,
    sendMessage,
    getMessages,
    markMessageRead,
    markAllMessagesRead,
    getUnreadCount,
    getAllChats,
    createProject,
    getUserProjects
};