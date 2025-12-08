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

// Variáveis globais compartilhadas entre as telas
window.GLOBAL_PROJECOES = [];

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

function atualizarValorTotalContas(contas, saidas, entradas) {
	const hoje = new Date();
	
	console.log("atualizarValorTotalContas");

	for (const conta of contas) {
		const chaveConta = conta.chave;

		// Total de saídas até hoje (inclusive)
		let saidasConta = Object.values(saidas)
			.filter(s => s.chaveConta === chaveConta && s.mesReferencia && new Date(s.mesReferencia) <= hoje)
			.reduce((soma, s) => soma + s.valorParcela, 0);

		// Total de entradas até hoje (inclusive)
		let entradasConta = Object.values(entradas)
			.filter(e => e.chaveConta === chaveConta && e.mesReferencia && new Date(e.mesReferencia) <= hoje)
			.reduce((soma, e) => soma + e.valor, 0);

		// Crédito do mês atual (saídas do tipo 0 exatamente no mês atual)
		let creditoMesAtual = Object.values(saidas)
			.filter(s => s.chaveConta === chaveConta && s.tipoSaida === 0 && s.mesReferencia && datasIguaisMesAno(new Date(s.mesReferencia), hoje))
			.reduce((soma, s) => soma + s.valorParcela, 0);

		saidasConta -= creditoMesAtual;

		// valorAtual = valorInicial - saídas + entradas
		conta.valorAtual = (conta.valorInicial || 0) - saidasConta + entradasConta;
	}
}

// Função auxiliar para comparar mês/ano das datas
function datasIguaisMesAno(data1, data2) {
	return data1.getMonth() === data2.getMonth() && data1.getFullYear() === data2.getFullYear();
}