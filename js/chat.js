// ==========================
// MULTI-CLIENT CHAT SYSTEM
// ==========================

// ==========================
// GET ALL CHAT ROOMS
// ==========================

function getAllChatRooms() {
    return JSON.parse(localStorage.getItem('tulse_chat_rooms') || '{}');
}

// ==========================
// GET MESSAGES FOR A SPECIFIC CLIENT
// ==========================

function getClientMessages(clientEmail) {
    const rooms = getAllChatRooms();
    return rooms[clientEmail] || [];
}

// ==========================
// SAVE MESSAGES FOR A CLIENT
// ==========================

function saveClientMessages(clientEmail, messages) {
    const rooms = getAllChatRooms();
    rooms[clientEmail] = messages;
    localStorage.setItem('tulse_chat_rooms', JSON.stringify(rooms));
}

// ==========================
// SEND MESSAGE
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
    
    let messages = getClientMessages(clientEmail);
    
    const newMessage = {
        id: Date.now(),
        sender: isAdmin ? 'admin' : 'client',
        senderName: isAdmin ? 'Tulse Team' : userName,
        senderEmail: isAdmin ? 'admin@tulse.agency' : userEmail,
        message: message.trim(),
        timestamp: new Date().toISOString(),
        read: isAdmin ? true : false
    };
    
    messages.push(newMessage);
    saveClientMessages(clientEmail, messages);
    
    if (isAdmin) {
        updateAdminChatDisplay();
        updateClientList();
    } else {
        updateClientMessageDisplay();
    }
    updateAdminNotification();
    
    return newMessage;
}

// ==========================
// MARK CLIENT MESSAGES AS READ
// ==========================

function markClientMessagesAsRead(clientEmail) {
    let messages = getClientMessages(clientEmail);
    let updated = false;
    
    const newMessages = messages.map(msg => {
        if (msg.sender === 'client' && !msg.read) {
            updated = true;
            msg.read = true;
        }
        return msg;
    });
    
    if (updated) {
        saveClientMessages(clientEmail, newMessages);
        updateAdminChatDisplay();
        updateAdminNotification();
        updateClientList();
    }
}

// ==========================
// MARK SINGLE MESSAGE AS READ
// ==========================

function markMessageAsRead(clientEmail, messageId) {
    let messages = getClientMessages(clientEmail);
    let updated = false;
    
    const newMessages = messages.map(msg => {
        if (msg.id === messageId) {
            updated = true;
            msg.read = true;
        }
        return msg;
    });
    
    if (updated) {
        saveClientMessages(clientEmail, newMessages);
        updateAdminChatDisplay();
        updateAdminNotification();
        updateClientList();
    }
}

// ==========================
// GET UNREAD COUNTS
// ==========================

function getUnreadCounts() {
    const rooms = getAllChatRooms();
    const counts = {};
    let total = 0;
    
    Object.keys(rooms).forEach(email => {
        const unread = rooms[email].filter(msg => msg.sender === 'client' && !msg.read).length;
        counts[email] = unread;
        total += unread;
    });
    
    return { counts, total };
}

// ==========================
// GET ALL CLIENTS
// ==========================

function getAllClients() {
    const rooms = getAllChatRooms();
    const accountData = JSON.parse(localStorage.getItem('tulse_account_data') || '{}');
    const clientEmails = new Set(Object.keys(rooms));
    
    if (accountData.client_email && accountData.client_email !== 'admin@tulse.agency') {
        clientEmails.add(accountData.client_email);
    }
    
    const clients = [];
    clientEmails.forEach(email => {
        if (email === 'admin@tulse.agency') return;
        
        const messages = getClientMessages(email);
        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
        const unread = messages.filter(msg => msg.sender === 'client' && !msg.read).length;
        
        let name = 'Unknown Client';
        if (email === accountData.client_email && accountData.full_name) {
            name = accountData.full_name;
        } else {
            const clientMessage = messages.find(msg => msg.sender === 'client');
            if (clientMessage) {
                name = clientMessage.senderName;
            }
        }
        
        clients.push({
            email: email,
            name: name,
            lastMessage: lastMessage,
            unread: unread,
            messageCount: messages.length
        });
    });
    
    clients.sort((a, b) => {
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp);
    });
    
    return clients;
}

// ==========================
// UPDATE CLIENT MESSAGE DISPLAY
// ==========================

function updateClientMessageDisplay() {
    const container = document.getElementById('messageContainer');
    if (!container) return;
    
    const accountData = JSON.parse(localStorage.getItem('tulse_account_data') || '{}');
    const userEmail = accountData.client_email || 'client@example.com';
    const messages = getClientMessages(userEmail);
    
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
        const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
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
    
    const messages = getClientMessages(currentAdminClient);
    
    if (messages.length === 0) {
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
        const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const status = isClient && !msg.read ? ' 🔴' : (isClient && msg.read ? ' ✅' : '');
        
        html += `
            <div class="message-bubble ${className}">
                <div class="bubble">
                    <div class="sender">${escapeHtml(senderName)}${status}</div>
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
// UPDATE CLIENT LIST (Admin)
// ==========================

function updateClientList() {
    const container = document.getElementById('adminClientList');
    if (!container) return;
    
    const clients = getAllClients();
    const countBadge = document.getElementById('clientCountBadge');
    if (countBadge) countBadge.textContent = clients.length;
    
    if (clients.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 30px 20px; color: #94a3b8;">
                <p>No clients yet. They'll appear here when they start chatting.</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    clients.forEach(client => {
        const isActive = currentAdminClient === client.email;
        const initial = client.name.charAt(0).toUpperCase();
        const lastMsg = client.lastMessage ? 
            `<div class="last-msg">${escapeHtml(client.lastMessage.message.substring(0, 40))}${client.lastMessage.message.length > 40 ? '...' : ''}</div>` : '';
        const time = client.lastMessage ? 
            `<div class="client-time">${new Date(client.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>` : '';
        const unreadBadge = client.unread > 0 ? `<span class="unread-badge">${client.unread}</span>` : '';
        
        html += `
            <div class="client-item ${isActive ? 'active' : ''}" onclick="selectClient('${client.email}')">
                <div class="avatar-small" style="background: ${isActive ? '#000' : 'var(--accent-color)'}; color: ${isActive ? 'var(--accent-color)' : '#000'};">${initial}</div>
                <div class="client-info">
                    <div class="name">${escapeHtml(client.name)} ${unreadBadge}</div>
                    ${lastMsg}
                </div>
                ${time}
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ==========================
// UPDATE ADMIN NOTIFICATION
// ==========================

function updateAdminNotification() {
    const { total } = getUnreadCounts();
    
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
    
    if (isAdmin) {
        updateClientList();
        updateAdminChatDisplay();
        updateAdminNotification();
        
        setInterval(() => {
            updateClientList();
            updateAdminChatDisplay();
            updateAdminNotification();
        }, 3000);
    } else {
        updateClientMessageDisplay();
        setInterval(updateClientMessageDisplay, 3000);
    }
}

// Run on load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initChat, 200);
});