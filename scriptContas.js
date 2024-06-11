document.addEventListener('DOMContentLoaded', () => {
    Carrossel();
    showAccounts(); // Mostrar contas ao carregar a página
});

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