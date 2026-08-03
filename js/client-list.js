// ==========================
// CLIENT LIST - FIREBASE
// ==========================

// ==========================
// GET ALL CLIENTS FROM FIREBASE
// ==========================

function getAllClientsFromFirebase() {
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
            .catch((error) => {
                console.error('Error getting clients:', error);
                resolve([]);
            });
    });
}

// ==========================
// GET UNREAD COUNT FOR CLIENT
// ==========================

function getUnreadCountForClient(clientEmail) {
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

function getTotalUnreadCountAll() {
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
// GET CLIENT NAME
// ==========================

function getClientName(email) {
    const accountData = JSON.parse(localStorage.getItem('tulse_account_data') || '{}');
    if (email === accountData.client_email && accountData.full_name) {
        return accountData.full_name;
    }
    return email.split('@')[0];
}

console.log('✅ client-list.js loaded');