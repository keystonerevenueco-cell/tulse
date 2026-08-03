// ==========================
// FIREBASE MAIN EXPORT
// ==========================

// Export all Firebase services from one file
export * from './config.js';
export * from './auth.js';
export * from './db.js';
export * from './storage.js';
export * from './collections.js';
export * from './projects.js';

// Default export for convenience
import * as Firebase from './config.js';
import * as Auth from './auth.js';
import * as DB from './db.js';
import * as Storage from './storage.js';
import * as Collections from './collections.js';
import * as Projects from './projects.js';

export default {
    ...Firebase,
    ...Auth,
    ...DB,
    ...Storage,
    ...Collections,
    ...Projects
};