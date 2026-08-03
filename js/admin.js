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
// UPDATE ADMIN DASHBOARD
// ==========================

function updateAdminDashboard() {
    if (!isAdmin()) return;
    
    // Update client list in admin dashboard
    const clientList = document.getElementById('clientList');
    if (clientList) {
        const clients = getAllClients();
        if (clients.length === 0) {
            clientList.innerHTML = '<p style="color: #94a3b8; font-size: 0.9rem;">No clients yet.</p>';
        } else {
            let html = '';
            clients.forEach(client => {
                html += `
                    <div class="admin-client-item">
                        <div>
                            <div class="client-name">${escapeHtml(client.name)}</div>
                            <div class="client-email">${escapeHtml(client.email)}</div>
                            <div style="font-size: 0.85rem; color: #64748b;">Messages: ${client.messageCount}</div>
                        </div>
                        <span class="client-status">${client.unread > 0 ? '🔴 ' + client.unread + ' unread' : '✅ All read'}</span>
                    </div>
                `;
            });
            clientList.innerHTML = html;
        }
    }
    
    // Update admin message list
    const adminMessageList = document.getElementById('adminMessageList');
    if (adminMessageList) {
        const rooms = getAllChatRooms();
        let allMessages = [];
        Object.keys(rooms).forEach(email => {
            rooms[email].forEach(msg => {
                if (msg.sender === 'client') {
                    allMessages.push({ ...msg, clientEmail: email });
                }
            });
        });
        allMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        if (allMessages.length === 0) {
            adminMessageList.innerHTML = '<p style="color: #94a3b8; font-size: 0.9rem;">No client messages yet.</p>';
        } else {
            let html = '';
            allMessages.slice(0, 20).forEach(msg => {
                const isRead = msg.read ? '✅' : '🔴';
                const time = new Date(msg.timestamp).toLocaleString();
                html += `
                    <div class="admin-message-item">
                        <div style="flex: 1;">
                            <div class="message-sender">${escapeHtml(msg.senderName)}</div>
                            <div class="message-text">${escapeHtml(msg.message)}</div>
                            <div class="message-time">${time}</div>
                        </div>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <span class="message-status">${isRead}</span>
                            ${!msg.read ? `<button class="mark-read-btn" onclick="markMessageAsRead('${msg.clientEmail}', ${msg.id})">Mark Read</button>` : ''}
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
                        <span>📄 ${escapeHtml(file.name)}</span>
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
        
        // Show/hide admin elements
        const adminElements = document.querySelectorAll('.admin-only');
        adminElements.forEach(el => {
            el.style.display = isAdminUser ? 'block' : 'none';
        });
        
        // Show/hide chat views
        const adminChatView = document.getElementById('adminChatView');
        const clientChatView = document.getElementById('clientChatView');
        if (adminChatView) adminChatView.style.display = isAdminUser ? 'block' : 'none';
        if (clientChatView) clientChatView.style.display = isAdminUser ? 'none' : 'block';
        
        if (isAdminUser) {
            document.getElementById('adminBadge').classList.add('show');
            setTimeout(updateAdminDashboard, 500);
        }
    }
});