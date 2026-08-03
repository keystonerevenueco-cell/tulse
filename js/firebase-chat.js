// ==========================
// FIREBASE CHAT - SIMPLIFIED
// ==========================

let currentAdminClient = null;

// ==========================
// SEND MESSAGE
// ==========================

function sendFirebaseMessage(message, targetClientEmail) {
    if (!message || message.trim() === '') return;
    
    const isAdmin = localStorage.getItem('tulse_is_admin') === 'true';
    const accountData = JSON.parse(localStorage.getItem('tulse_account_data') || '{}');
    const userEmail = accountData.client_email || 'client@example.com';
    const userName = accountData.full_name || 'Client';
    
    let chatRoom;
    if (isAdmin) {
        if (!targetClientEmail) {
            console.error('Admin must specify a client email');
            return;
        }
        chatRoom = targetClientEmail;
    } else {
        chatRoom = userEmail;
    }
    
    const messageData = {
        id: Date.now(),
        sender: isAdmin ? 'admin' : 'client',
        senderName: isAdmin ? 'Tulse Team' : userName,
        senderEmail: isAdmin ? 'admin@tulse.agency' : userEmail,
        message: message.trim(),
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        read: false
    };
    
    db.collection('chats')
        .doc(chatRoom)
        .collection('messages')
        .add(messageData)
        .then(() => {
            console.log('✅ Message sent to:', chatRoom);
            refreshAll();
        })
        .catch((error) => {
            console.error('❌ Error sending message:', error);
        });
}

// ==========================
// REFRESH ALL
// ==========================

function refreshAll() {
    console.log('🔄 Refreshing all views...');
    if (localStorage.getItem('tulse_is_admin') === 'true') {
        forceClientList();
    } else {
        forceClientMessages();
    }
}

// ==========================
// FORCE CLIENT LIST (ADMIN)
// ==========================

function forceClientList() {
    console.log('📋 Force updating client list...');
    const container = document.getElementById('adminClientList');
    if (!container) {
        console.log('❌ adminClientList not found');
        return;
    }
    
    db.collection('chats').get().then((snapshot) => {
        console.log('📁 Found', snapshot.size, 'chat rooms');
        
        if (snapshot.size === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 30px 20px; color: #94a3b8;">
                    <p>No clients yet. Send a message from client first!</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        snapshot.forEach((doc) => {
            const email = doc.id;
            const name = email.split('@')[0];
            const isActive = currentAdminClient === email;
            
            html += `
                <div class="client-item ${isActive ? 'active' : ''}" 
                     onclick="selectClient('${email}')" 
                     style="padding: 12px 15px; margin-bottom: 4px; background: ${isActive ? 'var(--accent-color)' : '#f8fafc'}; border-radius: 10px; cursor: pointer; transition: all 0.3s ease;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 40px; height: 40px; border-radius: 50%; background: ${isActive ? '#000' : 'var(--accent-color)'}; color: ${isActive ? 'var(--accent-color)' : '#000'}; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1rem;">
                            ${name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div style="font-weight: 600;">${name}</div>
                            <div style="font-size: 0.8rem; color: #94a3b8;">${email}</div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        console.log('✅ Client list rendered with', snapshot.size, 'clients');
    });
}

// ==========================
// FORCE CLIENT MESSAGES
// ==========================

function forceClientMessages() {
    const container = document.getElementById('messageContainer');
    if (!container) return;
    
    const accountData = JSON.parse(localStorage.getItem('tulse_account_data') || '{}');
    const userEmail = accountData.client_email || 'client@example.com';
    
    db.collection('chats')
        .doc(userEmail)
        .collection('messages')
        .orderBy('timestamp', 'asc')
        .get()
        .then((snapshot) => {
            const messages = [];
            snapshot.forEach((doc) => {
                messages.push({ id: doc.id, ...doc.data() });
            });
            
            if (messages.length === 0) {
                container.innerHTML = `
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
                const className = isClient ? 'client' : 'admin';
                const senderName = isClient ? 'You' : 'Tulse Team';
                const time = msg.timestamp ? 
                    new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
                    '';
                
                html += `
                    <div class="message-bubble ${className}">
                        <div class="bubble">
                            <div class="sender">${senderName}</div>
                            <div class="text">${msg.message}</div>
                            <div class="time">${time}</div>
                        </div>
                    </div>
                `;
            });
            
            container.innerHTML = html;
            container.scrollTop = container.scrollHeight;
        });
}

// ==========================
// SELECT CLIENT
// ==========================

function selectClient(clientEmail) {
    console.log('🖱️ Selecting client:', clientEmail);
    currentAdminClient = clientEmail;
    forceClientList();
    
    // Load messages for this client
    const container = document.getElementById('adminMessageContainer');
    if (!container) return;
    
    db.collection('chats')
        .doc(clientEmail)
        .collection('messages')
        .orderBy('timestamp', 'asc')
        .get()
        .then((snapshot) => {
            const messages = [];
            snapshot.forEach((doc) => {
                messages.push({ id: doc.id, ...doc.data() });
            });
            
            if (messages.length === 0) {
                container.innerHTML = `
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
                const className = isClient ? 'client' : 'admin';
                const senderName = isClient ? msg.senderName : 'You (Admin)';
                const time = msg.timestamp ? 
                    new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
                    '';
                const status = isClient && !msg.read ? ' 🔴' : (isClient && msg.read ? ' ✅' : '');
                
                html += `
                    <div class="message-bubble ${className}">
                        <div class="bubble">
                            <div class="sender">${senderName}${status}</div>
                            <div class="text">${msg.message}</div>
                            <div class="time">${time}</div>
                        </div>
                    </div>
                `;
            });
            
            container.innerHTML = html;
            container.scrollTop = container.scrollHeight;
            
            // Show reply area
            document.getElementById('adminReplyArea').style.display = 'block';
            document.getElementById('adminReplyClientName').textContent = clientEmail.split('@')[0];
        });
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
    
    sendFirebaseMessage(message, currentAdminClient);
    input.value = '';
}

// ==========================
// SEND CLIENT MESSAGE
// ==========================

function sendClientMessage() {
    const input = document.getElementById('messageInput');
    if (!input) return;
    const message = input.value.trim();
    if (!message) return;
    
    sendFirebaseMessage(message);
    input.value = '';
}

// ==========================
// INIT
// ==========================

function initChat() {
    const isAdmin = localStorage.getItem('tulse_is_admin') === 'true';
    console.log('🚀 Init chat - isAdmin:', isAdmin);
    
    if (isAdmin) {
        document.getElementById('adminChatView').style.display = 'block';
        document.getElementById('clientChatView').style.display = 'none';
        forceClientList();
    } else {
        document.getElementById('adminChatView').style.display = 'none';
        document.getElementById('clientChatView').style.display = 'block';
        forceClientMessages();
    }
}

// Run on load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initChat, 500);
});

// Expose
window.sendAdminReply = sendAdminReply;
window.sendClientMessage = sendClientMessage;
window.selectClient = selectClient;
window.forceClientList = forceClientList;
window.forceClientMessages = forceClientMessages;
window.refreshAll = refreshAll;
window.currentAdminClient = currentAdminClient;