// ==========================
// NUMBER COUNTERS
// ==========================


const counters = document.querySelectorAll(".counter");



const startCounter = (counter) => {


const target = Number(counter.getAttribute("data-target"));


let count = 0;


const duration = 1500;

const increment = target / (duration / 20);




const updateCounter = () => {



count += increment;



if (count < target) {


counter.innerText = Math.ceil(count) + "%";


setTimeout(updateCounter, 20);



} else {



counter.innerText = target + "%";



}



};



updateCounter();



};








const counterObserver = new IntersectionObserver((entries) => {



entries.forEach(entry => {



if(entry.isIntersecting){



startCounter(entry.target);



counterObserver.unobserve(entry.target);



}



});



}, {

threshold:0.5

});








counters.forEach(counter => {


counterObserver.observe(counter);



});