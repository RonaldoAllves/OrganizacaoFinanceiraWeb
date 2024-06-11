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
        w = (widthPage - 430) * -0.454545 + 100;
    }    
    
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

    carousel.style.transform = `translateX(${w}px)`;;
    currentTranslate = w;
    prevTranslate = w;

    showAccounts(); // Mostrar contas ao carregar a página

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

let contaSelecionada = null

async function showAccounts() {
    const accountsList = document.getElementById('accounts');
    accountsList.innerHTML = ''; 

    try {
        let contasSnapshot = await firebase.database().ref('/Contas').once('value');
        let contas = contasSnapshot.val();

        if (!contas) {
            const emptyMessage = document.createElement('p');
            emptyMessage.innerHTML = 'Nenhuma conta disponível.';
            accountsList.appendChild(emptyMessage);
            return;
        }
        
        const today = new Date();
        const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
        const currentYear = today.getFullYear();

        for (let chave in contas) {
            const conta = contas[chave];

            let entradasSnapshot = await firebase.database().ref('/Entradas').orderByChild('chaveConta').equalTo(parseInt(conta.chave)).once('value');
            let entradas = entradasSnapshot.val();
            let totalEntradas = entradas ? Object.values(entradas)
                .filter(entrada => new Date(entrada.data) <= today)
                .reduce((sum, entrada) => sum + entrada.valor, 0) : 0;

            let saidasSnapshot = await firebase.database().ref('/Saidas').orderByChild('chaveConta').equalTo(parseInt(conta.chave)).once('value');
            let saidas = saidasSnapshot.val();
            let totalSaidas = saidas ? Object.values(saidas)
                .filter(saida => new Date(saida.data) <= today)
                .reduce((sum, saida) => sum + saida.valorParcela, 0) : 0;    

            let totalSaidasCreditoAtual = saidas ? Object.values(saidas)
                .filter(saida => saida.tipoSaida === 0 && saida.mesReferencia.split('-')[1] === currentMonth && saida.mesReferencia.split('-')[0] === String(currentYear))
                .reduce((sum, saida) => sum + saida.valorParcela, 0) : 0;

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

            listItem.addEventListener('click', () => {
				contaSelecionada = conta;
				showAccountDetails(conta.chave);
			});

            accountsList.appendChild(listItem);
        }

        const dateInput = document.getElementById('monthPicker');
        const todayFormatted = `${currentYear}-${currentMonth}`;
        dateInput.value = todayFormatted;
        dateInput.addEventListener('change', () => {
            showAccountDetails();
		});

    } catch (error) {
        console.error("Erro ao buscar contas:", error);
        const errorMessage = document.createElement('p');
        errorMessage.innerHTML = 'Erro ao carregar as contas.';
        accountsList.appendChild(errorMessage);
    }
}

async function showAccountDetails() {
	if (!contaSelecionada) return;
	const chaveConta = contaSelecionada.chave;
    const dateInput = document.querySelector('input[type="month"]').value;
    const [year, month] = dateInput.split('-');

    let entradasSnapshot = await firebase.database().ref('/Entradas').orderByChild('chaveConta').equalTo(parseInt(chaveConta)).once('value');
    let entradas = entradasSnapshot.val();
    let totalEntradas = entradas ? Object.values(entradas)
        .filter(entrada => entrada.mesReferencia.startsWith(`${year}-${month}`))
        .reduce((sum, entrada) => sum + entrada.valor, 0) : 0;

    let saidasSnapshot = await firebase.database().ref('/Saidas').orderByChild('chaveConta').equalTo(parseInt(chaveConta)).once('value');
    let saidas = saidasSnapshot.val();
    let totalSaidasCredito = saidas ? Object.values(saidas)
        .filter(saida => saida.tipoSaida === 0 && saida.mesReferencia.startsWith(`${year}-${month}`))
        .reduce((sum, saida) => sum + saida.valorParcela, 0) : 0;
    
    let totalSaidasDinheiro = saidas ? Object.values(saidas)
        .filter(saida => saida.tipoSaida === 1 && saida.mesReferencia.startsWith(`${year}-${month}`))
        .reduce((sum, saida) => sum + saida.valorParcela, 0) : 0;

    const data = {
        labels: ['Crédito', 'Dinheiro', 'Entradas'],
        datasets: [{
            data: [totalSaidasCredito, totalSaidasDinheiro, totalEntradas],
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
            hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
        }]
    };

    const ctx = document.getElementById('detailsChart').getContext('2d');
    if (window.detailsChart instanceof Chart) {
		window.detailsChart.destroy();
	}
    window.detailsChart = new Chart(ctx, {
        type: 'pie',
        data: data,
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: `${contaSelecionada.nomeBanco} - ${contaSelecionada.usuarioConta}`
                }
            }
        }
    });
}