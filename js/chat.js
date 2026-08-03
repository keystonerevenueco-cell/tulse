// ==========================
// CHAT SYSTEM
// ==========================

// ==========================
// SEND MESSAGE
// ==========================

function sendMessage(message) {
    const userEmail = localStorage.getItem('tulse_user_email') || 'client@example.com';
    const userName = JSON.parse(localStorage.getItem('tulse_account_data') || '{}').full_name || 'Client';
    
    const messages = JSON.parse(localStorage.getItem('tulse_chat_messages') || '[]');
    
    messages.push({
        id: Date.now(),
        sender: 'client',
        senderName: userName,
        senderEmail: userEmail,
        message: message,
        timestamp: new Date().toISOString(),
        read: false
    });
    
    localStorage.setItem('tulse_chat_messages', JSON.stringify(messages));
    updateMessageDisplay();
}

// ==========================
// GET MESSAGES
// ==========================

function getMessages() {
    return JSON.parse(localStorage.getItem('tulse_chat_messages') || '[]');
}

// ==========================
// MARK AS READ
// ==========================

function markAsRead(messageId) {
    const messages = JSON.parse(localStorage.getItem('tulse_chat_messages') || '[]');
    const updated = messages.map(msg => {
        if (msg.id === messageId) {
            msg.read = true;
        }
        return msg;
    });
    localStorage.setItem('tulse_chat_messages', JSON.stringify(updated));
    updateMessageDisplay();
}

// ==========================
// UPDATE MESSAGE DISPLAY
// ==========================

function updateMessageDisplay() {
    const messageContainer = document.getElementById('messageContainer');
    if (!messageContainer) return;
    
    const messages = getMessages();
    const isAdmin = localStorage.getItem('tulse_is_admin') === 'true';
    
    // Filter messages based on user role
    let displayMessages = messages;
    if (!isAdmin) {
        // Clients only see their own messages and admin replies
        const userEmail = localStorage.getItem('tulse_user_email') || 'client@example.com';
        displayMessages = messages.filter(msg => 
            msg.sender === 'client' && msg.senderEmail === userEmail || 
            msg.sender === 'admin'
        );
    }
    
    let html = '';
    displayMessages.forEach(msg => {
        const isClient = msg.sender === 'client';
        const align = isClient ? 'flex-end' : 'flex-start';
        const bgColor = isClient ? 'var(--accent-color)' : '#f1f5f9';
        const textColor = isClient ? '#000' : '#1a1a2e';
        
        html += `
            <div style="display: flex; justify-content: ${align}; margin-bottom: 12px;">
                <div style="max-width: 80%; background: ${bgColor}; color: ${textColor}; padding: 12px 16px; border-radius: 16px; ${isClient ? 'border-bottom-right-radius: 4px;' : 'border-bottom-left-radius: 4px;'}">
                    <div style="font-size: 0.8rem; font-weight: 600; margin-bottom: 4px; color: ${isClient ? '#000' : '#64748b'}">
                        ${isClient ? 'You' : 'Tulse Team'}
                    </div>
                    <div style="word-wrap: break-word;">${msg.message}</div>
                    <div style="font-size: 0.65rem; color: ${isClient ? '#555' : '#94a3b8'}; margin-top: 4px; text-align: ${isClient ? 'right' : 'left'}">
                        ${new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                </div>
            </div>
        `;
    });
    
    messageContainer.innerHTML = html;
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

// ==========================
// CHECK FOR UNREAD MESSAGES (Admin)
// ==========================

function getUnreadCount() {
    const messages = getMessages();
    return messages.filter(msg => !msg.read && msg.sender === 'client').length;
}

// ==========================
// ADMIN REPLY
// ==========================

function adminReply(message) {
    const messages = JSON.parse(localStorage.getItem('tulse_chat_messages') || '[]');
    
    messages.push({
        id: Date.now(),
        sender: 'admin',
        senderName: 'Tulse Team',
        senderEmail: 'admin@tulse.agency',
        message: message,
        timestamp: new Date().toISOString(),
        read: true
    });
    
    localStorage.setItem('tulse_chat_messages', JSON.stringify(messages));
    updateMessageDisplay();
}

// ==========================
// INIT CHAT
// ==========================

function initChat() {
    const messageContainer = document.getElementById('messageContainer');
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
    
    // Update message display every 5 seconds (polling)
    setInterval(() => {
        updateMessageDisplay();
        updateAdminNotification();
    }, 5000);
    
    updateMessageDisplay();
}

// ==========================
// UPDATE ADMIN NOTIFICATION
// ==========================

function updateAdminNotification() {
    const unreadCount = getUnreadCount();
    const adminBadge = document.getElementById('adminBadge');
    const adminTab = document.getElementById('adminTab');
    
    if (adminBadge) {
        if (unreadCount > 0) {
            adminBadge.style.display = 'inline-block';
            adminBadge.textContent = unreadCount;
        } else {
            adminBadge.style.display = 'none';
        }
    }
    
    if (adminTab) {
        const isAdmin = localStorage.getItem('tulse_is_admin') === 'true';
        adminTab.style.display = isAdmin ? 'block' : 'none';
    }
}

// Run when page loads
document.addEventListener('DOMContentLoaded', function() {
    initChat();
    updateAdminNotification();
});