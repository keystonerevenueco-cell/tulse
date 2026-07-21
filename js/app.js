// ==========================
// TULSE WEBSITE APP
// ==========================



document.addEventListener("DOMContentLoaded", () => {



// ==========================
// AUTOMATIC FOOTER YEAR
// ==========================



const year = document.querySelector(".current-year");



if(year){


year.textContent = new Date().getFullYear();


}






// ==========================
// REMOVE EMPTY LINKS
// ==========================



const emptyLinks = document.querySelectorAll('a[href="#"]');



emptyLinks.forEach(link => {



link.addEventListener("click", (event)=>{


event.preventDefault();


});



});






// ==========================
// PAGE LOADED
// ==========================



document.body.classList.add("loaded");



});