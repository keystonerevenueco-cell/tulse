// ==========================
// ADMIN ACCESS
// ==========================

// ==========================
// CHECK ADMIN STATUS
// ==========================

function isAdmin() {
    return localStorage.getItem('tulse_is_admin') === 'true';
}

// ==========================
// LOGIN AS ADMIN
// ==========================

function loginAsAdmin(password) {
    // Simple admin password - you can change this
    const ADMIN_PASSWORD = 'tulseadmin2026';
    
    if (password === ADMIN_PASSWORD) {
        localStorage.setItem('tulse_is_admin', 'true');
        localStorage.setItem('tulse_logged_in', 'true');
        localStorage.setItem('tulse_user_email', 'admin@tulse.agency');
        window.location.href = 'client-dashboard.html';
        return true;
    }
    return false;
}

// ==========================
// ADMIN LOGOUT
// ==========================

function adminLogout() {
    localStorage.removeItem('tulse_is_admin');
    localStorage.removeItem('tulse_logged_in');
    window.location.href = 'index.html';
}

// ==========================
// CHECK ADMIN ON LOAD
// ==========================

document.addEventListener('DOMContentLoaded', function() {
    // If on dashboard and is admin, show admin elements
    if (window.location.pathname.includes('client-dashboard.html')) {
        const isAdminUser = isAdmin();
        
        // Show/hide admin elements
        const adminElements = document.querySelectorAll('.admin-only');
        adminElements.forEach(el => {
            el.style.display = isAdminUser ? 'block' : 'none';
        });
    }
});