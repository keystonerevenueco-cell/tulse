// ==========================
// CHAT SYSTEM - NOW USES FIREBASE
// ==========================

// ==========================
// SEND MESSAGE (Uses Firebase)
// ==========================

function sendMessage(message, targetClientEmail = null) {
    if (!message || message.trim() === '') return;
    
    const accountData = JSON.parse(localStorage.getItem('tulse_account_data') || '{}');
    const isAdmin = localStorage.getItem('tulse_is_admin') === 'true';
    const userEmail = isAdmin ? 'admin@tulse.agency' : (accountData.client_email || 'client@example.com');
    const userName = isAdmin ? 'Tulse Team' : (accountData.full_name || 'Client');
    
    let clientEmail;
    if (isAdmin) {
        clientEmail = targetClientEmail;
        if (!clientEmail) {
            console.error('Admin must specify a client email');
            return;
        }
    } else {
        clientEmail = userEmail;
    }
    
    // Use Firebase
    sendFirebaseMessage(message, clientEmail);
}

// ==========================
// SEND CLIENT MESSAGE
// ==========================

function sendClientMessage() {
    const input = document.getElementById('messageInput');
    if (!input) return;
    const message = input.value.trim();
    if (!message) return;
    
    sendMessage(message);
    input.value = '';
}

// ==========================
// SEND ADMIN REPLY
// ==========================

function sendAdminReply() {
    const input = document.getElementById('adminReplyInput');
    if (!input) return;
    const message = input.value.trim();
    if (!message) return;
    if (!currentAdminClient) {
        alert('Please select a client first.');
        return;
    }
    
    sendMessage(message, currentAdminClient);
    input.value = '';
}

// ==========================
// UPDATE CLIENT MESSAGE DISPLAY
// ==========================

function updateClientMessageDisplay() {
    const container = document.getElementById('messageContainer');
    if (!container) return;
    
    const accountData = JSON.parse(localStorage.getItem('tulse_account_data') || '{}');
    const userEmail = accountData.client_email || 'client@example.com';
    
    db.collection('chats')
        .doc(userEmail)
        .collection('messages')
        .orderBy('timestamp', 'asc')
        .onSnapshot((snapshot) => {
            const messages = [];
            snapshot.forEach((doc) => {
                messages.push({ id: doc.id, ...doc.data() });
            });
            renderClientMessages(container, messages);
        }, (error) => {
            console.error('Error listening to messages:', error);
        });
}

function renderClientMessages(container, messages) {
    if (messages.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-comment-dots"></i>
                <p>No messages yet. Start the conversation!</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    messages.forEach(msg => {
        const isClient = msg.sender === 'client';
        const className = isClient ? 'client' : 'admin';
        const senderName = isClient ? 'You' : 'Tulse Team';
        const time = msg.timestamp ? 
            new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
            '';
        
        html += `
            <div class="message-bubble ${className}">
                <div class="bubble">
                    <div class="sender">${escapeHtml(senderName)}</div>
                    <div class="text">${escapeHtml(msg.message)}</div>
                    <div class="time">${time}</div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
}

// ==========================
// UPDATE ADMIN CHAT DISPLAY
// ==========================

function updateAdminChatDisplay() {
    const container = document.getElementById('adminMessageContainer');
    if (!container) return;
    
    if (!currentAdminClient) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-circle"></i>
                <p>Select a client from the list to start chatting.</p>
            </div>
        `;
        return;
    }
    
    db.collection('chats')
        .doc(currentAdminClient)
        .collection('messages')
        .orderBy('timestamp', 'asc')
        .onSnapshot((snapshot) => {
            const messages = [];
            snapshot.forEach((doc) => {
                messages.push({ id: doc.id, ...doc.data() });
            });
            renderAdminMessages(container, messages);
            
            const unread = messages.filter(msg => msg.sender === 'client' && !msg.read);
            if (unread.length > 0) {
                markMessagesAsRead(currentAdminClient);
            }
        }, (error) => {
            console.error('Error listening to admin messages:', error);
        });
}

function renderAdminMessages(container, messages) {
    if (!messages || messages.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-comment-dots"></i>
                <p>No messages with this client yet.</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    messages.forEach(msg => {
        const isClient = msg.sender === 'client';
        const className = isClient ? 'client' : 'admin';
        const senderName = isClient ? msg.senderName : 'You (Admin)';
        const time = msg.timestamp ? 
            new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
            '';
        const status = isClient && !msg.read ? ' 🔴' : (isClient && msg.read ? ' ✅' : '');
        
        html += `
            <div class="message-bubble ${className}">
                <div class="bubble">
                    <div class="sender">${escapeHtml(senderName)}${status}</div>
                    <div class="text">${escapeHtml(msg.message)}</div>
                    <div class>${time}</div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
}

// ==========================
// UPDATE CLIENT LIST (Admin)
// ==========================

function updateClientList() {
    const container = document.getElementById('adminClientList');
    if (!container) return;
    
    console.log('📋 Updating client list...');
    
    getAllFirebaseClients().then((clients) => {
        const countBadge = document.getElementById('clientCountBadge');
        if (countBadge) countBadge.textContent = clients.length;
        
        if (clients.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 30px 20px; color: #94a3b8;">
                    <p>No clients yet. They'll appear here when they start chatting.</p>
                    <p style="font-size: 0.8rem; margin-top: 10px;">💡 Send a message from the client tab first!</p>
                </div>
            `;
            return;
        }
        
        const accountData = JSON.parse(localStorage.getItem('tulse_account_data') || '{}');
        let allHtml = '';
        let processed = 0;
        
        clients.forEach((client) => {
            const email = client.email;
            let name = email.split('@')[0];
            if (email === accountData.client_email && accountData.full_name) {
                name = accountData.full_name;
            }
            
            getUnreadCountFirebase(email).then((unread) => {
                db.collection('chats')
                    .doc(email)
                    .collection('messages')
                    .orderBy('timestamp', 'desc')
                    .limit(1)
                    .get()
                    .then((snapshot) => {
                        let lastMsg = null;
                        let lastTime = '';
                        if (!snapshot.empty) {
                            const data = snapshot.docs[0].data();
                            lastMsg = data.message;
                            if (data.timestamp) {
                                lastTime = new Date(data.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            }
                        }
                        
                        const isActive = currentAdminClient === email;
                        const initial = name.charAt(0).toUpperCase();
                        const lastMsgDisplay = lastMsg ? 
                            `<div class="last-msg">${escapeHtml(lastMsg.substring(0, 40))}${lastMsg.length > 40 ? '...' : ''}</div>` : '';
                        const unreadBadge = unread > 0 ? `<span class="unread-badge">${unread}</span>` : '';
                        
                        allHtml += `
                            <div class="client-item ${isActive ? 'active' : ''}" onclick="selectClient('${email}')">
                                <div class="avatar-small" style="background: ${isActive ? '#000' : 'var(--accent-color)'}; color: ${isActive ? 'var(--accent-color)' : '#000'};">${initial}</div>
                                <div class="client-info">
                                    <div class="name">${escapeHtml(name)} ${unreadBadge}</div>
                                    ${lastMsgDisplay}
                                </div>
                                ${lastTime ? `<div class="client-time">${lastTime}</div>` : ''}
                            </div>
                        `;
                        
                        processed++;
                        if (processed === clients.length) {
                            container.innerHTML = allHtml;
                            console.log(`📋 Client list updated with ${clients.length} clients`);
                        }
                    });
            });
        });
    });
}

// ==========================
// SELECT CLIENT (Admin)
// ==========================

function selectClient(clientEmail) {
    console.log('🖱️ Selecting client:', clientEmail);
    currentAdminClient = clientEmail;
    
    const accountData = JSON.parse(localStorage.getItem('tulse_account_data') || '{}');
    const name = clientEmail.split('@')[0];
    const displayName = (clientEmail === accountData.client_email && accountData.full_name) ? accountData.full_name : name;
    
    const nameEl = document.getElementById('adminChatClientName');
    const replyNameEl = document.getElementById('adminReplyClientName');
    if (nameEl) nameEl.textContent = displayName;
    if (replyNameEl) replyNameEl.textContent = displayName;
    
    const replyArea = document.getElementById('adminReplyArea');
    if (replyArea) replyArea.style.display = 'block';
    
    markMessagesAsRead(clientEmail);
    updateAdminChatDisplay();
    updateClientList();
    updateAdminNotification();
}

// ==========================
// MARK MESSAGES AS READ
// ==========================

function markMessagesAsRead(clientEmail) {
    if (!clientEmail) return;
    
    db.collection('chats')
        .doc(clientEmail)
        .collection('messages')
        .where('read', '==', false)
        .where('sender', '==', 'client')
        .get()
        .then((snapshot) => {
            if (snapshot.empty) return;
            
            const batch = db.batch();
            snapshot.forEach((doc) => {
                batch.update(doc.ref, { read: true });
            });
            return batch.commit();
        })
        .then(() => {
            console.log('✅ Messages marked as read for:', clientEmail);
            updateAdminNotification();
            updateClientList();
        })
        .catch((error) => {
            console.error('Error marking messages as read:', error);
        });
}

// ==========================
// UPDATE ADMIN NOTIFICATION
// ==========================

function updateAdminNotification() {
    getTotalUnreadCount().then((total) => {
        console.log('🔔 Total unread messages:', total);
        
        const messageBadge = document.getElementById('messageBadge');
        if (messageBadge) {
            if (total > 0) {
                messageBadge.classList.remove('hidden');
                messageBadge.textContent = total;
            } else {
                messageBadge.classList.add('hidden');
            }
        }
        
        const adminBadge = document.getElementById('adminBadgeNotification');
        if (adminBadge) {
            if (total > 0) {
                adminBadge.classList.remove('hidden');
                adminBadge.textContent = total;
            } else {
                adminBadge.classList.add('hidden');
            }
        }
    });
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
// INIT CHAT
// ==========================

function initChat() {
    const isAdmin = localStorage.getItem('tulse_is_admin') === 'true';
    const accountData = JSON.parse(localStorage.getItem('tulse_account_data') || '{}');
    
    console.log('🚀 Initializing Chat...');
    console.log('isAdmin:', isAdmin);
    console.log('accountData:', accountData);
    
    if (isAdmin) {
        document.getElementById('adminChatView').style.display = 'block';
        document.getElementById('clientChatView').style.display = 'none';
        updateClientList();
        updateAdminNotification();
        
        setInterval(() => {
            updateClientList();
            updateAdminNotification();
        }, 5000);
    } else {
        document.getElementById('adminChatView').style.display = 'none';
        document.getElementById('clientChatView').style.display = 'block';
        if (accountData.client_email) {
            updateClientMessageDisplay();
        }
    }
}

// Run on load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initChat, 500);
});

// Expose functions globally
window.sendAdminReply = sendAdminReply;
window.sendClientMessage = sendClientMessage;
window.selectClient = selectClient;
window.markMessagesAsRead = markMessagesAsRead;
window.updateClientList = updateClientList;
window.updateAdminNotification = updateAdminNotification;
window.currentAdminClient = currentAdminClient;