// ==========================
// SCROLL REVEAL ANIMATIONS
// ==========================



const revealElements = document.querySelectorAll(
".service-box, .industry-card, .portfolio-card, .value-card, .stat-card, .process-card, .info-card"
);





const revealOnScroll = () => {



revealElements.forEach(element => {



const elementTop = element.getBoundingClientRect().top;


const windowHeight = window.innerHeight;



if(elementTop < windowHeight - 100){



element.classList.add("active");



}



});



};






window.addEventListener(
"scroll",
revealOnScroll
);






window.addEventListener(
"load",
revealOnScroll
);