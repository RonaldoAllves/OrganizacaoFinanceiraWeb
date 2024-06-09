document.addEventListener('DOMContentLoaded', () => {
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
		w = (widthPage - 430) * -0.454545 + 100
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
            currentTranslate = Math.min(currentTranslate, 100);
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
    carousel.style.transform = `translateX(${w}px)`;;
    currentTranslate = w;
    prevTranslate = w;
	
	showAccounts()

});

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

// Função para mostrar as contas
async function showAccounts() {
    const accountsList = document.getElementById('accounts');
    accountsList.innerHTML = ''; // Limpar a lista atual

    try {
        // Buscar a lista de contas do Firebase
        let contasSnapshot = await firebase.database().ref('/Contas').once('value');
        let contas = contasSnapshot.val();

        // Verificar se há contas disponíveis
        if (!contas) {
            const emptyMessage = document.createElement('p');
            emptyMessage.innerHTML = 'Nenhuma conta disponível.';
            accountsList.appendChild(emptyMessage);
            return;
        }

        // Percorrer as contas e preencher a lista
        for (let chave in contas) {
            const conta = contas[chave];
            const listItem = document.createElement('li');

            const descricao = document.createElement('p'); 
            descricao.classList.add("listaTitulo");           
            descricao.innerHTML = `${conta.nomeBanco} - ${conta.usuarioConta}`;
            listItem.appendChild(descricao);

            const saldoTotal = document.createElement('p');
            saldoTotal.classList.add("subLista");
            saldoTotal.innerHTML = `Valor Atual: ${conta.valorAtual}`;
            listItem.appendChild(saldoTotal);

            accountsList.appendChild(listItem);
        }
    } catch (error) {
        console.error("Erro ao buscar contas:", error);
        const errorMessage = document.createElement('p');
        errorMessage.innerHTML = 'Erro ao carregar as contas.';
        accountsList.appendChild(errorMessage);
    }
}


