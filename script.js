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

let dadosCategorias = firebase.database().ref('/Categorias');
let dadosMeses = firebase.database().ref('/Meses');

// Função para buscar e preencher a tabela com os dados das categorias
async function preencherTabelaCategorias() {
    try {
        // Buscar categorias
        let snapshotCategorias = await dadosCategorias.once('value');
        let categorias = snapshotCategorias.val();

        // Buscar meses
        let snapshotMeses = await dadosMeses.once('value');
        let meses = snapshotMeses.val();

        // Buscar saídas
        let snapshotSaidas = await firebase.database().ref('/Saidas').once('value');
        let saidas = snapshotSaidas.val();

        // Chamar a função para filtrar e preencher os dados na tabela
        FiltrarVerbasMesCategorias(categorias, meses, saidas);
    } catch (error) {
        console.error("Erro ao obter categorias, meses e saídas: ", error);
    }
}

// Função para filtrar e preencher os dados das categorias na tabela
// Função para filtrar e preencher os dados das categorias na tabela
function FiltrarVerbasMesCategorias(categorias, meses, saidas) {
    // Referência à tabela do corpo
    let tbody = document.querySelector('#categoriasTable tbody');

    // Limpa o conteúdo anterior da tabela
    tbody.innerHTML = '';

    // Data do mês de referência
    let dtpMesRefVerbaTotal = new Date(); // ou defina sua data de referência aqui

    // Verba total do mês e saldo total do mês
    let verbaTotalMes = 0;
    let saldoTotalMes = 0;

    // Converter o objeto em um array
    meses = Object.values(meses);
    saidas = Object.values(saidas);

    // Iterar sobre as categorias
    for (let chaveCategoria in categorias) {
        let categoria = categorias[chaveCategoria];

        // Encontrar o mês correspondente à categoria
        let mesAux = meses.find(mes => mes.mes && new Date(mes.mes).getMonth() == dtpMesRefVerbaTotal.getMonth() && new Date(mes.mes).getFullYear() == dtpMesRefVerbaTotal.getFullYear() && mes.chaveCategoria == categoria.chave);

        // Encontrar as saídas correspondentes à categoria
        let saidasCategoria = saidas.filter(saida => saida.chaveCategoria == categoria.chave);

        // Calcular a verba total para a categoria atual
        let verbaTotal = meses
            .filter(mes => mes.chaveCategoria === categoria.chave && dataMenorIgual(new Date(mes.mes), new Date(new Date().getTime())))
            .reduce((total, mes) => total + mes.verbaMes, 0);

        // Calcular o total de saídas para esta categoria
        let totalSaidasCategoria = saidasCategoria.reduce((total, saida) => total + saida.valorParcela, 0);

        // Atualizar o saldo total da categoria
        categoria.saldoTotal = verbaTotal - totalSaidasCategoria;

        // Criar uma nova linha na tabela para cada categoria
        let row = tbody.insertRow();

        if (mesAux) {
            // Filtrar as saídas para o mês atual
            let saidasMes = saidasCategoria.filter(saida =>
                new Date(saida.mesReferencia).getMonth() === new Date(mesAux.mes).getMonth() &&
                new Date(saida.mesReferencia).getFullYear() === new Date(mesAux.mes).getFullYear()
            );

            mesAux.verbaMes = mesAux.verbaOriginal + mesAux.verbaAdicional;

            // Calcular o saldo do mês
            mesAux.saldoMes = mesAux.verbaMes - saidasMes.reduce((total, saida) => total + saida.valorParcela, 0);
        }

        // Preencher os dados nas células da linha
        let cells = [
            categoria.descricao,
            mesAux ? mesAux.verbaOriginal.toFixed(2) : '-',
            mesAux ? mesAux.verbaAdicional.toFixed(2) : '-',
            mesAux ? mesAux.verbaMes.toFixed(2) : '-',
            mesAux ? mesAux.saldoMes.toFixed(2) : '-',
            categoria.saldoTotal.toFixed(2)
        ];

        cells.forEach((value, index) => {
            let cell = row.insertCell();
            cell.innerText = value;

            // Adicionar classes CSS para valores negativos e alinhar à direita
            if (index > 0 && parseFloat(value) < 0) {
                cell.classList.add('negativo');
            }
            cell.style.textAlign = 'right'; // Alinhar à direita
        });

        // Atualizar a verba total e o saldo total do mês
        if (mesAux) {
            verbaTotalMes += mesAux.verbaMes;
            saldoTotalMes += mesAux.saldoMes;
        }        
    }

    // Preencher os totais na interface
    document.getElementById('tbxVerbaTotalMes').innerText = verbaTotalMes.toFixed(2);
    document.getElementById('tbxSaldoTotalMes').innerText = saldoTotalMes.toFixed(2);
}


// Função para verificar se uma data é menor ou igual a outra, ignorando o dia
function dataMenorIgual(data1, data2) {
    // Criar novas datas com o mesmo ano e mês, mas com o dia fixado como 1
    let data1SemDia = new Date(data1.getFullYear(), data1.getMonth(), 1);
    let data2SemDia = new Date(data2.getFullYear(), data2.getMonth(), 1);

    // Verificar se a primeira data é menor ou igual à segunda data
    return data1SemDia <= data2SemDia;
}


// Chamada inicial para preencher a tabela
preencherTabelaCategorias();
