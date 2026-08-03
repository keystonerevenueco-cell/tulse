// ==========================
// FIRESTORE SECURITY RULES
// ==========================
// Copy these rules to Firebase Console > Firestore > Rules

/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return request.auth.uid in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isUser(uid) {
      return request.auth.uid == uid;
    }
    
    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }
    
    // USERS COLLECTION
    match /users/{userId} {
      allow read: if isAuthenticated() && (isUser(userId) || isAdmin());
      allow create: if isAuthenticated() && isUser(userId);
      allow update: if isAuthenticated() && (isUser(userId) || isAdmin());
      allow delete: if isAdmin();
    }
    
    // CHATS COLLECTION
    match /chats/{email} {
      allow read: if isAuthenticated() && (request.auth.token.email == email || isAdmin());
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && (request.auth.token.email == email || isAdmin());
      allow delete: if isAdmin();
      
      // Messages subcollection
      match /messages/{messageId} {
        allow read: if isAuthenticated() && (request.auth.token.email == email || isAdmin());
        allow create: if isAuthenticated();
        allow update: if isAuthenticated() && (request.auth.token.email == email || isAdmin());
        allow delete: if isAdmin();
      }
    }
    
    // PROJECTS COLLECTION
    match /projects/{projectId} {
      allow read: if isAuthenticated() && (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && (resource.data.userId == request.auth.uid || isAdmin());
      allow delete: if isAdmin();
    }
    
    // FILES COLLECTION
    match /files/{fileId} {
      allow read: if isAuthenticated() && (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && (resource.data.userId == request.auth.uid || isAdmin());
      allow delete: if isAuthenticated() && (resource.data.userId == request.auth.uid || isAdmin());
    }
    
    // ORDERS COLLECTION
    match /orders/{orderId} {
      allow read: if isAuthenticated() && (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if isAuthenticated();
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
    
    // LEADS COLLECTION
    match /leads/{leadId} {
      allow read: if isAdmin();
      allow create: if true; // Anyone can submit a lead
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
  }
}
*/