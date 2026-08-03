// ==========================
// SCROLL EFFECTS
// ==========================

// Add shadow to navbar when scrolling
const header = document.querySelector(".header");

window.addEventListener("scroll", () => {
    if (!header) return;
    if (window.scrollY > 50) {
        header.style.background = "rgba(7,17,31,0.92)";
        header.style.boxShadow = "0 10px 30px rgba(0,0,0,0.15)";
    } else {
        header.style.background = "rgba(7,17,31,0.65)";
        header.style.boxShadow = "none";
    }
});

// Smooth scrolling for anchor links
document.addEventListener('DOMContentLoaded', function() {
    const scrollLinks = document.querySelectorAll('a[href^="#"]');
    
    scrollLinks.forEach(link => {
        link.addEventListener("click", function(e) {
            const href = this.getAttribute("href");
            
            // Skip if href is "#" or empty or invalid
            if (!href || href === "#" || href === "" || href === "#!" || href === "#/") {
                e.preventDefault();
                return;
            }
            
            // Try to find the target element
            let target = null;
            try {
                target = document.querySelector(href);
            } catch (error) {
                // Invalid selector - skip it
                return;
            }
            
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: "smooth"
                });
            }
        });
    });
});