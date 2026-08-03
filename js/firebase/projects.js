// ==========================
// PROJECT MANAGEMENT
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
    serverTimestamp,
    writeBatch
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import { COLLECTIONS } from './collections.js';
import { getCurrentUser } from './auth.js';

// ==========================
// CREATE PROJECT
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
            tasks: projectData.tasks || [],
            attachments: projectData.attachments || []
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

// ==========================
// GET PROJECT BY ID
// ==========================
export async function getProject(projectId) {
    try {
        const docSnap = await getDoc(doc(db, COLLECTIONS.PROJECTS, projectId));
        if (docSnap.exists()) {
            return { 
                success: true, 
                data: { id: docSnap.id, ...docSnap.data() } 
            };
        }
        return { success: false, error: 'Project not found' };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// ==========================
// GET ALL PROJECTS FOR USER
// ==========================
export async function getUserProjects() {
    try {
        const user = getCurrentUser();
        if (!user) {
            throw new Error('You must be logged in');
        }

        const q = query(
            collection(db, COLLECTIONS.PROJECTS),
            where('userId', '==', user.uid),
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

// ==========================
// GET ALL PROJECTS (ADMIN)
// ==========================
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

// ==========================
// UPDATE PROJECT
// ==========================
export async function updateProject(projectId, updateData) {
    try {
        const user = getCurrentUser();
        if (!user) {
            throw new Error('You must be logged in');
        }

        const projectRef = doc(db, COLLECTIONS.PROJECTS, projectId);
        
        // Check if user owns the project or is admin
        const projectSnap = await getDoc(projectRef);
        if (!projectSnap.exists()) {
            throw new Error('Project not found');
        }
        
        const projectData = projectSnap.data();
        const isAdmin = projectData.role === 'admin';
        
        if (projectData.userId !== user.uid && !isAdmin) {
            throw new Error('You don\'t have permission to update this project');
        }

        await updateDoc(projectRef, {
            ...updateData,
            updatedAt: new Date().toISOString()
        });

        return { 
            success: true, 
            message: 'Project updated successfully!' 
        };
    } catch (error) {
        console.error('Update project error:', error);
        return { success: false, error: error.message };
    }
}

// ==========================
// DELETE PROJECT
// ==========================
export async function deleteProject(projectId) {
    try {
        const user = getCurrentUser();
        if (!user) {
            throw new Error('You must be logged in');
        }

        const projectRef = doc(db, COLLECTIONS.PROJECTS, projectId);
        
        // Check if user owns the project or is admin
        const projectSnap = await getDoc(projectRef);
        if (!projectSnap.exists()) {
            throw new Error('Project not found');
        }
        
        const projectData = projectSnap.data();
        const isAdmin = projectData.role === 'admin';
        
        if (projectData.userId !== user.uid && !isAdmin) {
            throw new Error('You don\'t have permission to delete this project');
        }

        await deleteDoc(projectRef);

        return { 
            success: true, 
            message: 'Project deleted successfully!' 
        };
    } catch (error) {
        console.error('Delete project error:', error);
        return { success: false, error: error.message };
    }
}

// ==========================
// ADD TASK TO PROJECT
// ==========================
export async function addTask(projectId, task) {
    try {
        const projectRef = doc(db, COLLECTIONS.PROJECTS, projectId);
        const projectSnap = await getDoc(projectRef);
        
        if (!projectSnap.exists()) {
            throw new Error('Project not found');
        }

        const projectData = projectSnap.data();
        const tasks = projectData.tasks || [];
        
        const newTask = {
            id: Date.now().toString(),
            title: task.title,
            description: task.description || '',
            status: task.status || 'pending',
            assignedTo: task.assignedTo || '',
            dueDate: task.dueDate || '',
            createdAt: new Date().toISOString(),
            completed: false
        };
        
        tasks.push(newTask);
        
        await updateDoc(projectRef, {
            tasks: tasks,
            updatedAt: new Date().toISOString()
        });

        return { 
            success: true, 
            data: newTask,
            message: 'Task added successfully!' 
        };
    } catch (error) {
        console.error('Add task error:', error);
        return { success: false, error: error.message };
    }
}

// ==========================
// UPDATE TASK STATUS
// ==========================
export async function updateTaskStatus(projectId, taskId, status) {
    try {
        const projectRef = doc(db, COLLECTIONS.PROJECTS, projectId);
        const projectSnap = await getDoc(projectRef);
        
        if (!projectSnap.exists()) {
            throw new Error('Project not found');
        }

        const projectData = projectSnap.data();
        const tasks = projectData.tasks || [];
        
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) {
            throw new Error('Task not found');
        }
        
        tasks[taskIndex].status = status;
        tasks[taskIndex].completed = status === 'completed';
        tasks[taskIndex].updatedAt = new Date().toISOString();
        
        // Calculate progress
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const progress = Math.round((completedTasks / tasks.length) * 100);
        
        await updateDoc(projectRef, {
            tasks: tasks,
            progress: progress,
            updatedAt: new Date().toISOString()
        });

        return { 
            success: true, 
            message: 'Task updated successfully!' 
        };
    } catch (error) {
        console.error('Update task error:', error);
        return { success: false, error: error.message };
    }
}

export default {
    createProject,
    getProject,
    getUserProjects,
    getAllProjects,
    updateProject,
    deleteProject,
    addTask,
    updateTaskStatus
};