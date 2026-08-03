// ==========================
// ADMIN ACCESS
// ==========================

function isAdmin() {
    return localStorage.getItem('tulse_is_admin') === 'true';
}

// ==========================
// UPDATE ADMIN DASHBOARD - FIXED FOR FIREBASE
// ==========================

function updateAdminDashboard() {
    if (!isAdmin()) return;
    
    console.log('📊 Updating admin dashboard...');
    
    // Client List - Use Firebase
    const clientList = document.getElementById('clientList');
    if (clientList) {
        getAllFirebaseClients().then((clients) => {
            if (clients.length === 0) {
                clientList.innerHTML = '<p style="color: #94a3b8; font-size: 0.9rem;">No clients yet.</p>';
            } else {
                let html = '';
                const accountData = JSON.parse(localStorage.getItem('tulse_account_data') || '{}');
                
                clients.forEach((client) => {
                    const email = client.email;
                    let name = email.split('@')[0];
                    if (email === accountData.client_email && accountData.full_name) {
                        name = accountData.full_name;
                    }
                    
                    // Get message count
                    db.collection('chats')
                        .doc(email)
                        .collection('messages')
                        .get()
                        .then((snapshot) => {
                            const msgCount = snapshot.size;
                            // Update the HTML with message count - we'll handle this differently
                        });
                    
                    html += `
                        <div class="admin-client-item">
                            <div>
                                <div class="client-name">${escapeHtml(name)}</div>
                                <div class="client-email">${escapeHtml(email)}</div>
                                <div style="font-size: 0.85rem; color: #64748b;">Click to chat</div>
                            </div>
                            <span class="client-status">Active</span>
                        </div>
                    `;
                });
                clientList.innerHTML = html;
            }
        });
    }
    
    // Admin Message List - Use Firebase
    const adminMessageList = document.getElementById('adminMessageList');
    if (adminMessageList) {
        getAllFirebaseClients().then((clients) => {
            let allMessages = [];
            let processed = 0;
            
            if (clients.length === 0) {
                adminMessageList.innerHTML = '<p style="color: #94a3b8; font-size: 0.9rem;">No client messages yet.</p>';
                return;
            }
            
            clients.forEach((client) => {
                const email = client.email;
                db.collection('chats')
                    .doc(email)
                    .collection('messages')
                    .orderBy('timestamp', 'desc')
                    .limit(10)
                    .get()
                    .then((snapshot) => {
                        snapshot.forEach((doc) => {
                            const data = doc.data();
                            if (data.sender === 'client') {
                                allMessages.push({ 
                                    ...data, 
                                    clientEmail: email,
                                    id: doc.id 
                                });
                            }
                        });
                        
                        processed++;
                        if (processed === clients.length) {
                            // Sort by timestamp
                            allMessages.sort((a, b) => {
                                const timeA = a.timestamp ? a.timestamp.toDate ? a.timestamp.toDate() : new Date(a.timestamp) : new Date(0);
                                const timeB = b.timestamp ? b.timestamp.toDate ? b.timestamp.toDate() : new Date(b.timestamp) : new Date(0);
                                return timeB - timeA;
                            });
                            
                            if (allMessages.length === 0) {
                                adminMessageList.innerHTML = '<p style="color: #94a3b8; font-size: 0.9rem;">No client messages yet.</p>';
                            } else {
                                let html = '';
                                allMessages.slice(0, 20).forEach((msg) => {
                                    const isRead = msg.read ? '✅' : '🔴';
                                    const time = msg.timestamp ? 
                                        (msg.timestamp.toDate ? new Date(msg.timestamp.toDate()).toLocaleString() : new Date(msg.timestamp).toLocaleString()) : 
                                        'Unknown';
                                    const senderName = msg.senderName || 'Client';
                                    const messageText = msg.message || '';
                                    
                                    html += `
                                        <div class="admin-message-item">
                                            <div style="flex: 1;">
                                                <div class="message-sender">${escapeHtml(senderName)}</div>
                                                <div class="message-text">${escapeHtml(messageText)}</div>
                                                <div class="message-time">${time}</div>
                                            </div>
                                            <div style="display: flex; gap: 8px; align-items: center;">
                                                <span class="message-status">${isRead}</span>
                                                ${!msg.read ? `<button class="mark-read-btn" onclick="markMessagesAsRead('${msg.clientEmail}')">Mark Read</button>` : ''}
                                            </div>
                                        </div>
                                    `;
                                });
                                adminMessageList.innerHTML = html;
                            }
                        }
                    });
            });
        });
    }
    
    // Admin File List
    const adminFileList = document.getElementById('adminFileList');
    if (adminFileList) {
        const files = JSON.parse(localStorage.getItem('tulse_project_files') || '[]');
        if (files.length === 0) {
            adminFileList.innerHTML = '<p style="color: #94a3b8; font-size: 0.9rem;">No files uploaded yet.</p>';
        } else {
            let html = '';
            files.forEach(file => {
                const size = file.size < 1024 ? file.size + ' B' : 
                             file.size < 1024 * 1024 ? (file.size / 1024).toFixed(1) + ' KB' : 
                             (file.size / (1024 * 1024)).toFixed(1) + ' MB';
                html += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #f1f5f9;">
                        <span>📄 ${escapeHtml(file.name)}</span>
                        <span style="font-size: 0.8rem; color: #64748b;">${size}</span>
                    </div>
                `;
            });
            adminFileList.innerHTML = html;
        }
    }
}

// ==========================
// ESCAPE HTML
// ==========================

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==========================
// CHECK ADMIN ON LOAD
// ==========================

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('client-dashboard.html')) {
        const isAdminUser = isAdmin();
        
        if (isAdminUser) {
            document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
            document.getElementById('adminBadge').classList.add('show');
            setTimeout(updateAdminDashboard, 1000);
        }
    }
});