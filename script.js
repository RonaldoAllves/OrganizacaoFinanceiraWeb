document.addEventListener('DOMContentLoaded', () => {
    Carrossel();

    // Função para alternar entre campos de compra e entrada
    toggleFields();
});

// Função para alternar os campos específicos de compra
function toggleFields() {
    let transactionType = document.querySelector('input[name="transactionType"]:checked').value;
    let compraFields = document.getElementById('compraFields');
    if (transactionType === 'compra') {
        compraFields.style.display = 'block';
    } else {
        compraFields.style.display = 'none';
    }
}

let saidasRef = firebase.database().ref('/Saidas');
let entradasRef = firebase.database().ref('/Entradas');

// Função para preencher as comboboxes de categorias e contas
async function preencherComboboxes() {
    try {
        let categoriasSnapshot = await firebase.database().ref('/Categorias').once('value');
        let categorias = categoriasSnapshot.val();
        let selectCategoria = document.getElementById('category');
        selectCategoria.innerHTML = '<option value="">Selecione uma categoria</option>';
        for (let chave in categorias) {
            let option = document.createElement('option');
            option.value = categorias[chave].chave;
            option.text = categorias[chave].descricao;
            selectCategoria.add(option);
        }

        let contasSnapshot = await firebase.database().ref('/Contas').once('value');
        let contas = contasSnapshot.val();
        let selectConta = document.getElementById('account');
        selectConta.innerHTML = '<option value="">Selecione uma conta</option>';
        for (let chave in contas) {
            let option = document.createElement('option');
            option.value = contas[chave].chave;
            option.text = contas[chave].descricaoConta;
            selectConta.add(option);
        }
    } catch (error) {
        console.error("Erro ao preencher comboboxes:", error);
    }
}

// Função para inserir uma nova saída/compra
async function inserirSaida(event) {
    event.preventDefault();

    let descricao = document.getElementById('description').value;
    let valor = parseFloat(document.getElementById('value').value);
    let data = document.getElementById('purchaseDate').value;
    let chaveCategoria = document.getElementById('category').value;
    let chaveConta = document.getElementById('account').value;
    let mesReferencia = document.getElementById('referenceMonth').value;
    let tipoSaida = document.getElementById('purchaseType').value;

    if (!descricao || isNaN(valor) || !data || !chaveCategoria || !chaveConta || !mesReferencia || !tipoSaida) {
        alert("Por favor, preencha todos os campos obrigatórios.");
        return;
    }

    let qtdParcelas = parseInt(document.getElementById('installments').value);
    if (isNaN(qtdParcelas) || qtdParcelas < 1) {
        qtdParcelas = 1;
    }

    let dataInicio = document.getElementById('firstInstallmentDate').value;
    let valorTotal = parseFloat(document.getElementById('totalPurchaseValue').value);

    if (qtdParcelas > 1) {
        if (!dataInicio || isNaN(valorTotal)) {
            alert("Por favor, preencha a data da primeira parcela e o valor total.");
            return;
        }
    } else {
        dataInicio = data;
        valorTotal = valor;
    }

    // Calcula a data das parcelas
    let dataParcelas = [];
    let dataAtual = new Date(dataInicio);
	
    for (let i = 0; i < qtdParcelas; i++) {
        if (i > 0) {
            dataAtual.setMonth(dataAtual.getMonth() + 1);            
        }
		if (qtdParcelas > 1) dataAtual.setDate(1);  // Define o primeiro dia do mês para parcelas subsequentes 
        dataParcelas.push(new Date(dataAtual).toISOString().split('T')[0]);
    }

    // Cria todas as parcelas como saídas individuais
    let saidas = [];
    for (let i = 0; i < qtdParcelas; i++) {
        let dataParcela = dataParcelas[i];
        let mesReferenciaParcela = dataParcela.substring(0, 7); // yyyy-mm

        saidas.push({
            descricao: descricao,
            valorParcela: valor,
            data: dataParcela,
            chaveCategoria: parseInt(chaveCategoria),
            chaveConta: parseInt(chaveConta),
            mesReferencia: qtdParcelas > 1 ? mesReferenciaParcela : mesReferencia,
            tipoSaida: tipoSaida === "credito" ? 0 : 1,
            qtdParcelas: qtdParcelas,
            parcela: i + 1,
            dataInicio: dataInicio,
            valorTotal: valorTotal,
            gastoObrigatorio: document.getElementById('mandatoryExpense').checked,
            valorExtrapolado: parseFloat(document.getElementById('exceededValue').value) || 0,
			dataCadastro: new Date().toISOString()
        });
    }

    try {
        let snapshotSaidas = await saidasRef.once('value');
        let saidasExistentes = snapshotSaidas.val();
        let ultimaChave = saidasExistentes ? Math.max(...Object.values(saidasExistentes).map(saida => saida.chave)) : 0;

        // Salva cada parcela como uma saída individual
        for (let i = 0; i < saidas.length; i++) {
            let novaSaida = saidas[i];
            novaSaida.chave = ultimaChave + 1 + i;
            await saidasRef.child('chave-' + novaSaida.chave).set(novaSaida);
        }

        alert("Nova saída inserida com sucesso!");
        document.getElementById('transactionForm').reset();
        toggleFields();
    } catch (error) {
        console.error("Erro ao inserir nova saída:", error);
        alert("Erro ao inserir nova saída. Por favor, tente novamente.");
    }
}

// Função para inserir uma nova entrada
async function inserirEntrada(event) {
    event.preventDefault();

    let descricao = document.getElementById('description').value;
    let valor = parseFloat(document.getElementById('value').value);
    let data = document.getElementById('purchaseDate').value;
    let chaveCategoria = document.getElementById('category').value || 0; // Se não for informado, define como 0
    let chaveConta = document.getElementById('account').value;
    let mesReferencia = document.getElementById('referenceMonth').value;

    if (!descricao || isNaN(valor) || !data || !chaveConta || !mesReferencia) {
        alert("Por favor, preencha todos os campos obrigatórios.");
        return;
    }

    let novaEntrada = {
        descricao: descricao,
        valor: valor,
        data: data,
        chaveCategoria: parseInt(chaveCategoria),
        chaveConta: parseInt(chaveConta),
        mesReferencia: mesReferencia
    };

    try {
        let entradasRef = firebase.database().ref('/Entradas');
        let snapshotEntradas = await entradasRef.once('value');
        let entradas = snapshotEntradas.val();
        let ultimaChave = entradas ? Math.max(...Object.values(entradas).map(entrada => entrada.chave)) : 0;
        novaEntrada.chave = ultimaChave + 1;

        await entradasRef.child('chave-' + novaEntrada.chave).set(novaEntrada);

        if (novaEntrada.chaveCategoria > 0) {
            let mesesRef = firebase.database().ref('/Meses');
            let snapshotMeses = await mesesRef.once('value');
            let meses = snapshotMeses.val();

            // Extrair apenas o mês e o ano da mesReferencia
            let [anoReferencia, mesReferencia] = novaEntrada.mesReferencia.split('-');

            let mesExistente = Object.values(meses || {}).find(mes => {
                let [anoMes, mesMes] = mes.mes.split('-');
                return (
                    mes.chaveCategoria === novaEntrada.chaveCategoria &&
                    mesMes === mesReferencia &&
                    anoMes === anoReferencia
                );
            });

            if (mesExistente) {
                mesExistente.verbaAdicional += valor;
                await mesesRef.child(mesExistente.chave).update({ verbaAdicional: mesExistente.verbaAdicional });
            } else {
                let novaChaveMes = (await mesesRef.push()).key;
                let novoMes = {
                    chave: novaChaveMes,
                    chaveCategoria: novaEntrada.chaveCategoria,
                    mes: novaEntrada.mesReferencia,
                    saldoMes: 0,
                    verbaAdicional: valor,
                    verbaMes: 0,
                    verbaOriginal: 0
                };
                await mesesRef.child(novaChaveMes).set(novoMes);
            }
        }

        alert("Nova entrada inserida com sucesso!");
        document.getElementById('transactionForm').reset();
        toggleFields();
    } catch (error) {
        console.error("Erro ao inserir nova entrada:", error);
        alert("Erro ao inserir nova entrada. Por favor, tente novamente.");
    }
}

// Event listener
document.getElementById('transactionForm').addEventListener('submit', function(event) {
    let transactionType = document.querySelector('input[name="transactionType"]:checked').value;
    if (transactionType === 'entrada') {
        inserirEntrada(event);
    } else {
        inserirSaida(event);
    }
});

// Event listeners
window.addEventListener('load', preencherComboboxes);
window.addEventListener('load', toggleFields);
