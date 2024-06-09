document.addEventListener('DOMContentLoaded', () => {
    const carousel = document.querySelector('.carousel');
    const carouselContainer = document.querySelector('.carousel-container');
    let isDragging = false;
    let startPos = 0;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let animationID;


	console.log(window.innerWidth)
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
    carousel.style.transform = 'translateX(100px)';
    currentTranslate = 100;
    prevTranslate = 100;

});

function showAccounts() {
    // Esconde o formulário de transação
    document.getElementById('transactionForm').style.display = 'none';
    // Mostra a lista de contas
    document.getElementById('accountsList').style.display = 'block';
    
    // Carregar a lista de contas (apenas um exemplo)
    const accounts = [
        { title: "Conta 1", subtitle: "Detalhe 1" },
        { title: "Conta 2", subtitle: "Detalhe 2" },
        { title: "Conta 2", subtitle: "Detalhe 3" },
        { title: "Conta 2", subtitle: "Detalhe 3" },
        { title: "Conta 2", subtitle: "Detalhe 3" },
        { title: "Conta 2", subtitle: "Detalhe 3" },
        { title: "Conta 2", subtitle: "Detalhe 3" },
        { title: "Conta 2", subtitle: "Detalhe 4" },
        { title: "Conta 2", subtitle: "Detalhe 5" },
        { title: "Conta 3", subtitle: "Detalhe 6" }
    ];
    
    const accountsList = document.getElementById('accounts');
    accountsList.innerHTML = ''; // Limpar a lista atual

    accounts.forEach(account => {
        const listItem = document.createElement('li');
		
		const descricao = document.createElement('p'); 
        descricao.classList.add("listaTitulo");           
        descricao.innerHTML = account.title;
        listItem.appendChild(descricao);

        const saldoTotal = document.createElement('p');
        saldoTotal.classList.add("subLista");
        saldoTotal.innerHTML = account.subtitle;
        listItem.appendChild(saldoTotal);
		
        accountsList.appendChild(listItem);
    });
}

