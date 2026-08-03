// ==========================
// FIREBASE STORAGE
// ==========================

import { storage } from './config.js';
import { 
    ref,
    uploadBytes,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject,
    listAll,
    getMetadata
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

import { db } from './config.js';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { COLLECTIONS } from './collections.js';
import { getCurrentUser } from './auth.js';

// ==========================
// UPLOAD FILE
// ==========================
export async function uploadFile(file, path = 'uploads') {
    try {
        const user = getCurrentUser();
        if (!user) {
            throw new Error('User must be logged in to upload files');
        }
        
        const filePath = `${path}/${user.uid}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, filePath);
        
        // Upload file
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        // Return a promise that resolves with the download URL
        return new Promise((resolve, reject) => {
            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    // Progress
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload progress:', progress + '%');
                },
                (error) => {
                    reject(error);
                },
                async () => {
                    // Upload completed
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    
                    // Save file metadata to Firestore
                    const fileData = {
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        path: filePath,
                        downloadURL: downloadURL,
                        userId: user.uid,
                        userEmail: user.email,
                        uploadedAt: new Date().toISOString()
                    };
                    
                    const docRef = await addDoc(collection(db, COLLECTIONS.FILES), fileData);
                    
                    resolve({
                        success: true,
                        id: docRef.id,
                        data: fileData,
                        downloadURL: downloadURL
                    });
                }
            );
        });
    } catch (error) {
        console.error('Upload error:', error);
        return { success: false, error: error.message };
    }
}

// ==========================
// GET ALL FILES FOR USER
// ==========================
export async function getUserFiles() {
    try {
        const user = getCurrentUser();
        if (!user) {
            throw new Error('User must be logged in');
        }
        
        const q = query(
            collection(db, COLLECTIONS.FILES),
            where('userId', '==', user.uid),
            orderBy('uploadedAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const files = [];
        querySnapshot.forEach((doc) => {
            files.push({ id: doc.id, ...doc.data() });
        });
        
        return { success: true, data: files };
    } catch (error) {
        console.error('Get files error:', error);
        return { success: false, error: error.message };
    }
}

// ==========================
// GET ALL FILES (Admin)
// ==========================
export async function getAllFiles() {
    try {
        const querySnapshot = await getDocs(collection(db, COLLECTIONS.FILES));
        const files = [];
        querySnapshot.forEach((doc) => {
            files.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, data: files };
    } catch (error) {
        console.error('Get all files error:', error);
        return { success: false, error: error.message };
    }
}

// ==========================
// DELETE FILE
// ==========================
export async function deleteFile(fileId) {
    try {
        const user = getCurrentUser();
        if (!user) {
            throw new Error('User must be logged in');
        }
        
        // Get file metadata from Firestore
        const fileDoc = await getDoc(doc(db, COLLECTIONS.FILES, fileId));
        if (!fileDoc.exists()) {
            throw new Error('File not found');
        }
        
        const fileData = fileDoc.data();
        
        // Delete from Storage
        const storageRef = ref(storage, fileData.path);
        await deleteObject(storageRef);
        
        // Delete from Firestore
        await deleteDoc(doc(db, COLLECTIONS.FILES, fileId));
        
        return { success: true };
    } catch (error) {
        console.error('Delete error:', error);
        return { success: false, error: error.message };
    }
}

// ==========================
// SHARE FILE (generate download link)
// ==========================
export async function shareFile(fileId) {
    try {
        const fileDoc = await getDoc(doc(db, COLLECTIONS.FILES, fileId));
        if (!fileDoc.exists()) {
            throw new Error('File not found');
        }
        
        const fileData = fileDoc.data();
        return { success: true, downloadURL: fileData.downloadURL };
    } catch (error) {
        console.error('Share error:', error);
        return { success: false, error: error.message };
    }
}

export default {
    uploadFile,
    getUserFiles,
    getAllFiles,
    deleteFile,
    shareFile
};