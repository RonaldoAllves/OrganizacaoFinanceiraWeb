// Inicializa o Firebase
var firebaseConfig = {
    apiKey: "AIzaSyCWiM5XNYiIzbPBUFrF-xYZDaWvSwDLYqM",
    authDomain: "organizacaofinanceira-9160c.firebaseapp.com",
    databaseURL: "https://organizacaofinanceira-9160c-default-rtdb.firebaseio.com",
    projectId: "organizacaofinanceira-9160c",
    storageBucket: "organizacaofinanceira-9160c.appspot.com",
    messagingSenderId: "663949527873",
    appId: "1:663949527873:web:3e08a6d287d37fc46f2fc0",
    measurementId: "G-F3XLECQGNR"
};

firebase.initializeApp(firebaseConfig);

function Carrossel(){
	const carousel = document.querySelector('.carousel');
    const carouselContainer = document.querySelector('.carousel-container');
    let isDragging = false;
    let startPos = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let animationID;
	
	let widthPage = parseInt(window.innerWidth, 10);		
	let w = 0
	
	if (widthPage < carousel.scrollWidth) {
		w = (widthPage - 430) * -0.454545 + 210
	}	

    // Calcular a largura total do carrossel e a largura visível do contêiner
    const maxTranslate = -(carousel.scrollWidth - carouselContainer.clientWidth);

    carousel.addEventListener('touchstart', touchStart);
    carousel.addEventListener('touchend', touchEnd);
    carousel.addEventListener('touchmove', touchMove);

    function touchStart(event) {
        isDragging = true;
        startPos = getTouchPosition(event);
        animationID = requestAnimationFrame(animation);
    }

    function touchEnd() {
        isDragging = false;
        cancelAnimationFrame(animationID);
        prevTranslate = currentTranslate;
    }

    function touchMove(event) {
        if (isDragging) {
            const currentPosition = getTouchPosition(event);
            currentTranslate = prevTranslate + currentPosition - startPos;
            // Limitar o quanto pode rolar
            currentTranslate = Math.max(currentTranslate, maxTranslate);
            currentTranslate = Math.min(currentTranslate, w);
        }
    }

    function getTouchPosition(event) {
        return event.touches[0].clientX;
    }

    function animation() {
        carousel.style.transform = `translateX(${currentTranslate}px)`;
        if (isDragging) requestAnimationFrame(animation);
    }

    // Posicionar o carrossel no início
    carousel.style.transform = `translateX(${w}px)`;
    currentTranslate = w;
    prevTranslate = w;
}

function onResize() {
    Carrossel();
}

// Adiciona o evento resize ao window
window.addEventListener('resize', onResize);