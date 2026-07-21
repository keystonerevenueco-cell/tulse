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


const scrollLinks = document.querySelectorAll('a[href^="#"]');



scrollLinks.forEach(link => {



link.addEventListener("click", function(e) {



const target = document.querySelector(this.getAttribute("href"));



if (target) {



e.preventDefault();



target.scrollIntoView({

behavior: "smooth"

});



}



});



});