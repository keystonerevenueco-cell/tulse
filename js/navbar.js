// ==========================
// MOBILE NAVIGATION
// ==========================

const hamburger = document.querySelector(".hamburger");
const navbar = document.querySelector(".navbar");

if (hamburger) {
    hamburger.addEventListener("click", () => {
        navbar.classList.toggle("mobile-active");
    });
}

// Close menu when clicking a link
const links = document.querySelectorAll(".nav-links a");
links.forEach(link => {
    link.addEventListener("click", () => {
        navbar.classList.remove("mobile-active");
    });
});

// ==========================
// BUYER-ONLY NAVBAR
// ==========================

document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelector('.nav-links');
    const isLoggedIn = localStorage.getItem('tulse_logged_in') === 'true';
    const accountData = JSON.parse(localStorage.getItem('tulse_account_data') || '{}');
    
    // Check if user is a paying client
    const isBuyer = isLoggedIn && accountData.client_email;
    
    // Get all existing nav items
    const existingLinks = navLinks.querySelectorAll('li');
    let dashboardLink = null;
    
    // Check if dashboard link already exists
    existingLinks.forEach(li => {
        if (li.querySelector('a[href="client-dashboard.html"]')) {
            dashboardLink = li;
        }
    });
    
    // If user is a buyer and dashboard link doesn't exist, add it
    if (isBuyer && !dashboardLink) {
        const li = document.createElement('li');
        li.innerHTML = '<a href="client-dashboard.html">Dashboard</a>';
        // Insert before the last item (or append)
        navLinks.appendChild(li);
    }
    
    // If user is NOT a buyer and dashboard link exists, remove it
    if (!isBuyer && dashboardLink) {
        dashboardLink.remove();
    }
});