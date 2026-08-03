// Add this to js/chat.js (replace the existing adminReply and add new functions)

// ==========================
// ADMIN REPLY - UPDATED
// ==========================

function adminReply(message) {
    const messages = JSON.parse(localStorage.getItem('tulse_chat_messages') || '[]');
    const accountData = JSON.parse(localStorage.getItem('tulse_account_data') || '{}');
    const clientEmail = accountData.client_email || 'client@example.com';
    const clientName = accountData.full_name || 'Client';
    
    messages.push({
        id: Date.now(),
        sender: 'admin',
        senderName: 'Tulse Team',
        senderEmail: 'admin@tulse.agency',
        message: message,
        timestamp: new Date().toISOString(),
        read: true,
        clientEmail: clientEmail,
        clientName: clientName
    });
    
    localStorage.setItem('tulse_chat_messages', JSON.stringify(messages));
    updateMessageDisplay();
    
    // Update admin dashboard if admin is logged in
    if (typeof updateAdminDashboard === 'function') {
        updateAdminDashboard();
    }
}

// ==========================
// ADMIN REPLY HANDLER
// ==========================

function initAdminReply() {
    const adminReplyBtn = document.getElementById('adminReplyBtn');
    const adminReplyInput = document.getElementById('adminReplyInput');
    
    if (adminReplyBtn && adminReplyInput) {
        adminReplyBtn.addEventListener('click', function() {
            const message = adminReplyInput.value.trim();
            if (message) {
                adminReply(message);
                adminReplyInput.value = '';
            }
        });
        
        adminReplyInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const message = this.value.trim();
                if (message) {
                    adminReply(message);
                    this.value = '';
                }
            }
        });
    }
}

// ==========================
// UPDATE INIT CHAT
// ==========================

// Replace the existing initChat function or add this line:
document.addEventListener('DOMContentLoaded', function() {
    // ... existing init code
    initAdminReply();
});