// ==========================
// ADMIN ACCESS
// ==========================

function isAdmin() {
    return localStorage.getItem('tulse_is_admin') === 'true';
}

function loginAsAdmin(password) {
    const ADMIN_PASSWORD = 'tulseadmin2026';
    if (password === ADMIN_PASSWORD) {
        localStorage.setItem('tulse_is_admin', 'true');
        localStorage.setItem('tulse_logged_in', 'true');
        localStorage.setItem('tulse_user_email', 'admin@tulse.agency');
        window.location.href = 'client-dashboard.html';
        return true;
    }
    return false;
}

function adminLogout() {
    localStorage.removeItem('tulse_is_admin');
    localStorage.removeItem('tulse_logged_in');
    window.location.href = 'index.html';
}

// ==========================
// GET ALL CLIENTS
// ==========================

function getAllClients() {
    const clients = [];
    
    // Check for client data in localStorage
    const accountData = JSON.parse(localStorage.getItem('tulse_account_data') || '{}');
    const projectData = JSON.parse(localStorage.getItem('tulse_project_data') || '{}');
    
    if (accountData.client_email) {
        clients.push({
            email: accountData.client_email,
            name: accountData.full_name || 'Unknown',
            project: projectData.target_industry || 'No project',
            status: 'Active'
        });
    }
    
    return clients;
}

// ==========================
// UPDATE ADMIN DASHBOARD
// ==========================

function updateAdminDashboard() {
    if (!isAdmin()) return;
    
    // Update client list
    const clientList = document.getElementById('clientList');
    if (clientList) {
        const clients = getAllClients();
        if (clients.length === 0) {
            clientList.innerHTML = '<p style="color: #94a3b8; font-size: 0.9rem;">No clients yet.</p>';
        } else {
            let html = '';
            clients.forEach(client => {
                html += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                        <div>
                            <strong>${client.name}</strong>
                            <div style="font-size: 0.85rem; color: #64748b;">${client.email}</div>
                            <div style="font-size: 0.8rem; color: #64748b;">Project: ${client.project}</div>
                        </div>
                        <span style="background: #22c55e; color: white; padding: 2px 10px; border-radius: 50px; font-size: 0.7rem; font-weight: 600;">${client.status}</span>
                    </div>
                `;
            });
            clientList.innerHTML = html;
        }
    }
    
    // Update admin message list
    const adminMessageList = document.getElementById('adminMessageList');
    if (adminMessageList) {
        const messages = JSON.parse(localStorage.getItem('tulse_chat_messages') || '[]');
        const clientMessages = messages.filter(m => m.sender === 'client');
        
        if (clientMessages.length === 0) {
            adminMessageList.innerHTML = '<p style="color: #94a3b8; font-size: 0.9rem;">No client messages yet.</p>';
        } else {
            let html = '';
            clientMessages.forEach(msg => {
                const isRead = msg.read ? '✅' : '🔴';
                html += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
                        <div>
                            <div style="font-weight: 600;">${msg.senderName}</div>
                            <div style="font-size: 0.9rem;">${msg.message}</div>
                            <div style="font-size: 0.75rem; color: #94a3b8;">${new Date(msg.timestamp).toLocaleString()}</div>
                        </div>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <span>${isRead}</span>
                            <button onclick="markAsRead(${msg.id})" style="padding: 4px 12px; border-radius: 6px; background: var(--accent-color); color: #000; border: none; cursor: pointer; font-size: 0.7rem;">Mark Read</button>
                        </div>
                    </div>
                `;
            });
            adminMessageList.innerHTML = html;
        }
    }
    
    // Update admin file list
    const adminFileList = document.getElementById('adminFileList');
    if (adminFileList) {
        const files = JSON.parse(localStorage.getItem('tulse_project_files') || '[]');
        if (files.length === 0) {
            adminFileList.innerHTML = '<p style="color: #94a3b8; font-size: 0.9rem;">No files uploaded yet.</p>';
        } else {
            let html = '';
            files.forEach(file => {
                html += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
                        <span>📄 ${file.name}</span>
                        <span style="font-size: 0.8rem; color: #64748b;">${(file.size / 1024).toFixed(1)} KB</span>
                    </div>
                `;
            });
            adminFileList.innerHTML = html;
        }
    }
}

// ==========================
// CHECK ADMIN ON LOAD
// ==========================

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('client-dashboard.html')) {
        const isAdminUser = isAdmin();
        
        const adminElements = document.querySelectorAll('.admin-only');
        adminElements.forEach(el => {
            el.style.display = isAdminUser ? 'block' : 'none';
        });
        
        if (isAdminUser) {
            updateAdminDashboard();
            
            // Update every 10 seconds
            setInterval(updateAdminDashboard, 10000);
        }
    }
});