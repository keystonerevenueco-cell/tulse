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
// SEND MESSAGE (Client or Admin)
// ==========================

function sendMessage(message, targetClientEmail = null) {
    if (!message || message.trim() === '') return;
    
    const accountData = JSON.parse(localStorage.getItem('tulse_account_data') || '{}');
    const isAdmin = localStorage.getItem('tulse_is_admin') === 'true';
    const userEmail = isAdmin ? 'admin@tulse.agency' : (accountData.client_email || 'client@example.com');
    const userName = isAdmin ? 'Tulse Team' : (accountData.full_name || 'Client');
    
    // Determine which client's chat to save to
    let clientEmail;
    if (isAdmin) {
        // Admin is replying to a specific client
        clientEmail = targetClientEmail;
        if (!clientEmail) {
            console.error('Admin must specify a client email');
            return;
        }
    } else {
        // Client is sending to their own chat
        clientEmail = userEmail;
    }
    
    // Get existing messages for this client
    let messages = getClientMessages(clientEmail);
    
    // Create new message
    const newMessage = {
        id: Date.now(),
        sender: isAdmin ? 'admin' : 'client',
        senderName: isAdmin ? 'Tulse Team' : userName,
        senderEmail: isAdmin ? 'admin@tulse.agency' : userEmail,
        message: message.trim(),
        timestamp: new Date().toISOString(),
        read: isAdmin ? true : false // If admin sends, it's already read
    };
    
    // Add to messages
    messages.push(newMessage);
    saveClientMessages(clientEmail, messages);
    
    // Update displays
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
// MARK MESSAGES AS READ FOR A CLIENT
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
// GET UNREAD COUNT FOR ALL CLIENTS
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
// GET ALL CLIENTS (from chat rooms + account data)
// ==========================

function getAllClients() {
    const rooms = getAllChatRooms();
    const accountData = JSON.parse(localStorage.getItem('tulse_account_data') || '{}');
    const clientEmails = new Set(Object.keys(rooms));
    
    // If there's account data, add it even if no messages yet
    if (accountData.client_email) {
        clientEmails.add(accountData.client_email);
    }
    
    const clients = [];
    clientEmails.forEach(email => {
        // Skip admin email
        if (email === 'admin@tulse.agency') return;
        
        const messages = getClientMessages(email);
        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
        const unread = messages.filter(msg => msg.sender === 'client' && !msg.read).length;
        
        // Try to get client name from messages or account data
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
    
    // Sort by most recent first
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
    const messageContainer = document.getElementById('messageContainer');
    if (!messageContainer) return;
    
    const accountData = JSON.parse(localStorage.getItem('tulse_account_data') || '{}');
    const userEmail = accountData.client_email || 'client@example.com';
    const messages = getClientMessages(userEmail);
    
    if (messages.length === 0) {
        messageContainer.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #94a3b8;">
                <i class="fas fa-comment-dots" style="font-size: 3rem; display: block; margin-bottom: 15px; color: #e5e7eb;"></i>
                <p>No messages yet. Start the conversation!</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    messages.forEach(msg => {
        const isClient = msg.sender === 'client';
        const align = isClient ? 'flex-end' : 'flex-start';
        const bgColor = isClient ? 'var(--accent-color)' : '#f1f5f9';
        const textColor = isClient ? '#000' : '#1a1a2e';
        const senderName = isClient ? 'You' : 'Tulse Team';
        const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        html += `
            <div style="display: flex; justify-content: ${align}; margin-bottom: 12px;">
                <div style="max-width: 80%; background: ${bgColor}; color: ${textColor}; padding: 12px 16px; border-radius: 16px; ${isClient ? 'border-bottom-right-radius: 4px;' : 'border-bottom-left-radius: 4px;'}">
                    <div style="font-size: 0.8rem; font-weight: 600; margin-bottom: 4px; color: ${isClient ? '#000' : '#64748b'}">
                        ${senderName}
                    </div>
                    <div style="word-wrap: break-word; font-size: 0.95rem;">${escapeHtml(msg.message)}</div>
                    <div style="font-size: 0.65rem; color: ${isClient ? '#555' : '#94a3b8'}; margin-top: 4px; text-align: ${isClient ? 'right' : 'left'}">
                        ${time}
                    </div>
                </div>
            </div>
        `;
    });
    
    messageContainer.innerHTML = html;
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

// ==========================
// UPDATE ADMIN CHAT DISPLAY
// ==========================

let currentAdminClient = null;

function updateAdminChatDisplay() {
    const messageContainer = document.getElementById('adminMessageContainer');
    if (!messageContainer) return;
    
    if (!currentAdminClient) {
        messageContainer.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #94a3b8;">
                <i class="fas fa-user-circle" style="font-size: 3rem; display: block; margin-bottom: 15px; color: #e5e7eb;"></i>
                <p>Select a client from the list to start chatting.</p>
            </div>
        `;
        return;
    }
    
    const messages = getClientMessages(currentAdminClient);
    
    if (messages.length === 0) {
        messageContainer.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #94a3b8;">
                <i class="fas fa-comment-dots" style="font-size: 3rem; display: block; margin-bottom: 15px; color: #e5e7eb;"></i>
                <p>No messages with this client yet.</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    messages.forEach(msg => {
        const isClient = msg.sender === 'client';
        const align = isClient ? 'flex-start' : 'flex-end';
        const bgColor = isClient ? '#f1f5f9' : 'var(--accent-color)';
        const textColor = isClient ? '#1a1a2e' : '#000';
        const senderName = isClient ? msg.senderName : 'You (Admin)';
        const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        html += `
            <div style="display: flex; justify-content: ${align}; margin-bottom: 12px;">
                <div style="max-width: 80%; background: ${bgColor}; color: ${textColor}; padding: 12px 16px; border-radius: 16px; ${isClient ? 'border-bottom-left-radius: 4px;' : 'border-bottom-right-radius: 4px;'}">
                    <div style="font-size: 0.8rem; font-weight: 600; margin-bottom: 4px; color: ${isClient ? '#64748b' : '#000'}">
                        ${senderName}
                        ${isClient && !msg.read ? ' 🔴' : ''}
                        ${isClient && msg.read ? ' ✅' : ''}
                    </div>
                    <div style="word-wrap: break-word; font-size: 0.95rem;">${escapeHtml(msg.message)}</div>
                    <div style="font-size: 0.65rem; color: ${isClient ? '#94a3b8' : '#555'}; margin-top: 4px; text-align: ${isClient ? 'left' : 'right'}">
                        ${time}
                    </div>
                </div>
            </div>
        `;
    });
    
    messageContainer.innerHTML = html;
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

// ==========================
// UPDATE CLIENT LIST (Admin)
// ==========================

function updateClientList() {
    const clientListContainer = document.getElementById('adminClientList');
    if (!clientListContainer) return;
    
    const clients = getAllClients();
    
    if (clients.length === 0) {
        clientListContainer.innerHTML = `
            <div style="text-align: center; padding: 30px 20px; color: #94a3b8;">
                <p>No clients yet. They'll appear here when they start chatting.</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    clients.forEach(client => {
        const isActive = currentAdminClient === client.email;
        const unreadBadge = client.unread > 0 ? `<span style="background: #ef4444; color: white; font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 50px; margin-left: auto;">${client.unread}</span>` : '';
        const lastMsg = client.lastMessage ? 
            `<div style="font-size: 0.8rem; color: #94a3b8; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px;">
                ${escapeHtml(client.lastMessage.message.substring(0, 40))}${client.lastMessage.message.length > 40 ? '...' : ''}
            </div>` : '';
        const time = client.lastMessage ? 
            `<div style="font-size: 0.65rem; color: #94a3b8;">${new Date(client.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>` : '';
        
        html += `
            <div onclick="selectClient('${client.email}')" 
                 style="display: flex; align-items: center; gap: 12px; padding: 12px 15px; border-radius: 10px; cursor: pointer; transition: all 0.3s ease; ${isActive ? 'background: var(--accent-color);' : 'background: #f8fafc;'} ${isActive ? 'color: #000;' : ''} margin-bottom: 4px; hover: background: #f1f5f9;">
                <div style="width: 40px; height: 40px; border-radius: 50%; background: ${isActive ? '#000' : 'var(--accent-color)'}; color: ${isActive ? 'var(--accent-color)' : '#000'}; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1rem; flex-shrink: 0;">
                    ${client.name.charAt(0).toUpperCase()}
                </div>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 600; font-size: 0.95rem; display: flex; align-items: center; gap: 8px;">
                        ${escapeHtml(client.name)}
                        ${client.unread > 0 ? `<span style="background: #ef4444; color: white; font-size: 0.6rem; font-weight: 700; padding: 1px 6px; border-radius: 50px; margin-left: auto;">${client.unread}</span>` : ''}
                    </div>
                    ${lastMsg}
                </div>
                <div style="font-size: 0.65rem; color: #94a3b8; white-space: nowrap;">
                    ${time}
                </div>
            </div>
        `;
    });
    
    clientListContainer.innerHTML = html;
}

// ==========================
// SELECT A CLIENT (Admin)
// ==========================

function selectClient(clientEmail) {
    currentAdminClient = clientEmail;
    
    // Mark messages as read for this client
    markClientMessagesAsRead(clientEmail);
    
    // Update displays
    updateClientList();
    updateAdminChatDisplay();
    updateAdminNotification();
    
    // Update admin reply area
    updateAdminReplyArea(clientEmail);
}

// ==========================
// UPDATE ADMIN REPLY AREA
// ==========================

function updateAdminReplyArea(clientEmail) {
    const replyArea = document.getElementById('adminReplyArea');
    if (!replyArea) return;
    
    if (!clientEmail) {
        replyArea.style.display = 'none';
        return;
    }
    
    const clients = getAllClients();
    const client = clients.find(c => c.email === clientEmail);
    const clientName = client ? client.name : 'Client';
    
    replyArea.style.display = 'block';
    replyArea.innerHTML = `
        <p style="font-weight: 600; margin-bottom: 8px;">🛡️ Replying to <strong>${escapeHtml(clientName)}</strong></p>
        <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 10px;">Your reply will be sent directly to this client.</p>
        <div style="display: flex; gap: 10px;">
            <input type="text" id="adminReplyInput" placeholder="Type your reply to ${escapeHtml(clientName)}..." style="flex: 1; padding: 12px 16px; border: 1px solid #d1d5db; border-radius: 10px; font-size: 0.95rem; outline: none; background: white; font-family: inherit;">
            <button id="adminReplyBtn" onclick="sendAdminReplyToClient('${clientEmail}')" style="padding: 12px 24px; border-radius: 10px; background: #000; color: white; font-weight: 700; border: none; cursor: pointer;">
                Send Reply
            </button>
        </div>
    `;
    
    // Re-bind enter key
    const input = document.getElementById('adminReplyInput');
    if (input) {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendAdminReplyToClient(clientEmail);
            }
        });
    }
}

// ==========================
// SEND ADMIN REPLY TO CLIENT
// ==========================

function sendAdminReplyToClient(clientEmail) {
    const input = document.getElementById('adminReplyInput');
    if (!input) return;
    
    const message = input.value.trim();
    if (!message) return;
    
    sendMessage(message, clientEmail);
    input.value = '';
    
    // Update displays
    updateAdminChatDisplay();
    updateClientList();
}

// ==========================
// UPDATE ADMIN NOTIFICATION
// ==========================

function updateAdminNotification() {
    const { counts, total } = getUnreadCounts();
    
    // Update badge on Messages tab
    const messageBadge = document.getElementById('messageBadge');
    if (messageBadge) {
        if (total > 0) {
            messageBadge.classList.remove('hidden');
            messageBadge.textContent = total;
        } else {
            messageBadge.classList.add('hidden');
        }
    }
    
    // Update badge on Admin tab
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
        // Admin view
        updateClientList();
        updateAdminChatDisplay();
        updateAdminNotification();
        
        // Auto-refresh every 3 seconds
        setInterval(() => {
            updateClientList();
            updateAdminChatDisplay();
            updateAdminNotification();
        }, 3000);
    } else {
        // Client view
        const sendBtn = document.getElementById('sendMessageBtn');
        const messageInput = document.getElementById('messageInput');
        
        if (sendBtn && messageInput) {
            sendBtn.addEventListener('click', function() {
                const message = messageInput.value.trim();
                if (message) {
                    sendMessage(message);
                    messageInput.value = '';
                }
            });
            
            messageInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    const message = this.value.trim();
                    if (message) {
                        sendMessage(message);
                        this.value = '';
                    }
                }
            });
        }
        
        updateClientMessageDisplay();
        
        // Auto-refresh every 3 seconds
        setInterval(updateClientMessageDisplay, 3000);
    }
}

// ==========================
// RUN ON LOAD
// ==========================

document.addEventListener('DOMContentLoaded', function() {
    // Wait for other scripts to load
    setTimeout(initChat, 200);
});