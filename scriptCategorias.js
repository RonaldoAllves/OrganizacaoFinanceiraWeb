document.addEventListener('DOMContentLoaded', () => {
	// Definir o valor inicial do monthPicker com o mês atual
    const monthPicker = document.getElementById('monthPicker');
    const today = new Date();
    const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
    const currentYear = today.getFullYear();
    monthPicker.value = `${currentYear}-${currentMonth}`;	
	
	Carrossel();
    showCategories(); // Mostrar categorias ao carregar a página

    // Adicionar evento de mudança no seletor de mês
    document.getElementById('monthPicker').addEventListener('change', showCategories);

    document.addEventListener('click', function(event) {
        const item = event.target.closest('.item');
        if (item) {
            const details = item.querySelector('.item-details');
            if (details.style.display === 'block') {
                details.style.display = 'none';
            } else {
                details.style.display = 'block';
            }
        }
    });
});

async function showCategories() {
    const categoriesList = document.getElementById('categories');
    categoriesList.innerHTML = '';

    // Obter o mês selecionado
    const dateInput = document.getElementById('monthPicker').value;
    const [selectedYear, selectedMonth] = dateInput ? dateInput.split('-') : [null, null];

    try {
        let categoriesSnapshot = await firebase.database().ref('/Categorias').once('value');
        let categories = categoriesSnapshot.val();

        if (!categories) {
            const emptyMessage = document.createElement('p');
            emptyMessage.innerHTML = 'Nenhuma categoria disponível.';
            categoriesList.appendChild(emptyMessage);
            return;
        }
		
		const today = new Date();
		const currentYear = today.getFullYear();
		const currentMonth = today.getMonth() + 1; // Note que getMonth() retorna de 0 a 11

        for (let chave in categories) {
            const category = categories[chave];

            const listItem = document.createElement('li');
            listItem.classList.add('item');

            const descricao = document.createElement('div');
            descricao.classList.add('item-header');
            descricao.innerHTML = category.descricao;
            listItem.appendChild(descricao);

            const detailsDiv = document.createElement('div');
            detailsDiv.classList.add('item-details');
            detailsDiv.style.display = 'none';

            let verbaOriginal = 0;			
            let verbaAdicional = 0;
            let saldoMes = 0;
            let saldoTotalCalc = 0;
            let totalSaidasMes = 0;
			let totalSaidas = 0;
			
			let verbaTotal = 0;

            let mesesSnapshot = await firebase.database().ref('/Meses').orderByChild('chaveCategoria').equalTo(category.chave).once('value');
            let meses = mesesSnapshot.val();

            if (meses) {
				
				let saidasSnapshot = await firebase.database().ref('/Saidas').orderByChild('chaveCategoria').equalTo(category.chave).once('value');
                let saidas = saidasSnapshot.val();
				
                for (let chaveMes in meses) {
                    const mes = meses[chaveMes];
                    const [mesAno, mesMes] = mes.mes.split('-');
					const ano = parseInt(mesAno);
					const mesNumero = parseInt(mesMes);

					// Comparar ano e mês separadamente
					if (ano < currentYear || (ano === currentYear && mesNumero <= currentMonth)) {
						verbaTotal += mes.verbaOriginal + mes.verbaAdicional;
					}
					
                    if (selectedYear && selectedMonth && (mesAno !== selectedYear || mesMes !== selectedMonth)) {
                        continue;
                    }

                    verbaOriginal = mes.verbaOriginal;
                    verbaAdicional = mes.verbaAdicional;
                    saldoMes = mes.verbaMes;                  

					if (saidas) {
						totalSaidasMes += Object.values(saidas)
							.filter(saida => saida.mesReferencia.startsWith(`${selectedYear}-${selectedMonth}`))
							.reduce((sum, saida) => sum + saida.valorParcela, 0);
					}
                }

				if (saidas) {
					totalSaidas += Object.values(saidas)
						.reduce((sum, saida) => sum + saida.valorParcela, 0);
				}				
				
                saldoTotalCalc = verbaTotal - totalSaidas;
            }

            const verbaOriginalP = document.createElement('p');
            verbaOriginalP.innerHTML = `Verba Original: ${verbaOriginal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
            detailsDiv.appendChild(verbaOriginalP);

            const verbaAdicionalP = document.createElement('p');
            verbaAdicionalP.innerHTML = `Verba Adicional: ${verbaAdicional.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
            detailsDiv.appendChild(verbaAdicionalP);

            const verbaP = document.createElement('p');
            verbaP.innerHTML = `Verba: ${(verbaOriginal + verbaAdicional).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
            detailsDiv.appendChild(verbaP);

            const saldoMesP = document.createElement('p');
            saldoMesP.innerHTML = `Saldo do Mês: ${(verbaOriginal + verbaAdicional - totalSaidasMes).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
            detailsDiv.appendChild(saldoMesP);

            const saldoTotalP = document.createElement('p');
            saldoTotalP.innerHTML = `Saldo Geral: ${saldoTotalCalc.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
            detailsDiv.appendChild(saldoTotalP);

            listItem.appendChild(detailsDiv);
            categoriesList.appendChild(listItem);
        }
    } catch (error) {
        console.error("Erro ao buscar categorias:", error);
        const errorMessage = document.createElement('p');
        errorMessage.innerHTML = 'Erro ao carregar as categorias.';
        categoriesList.appendChild(errorMessage);
    }
}