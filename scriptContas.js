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
		
		const today = new Date().toISOString().split('T')[0]; // Data atual no formato yyyy-mm-dd
		const currentMonth = today.split('-')[1]; // Mês atual
		const currentYear = today.split('-')[0]; // Ano atual

        // Percorrer as contas e preencher a lista
        for (let chave in contas) {
            const conta = contas[chave];

            // Buscar todas as entradas para esta conta
            let entradasSnapshot = await firebase.database().ref('/Entradas').orderByChild('chaveConta').equalTo(parseInt(conta.chave)).once('value');
            let entradas = entradasSnapshot.val();
            let totalEntradas = entradas ? Object.values(entradas)
                .filter(entrada => entrada.data <= today) // Filtrar por data
                .reduce((sum, entrada) => sum + entrada.valor, 0) : 0;

            // Buscar todas as saídas para esta conta
            let saidasSnapshot = await firebase.database().ref('/Saidas').orderByChild('chaveConta').equalTo(parseInt(conta.chave)).once('value');
            let saidas = saidasSnapshot.val();
            let totalSaidas = saidas ? Object.values(saidas)
				.filter(saida => saida.data <= today) // Filtrar por data
				.reduce((sum, saida) => sum + saida.valorParcela, 0) : 0;	

			let totalSaidasCreditoAtual = saidas ? Object.values(saidas)
				.filter(saida => saida.tipoSaida === 0 && saida.mesReferencia.split('-')[1] === currentMonth && saida.mesReferencia.split('-')[0] === currentYear)
				.reduce((sum, saida) => sum + saida.valorParcela, 0) : 0;

            // Calcular o valor atual manualmente
            let valorAtual = conta.valorInicial + totalEntradas - totalSaidas + totalSaidasCreditoAtual;
			valorAtual = valorAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            const listItem = document.createElement('li');

            const descricao = document.createElement('p'); 
            descricao.classList.add("listaTitulo");           
            descricao.innerHTML = `${conta.nomeBanco} - ${conta.usuarioConta}`;
            listItem.appendChild(descricao);

            const saldoTotal = document.createElement('p');
            saldoTotal.classList.add("subLista");
            saldoTotal.innerHTML = `Valor Atual: ${valorAtual}`;
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



