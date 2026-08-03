// ==========================
// CHAT SYSTEM - COMPLETE REWRITE
// ==========================

// ==========================
// SEND MESSAGE (Client or Admin)
// ==========================

function sendMessage(message) {
    if (!message || message.trim() === '') return;
    
    const accountData = JSON.parse(localStorage.getItem('tulse_account_data') || '{}');
    const isAdmin = localStorage.getItem('tulse_is_admin') === 'true';
    
    // Get existing messages
    let messages = JSON.parse(localStorage.getItem('tulse_chat_messages') || '[]');
    
    // Create new message
    const newMessage = {
        id: Date.now(),
        sender: isAdmin ? 'admin' : 'client',
        senderName: isAdmin ? 'Tulse Team' : (accountData.full_name || 'Client'),
        senderEmail: isAdmin ? 'admin@tulse.agency' : (accountData.client_email || 'client@example.com'),
        message: message.trim(),
        timestamp: new Date().toISOString(),
        read: isAdmin ? true : false // If admin sends, it's already read
    };
    
    // Add to messages
    messages.push(newMessage);
    localStorage.setItem('tulse_chat_messages', JSON.stringify(messages));
    
    // Update display
    updateMessageDisplay();
    updateAdminNotification();
    
    return newMessage;
}

// ==========================
// GET ALL MESSAGES
// ==========================

function getMessages() {
    return JSON.parse(localStorage.getItem('tulse_chat_messages') || '[]');
}

// ==========================
// GET UNREAD COUNT (for Admin)
// ==========================

function getUnreadCount() {
    const messages = getMessages();
    return messages.filter(msg => !msg.read && msg.sender === 'client').length;
}

// ==========================
// MARK MESSAGE AS READ
// ==========================

function markMessageAsRead(messageId) {
    const messages = getMessages();
    const updated = messages.map(msg => {
        if (msg.id === messageId) {
            msg.read = true;
        }
        return msg;
    });
    localStorage.setItem('tulse_chat_messages', JSON.stringify(updated));
    updateMessageDisplay();
    updateAdminNotification();
}

// ==========================
// MARK ALL AS READ (Admin)
// ==========================

function markAllMessagesAsRead() {
    const messages = getMessages();
    const updated = messages.map(msg => {
        if (msg.sender === 'client') {
            msg.read = true;
        }
        return msg;
    });
    localStorage.setItem('tulse_chat_messages', JSON.stringify(updated));
    updateMessageDisplay();
    updateAdminNotification();
}

// ==========================
// UPDATE MESSAGE DISPLAY
// ==========================

function updateMessageDisplay() {
    const messageContainer = document.getElementById('messageContainer');
    if (!messageContainer) return;
    
    const messages = getMessages();
    const isAdmin = localStorage.getItem('tulse_is_admin') === 'true';
    const accountData = JSON.parse(localStorage.getItem('tulse_account_data') || '{}');
    const userEmail = accountData.client_email || 'client@example.com';
    
    // Filter messages for current user
    let displayMessages = messages;
    if (!isAdmin) {
        // Client sees: their own messages + admin replies
        displayMessages = messages.filter(msg => 
            (msg.sender === 'client' && msg.senderEmail === userEmail) ||
            msg.sender === 'admin'
        );
    }
    // Admin sees: all messages
    
    if (displayMessages.length === 0) {
        messageContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-comment-dots"></i>
                <p>No messages yet. Start the conversation!</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    displayMessages.forEach(msg => {
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
                        ${isAdmin && !msg.read && msg.sender === 'client' ? ' 🔴' : ''}
                        ${isAdmin && msg.read && msg.sender === 'client' ? ' ✅' : ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    messageContainer.innerHTML = html;
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

// ==========================
// ESCAPE HTML (prevent XSS)
// ==========================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==========================
// UPDATE ADMIN NOTIFICATION
// ==========================

function updateAdminNotification() {
    const unreadCount = getUnreadCount();
    
    // Update badge on Messages tab
    const messageBadge = document.getElementById('messageBadge');
    if (messageBadge) {
        if (unreadCount > 0) {
            messageBadge.classList.remove('hidden');
            messageBadge.textContent = unreadCount;
        } else {
            messageBadge.classList.add('hidden');
        }
    }
    
    // Update badge on Admin tab
    const adminBadge = document.getElementById('adminBadgeNotification');
    if (adminBadge) {
        if (unreadCount > 0) {
            adminBadge.classList.remove('hidden');
            adminBadge.textContent = unreadCount;
        } else {
            adminBadge.classList.add('hidden');
        }
    }
    
    // Update admin dashboard if it exists
    if (typeof updateAdminDashboard === 'function') {
        updateAdminDashboard();
    }
}

// ==========================
// ADMIN REPLY
// ==========================

function sendAdminReply(message) {
    if (!message || message.trim() === '') return;
    
    const messages = getMessages();
    
    const newMessage = {
        id: Date.now(),
        sender: 'admin',
        senderName: 'Tulse Team',
        senderEmail: 'admin@tulse.agency',
        message: message.trim(),
        timestamp: new Date().toISOString(),
        read: true
    };
    
    messages.push(newMessage);
    localStorage.setItem('tulse_chat_messages', JSON.stringify(messages));
    
    updateMessageDisplay();
    updateAdminNotification();
    
    if (typeof updateAdminDashboard === 'function') {
        updateAdminDashboard();
    }
}

// ==========================
// INIT CHAT
// ==========================

function initChat() {
    const messageContainer = document.getElementById('messageContainer');
    const sendBtn = document.getElementById('sendMessageBtn');
    const messageInput = document.getElementById('messageInput');
    
    // Send button
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
    
    // Admin reply (if on admin side)
    const adminReplyBtn = document.getElementById('adminReplyBtn');
    const adminReplyInput = document.getElementById('adminReplyInput');
    
    if (adminReplyBtn && adminReplyInput) {
        adminReplyBtn.addEventListener('click', function() {
            const message = adminReplyInput.value.trim();
            if (message) {
                sendAdminReply(message);
                adminReplyInput.value = '';
                // Also send to chat display
                updateMessageDisplay();
            }
        });
        
        adminReplyInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const message = this.value.trim();
                if (message) {
                    sendAdminReply(message);
                    this.value = '';
                    updateMessageDisplay();
                }
            }
        });
    }
    
    // Initial display
    updateMessageDisplay();
    updateAdminNotification();
    
    // Auto-refresh every 3 seconds
    setInterval(() => {
        updateMessageDisplay();
        updateAdminNotification();
    }, 3000);
}

// ==========================
// CLEAR ALL MESSAGES (for testing)
// ==========================

function clearAllMessages() {
    if (confirm('Clear all chat messages?')) {
        localStorage.removeItem('tulse_chat_messages');
        updateMessageDisplay();
        updateAdminNotification();
        if (typeof updateAdminDashboard === 'function') {
            updateAdminDashboard();
        }
    }
}

// ==========================
// RUN ON LOAD
// ==========================

document.addEventListener('DOMContentLoaded', function() {
    // Wait a moment for other scripts to load
    setTimeout(initChat, 100);
});