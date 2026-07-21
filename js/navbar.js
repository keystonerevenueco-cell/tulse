// ==========================
// MOBILE NAVIGATION
// ==========================


const hamburger = document.querySelector(".hamburger");

const navbar = document.querySelector(".navbar");

const navLinks = document.querySelector(".nav-links");



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