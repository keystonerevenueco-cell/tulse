// ==========================
// FIRESTORE COLLECTIONS
// ==========================

import { db } from './config.js';
import { collection, doc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Collection references
export const COLLECTIONS = {
    USERS: 'users',
    PROJECTS: 'projects',
    MESSAGES: 'messages',
    FILES: 'files',
    CHATS: 'chats',          // Keep for backward compatibility
    ORDERS: 'orders',        // For payment tracking
    LEADS: 'leads'           // For lead intelligence
};

// Helper functions to get collection references
export const getUsersCollection = () => collection(db, COLLECTIONS.USERS);
export const getProjectsCollection = () => collection(db, COLLECTIONS.PROJECTS);
export const getMessagesCollection = () => collection(db, COLLECTIONS.MESSAGES);
export const getFilesCollection = () => collection(db, COLLECTIONS.FILES);
export const getChatsCollection = () => collection(db, COLLECTIONS.CHATS);
export const getOrdersCollection = () => collection(db, COLLECTIONS.ORDERS);
export const getLeadsCollection = () => collection(db, COLLECTIONS.LEADS);

// Get document references
export const getUserDoc = (userId) => doc(db, COLLECTIONS.USERS, userId);
export const getProjectDoc = (projectId) => doc(db, COLLECTIONS.PROJECTS, projectId);
export const getChatDoc = (email) => doc(db, COLLECTIONS.CHATS, email);
export const getMessagesSubcollection = (email) => collection(db, COLLECTIONS.CHATS, email, COLLECTIONS.MESSAGES);
export const getMessageDoc = (email, messageId) => doc(db, COLLECTIONS.CHATS, email, COLLECTIONS.MESSAGES, messageId);

export default COLLECTIONS;