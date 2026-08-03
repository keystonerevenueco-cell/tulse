// ==========================
// FIREBASE CHAT SYSTEM
// ==========================

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
            if (isAdmin) {
                setTimeout(updateAdminChatDisplay, 500);
                setTimeout(updateClientList, 500);
            } else {
                setTimeout(updateClientMessageDisplay, 500);
            }
        })
        .catch((error) => {
            console.error('❌ Error sending message:', error);
            alert('Failed to send message. Please try again.');
        });
}

// ==========================
// LISTEN FOR MESSAGES (Client)
// ==========================

let clientUnsubscribe = null;

function listenForClientMessages() {
    const accountData = JSON.parse(localStorage.getItem('tulse_account_data') || '{}');
    const userEmail = accountData.client_email || 'client@example.com';
    
    if (clientUnsubscribe) {
        clientUnsubscribe();
        clientUnsubscribe = null;
    }
    
    clientUnsubscribe = db.collection('chats')
        .doc(userEmail)
        .collection('messages')
        .orderBy('timestamp', 'asc')
        .onSnapshot((snapshot) => {
            const messages = [];
            snapshot.forEach((doc) => {
                messages.push({ id: doc.id, ...doc.data() });
            });
            updateClientMessageDisplay(messages);
        }, (error) => {
            console.error('Error listening to messages:', error);
        });
}

// ==========================
// UPDATE CLIENT MESSAGE DISPLAY
// ==========================

function updateClientMessageDisplay(messages) {
    const container = document.getElementById('messageContainer');
    if (!container) return;
    
    if (!messages) {
        const accountData = JSON.parse(localStorage.getItem('tulse_account_data') || '{}');
        const userEmail = accountData.client_email || 'client@example.com';
        
        db.collection('chats')
            .doc(userEmail)
            .collection('messages')
            .orderBy('timestamp', 'asc')
            .get()
            .then((snapshot) => {
                const msgs = [];
                snapshot.forEach((doc) => {
                    msgs.push({ id: doc.id, ...doc.data() });
                });
                renderClientMessages(container, msgs);
            })
            .catch(() => {
                renderClientMessages(container, []);
            });
        return;
    }
    
    renderClientMessages(container, messages);
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
// LISTEN FOR ADMIN MESSAGES
// ==========================

let adminUnsubscribe = null;
let currentAdminClient = null;

function listenForAdminMessages(clientEmail) {
    if (!clientEmail) return;
    
    currentAdminClient = clientEmail;
    
    if (adminUnsubscribe) {
        adminUnsubscribe();
        adminUnsubscribe = null;
    }
    
    adminUnsubscribe = db.collection('chats')
        .doc(clientEmail)
        .collection('messages')
        .orderBy('timestamp', 'asc')
        .onSnapshot((snapshot) => {
            const messages = [];
            snapshot.forEach((doc) => {
                messages.push({ id: doc.id, ...doc.data() });
            });
            renderAdminMessages(messages);
            
            const unread = messages.filter(msg => msg.sender === 'client' && !msg.read);
            if (unread.length > 0) {
                markMessagesAsRead(clientEmail);
            }
        }, (error) => {
            console.error('Error listening to admin messages:', error);
        });
}

function renderAdminMessages(messages) {
    const container = document.getElementById('adminMessageContainer');
    if (!container) return;
    
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
                    <div class="time">${time}</div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
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
            console.error('❌ Error marking messages as read:', error);
        });
}

// ==========================
// GET ALL CLIENTS (Admin)
// ==========================

function getAllFirebaseClients() {
    return new Promise((resolve) => {
        db.collection('chats')
            .get()
            .then((snapshot) => {
                const clients = [];
                snapshot.forEach((doc) => {
                    clients.push({ email: doc.id });
                });
                resolve(clients);
            })
            .catch(() => {
                resolve([]);
            });
    });
}

// ==========================
// GET UNREAD COUNT (Admin)
// ==========================

function getUnreadCountFirebase(clientEmail) {
    return new Promise((resolve) => {
        if (!clientEmail) {
            resolve(0);
            return;
        }
        
        db.collection('chats')
            .doc(clientEmail)
            .collection('messages')
            .where('read', '==', false)
            .where('sender', '==', 'client')
            .get()
            .then((snapshot) => {
                resolve(snapshot.size);
            })
            .catch(() => {
                resolve(0);
            });
    });
}

// ==========================
// GET TOTAL UNREAD COUNT
// ==========================

function getTotalUnreadCount() {
    return new Promise((resolve) => {
        db.collection('chats')
            .get()
            .then((snapshot) => {
                let total = 0;
                const promises = [];
                
                snapshot.forEach((doc) => {
                    promises.push(
                        db.collection('chats')
                            .doc(doc.id)
                            .collection('messages')
                            .where('read', '==', false)
                            .where('sender', '==', 'client')
                            .get()
                            .then((msgSnapshot) => {
                                total += msgSnapshot.size;
                            })
                    );
                });
                
                Promise.all(promises).then(() => {
                    resolve(total);
                });
            })
            .catch(() => {
                resolve(0);
            });
    });
}

// ==========================
// UPDATE ADMIN NOTIFICATION
// ==========================

function updateAdminNotification() {
    getTotalUnreadCount().then((total) => {
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
// UPDATE CLIENT LIST (Admin)
// ==========================

function updateClientList() {
    const container = document.getElementById('adminClientList');
    if (!container) return;
    
    getAllFirebaseClients().then((clients) => {
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
    currentAdminClient = clientEmail;
    
    const accountData = JSON.parse(localStorage.getItem('tulse_account_data') || '{}');
    const name = clientEmail.split('@')[0];
    const displayName = (clientEmail === accountData.client_email && accountData.full_name) ? accountData.full_name : name;
    
    document.getElementById('adminChatClientName').textContent = displayName;
    document.getElementById('adminReplyClientName').textContent = displayName;
    document.getElementById('adminReplyArea').style.display = 'block';
    
    markMessagesAsRead(clientEmail);
    listenForAdminMessages(clientEmail);
    updateClientList();
    updateAdminNotification();
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
// ESCAPE HTML
// ==========================

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==========================
// INIT FIREBASE CHAT
// ==========================

function initFirebaseChat() {
    const isAdmin = localStorage.getItem('tulse_is_admin') === 'true';
    const accountData = JSON.parse(localStorage.getItem('tulse_account_data') || '{}');
    
    if (isAdmin) {
        document.getElementById('adminChatView').style.display = 'block';
        document.getElementById('clientChatView').style.display = 'none';
        updateClientList();
        updateAdminNotification();
        setInterval(() => {
            updateClientList();
            updateAdminNotification();
        }, 10000);
    } else {
        document.getElementById('adminChatView').style.display = 'none';
        document.getElementById('clientChatView').style.display = 'block';
        if (accountData.client_email) {
            listenForClientMessages();
        }
    }
}

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initFirebaseChat, 500);
});