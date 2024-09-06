document.addEventListener('DOMContentLoaded', async () => {
	Carrossel();
	CarregarDados();
});

let categorias = null
let lancamentosRecorrentes = null
let entradas = null
let saidas = null

let entradaExtra = 0;
let saidaExtra = 0;

async function CarregarDados(){
	
	let categoriasSnapshot = await firebase.database().ref('/Categorias').once('value');
	categorias = categoriasSnapshot.val();
	
	let lancamentosRecorrentesSnapshot = await firebase.database().ref('/LancamentosRecorrentes').once('value');
	lancamentosRecorrentes = lancamentosRecorrentesSnapshot.val();
	
	let entradasSnapshot = await firebase.database().ref('/Entradas').once('value');
	entradas = entradasSnapshot.val();	
	
	let saidasSnapshot = await firebase.database().ref('/Saidas').once('value');
	saidas = saidasSnapshot.val();
	
	let contasSnapshot = await firebase.database().ref('/Contas').once('value');
	contas = contasSnapshot.val();
	
	entradaExtra = await CalcularPrevisaoEntradaExtra();
	saidaExtra = await CalcularPrevisaoSaidaExtra();
	
}

function CalcularPrevisaoSaidaExtra() {
    let valorObrigatorioPrevistoCat = 0;
    let valorNaoObrigatorioPrevistoCat;
    let valorObrigatorioRegistradoCat;
    let valorNaoObrigatorioRegistradoCategoria;
    let valorExtrapoladoCategoria;
    let valorFaltaGastarCategoria;
    let valorFaltaGastar = 0;
    let data = new Date(); // data atual
	
	// Obter o mês e ano atuais
	let now = new Date();
	let currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
	let currentYear = now.getFullYear();


    for (let categoria in categorias) {
		categoria = categorias[categoria];	
		
        // Calcula valores obrigatórios previstos
        valorObrigatorioPrevistoCat = Object.values(lancamentosRecorrentes)
            .filter(x => x.tipoLancamento === 0 && x.obrigatorio && x.chaveCategoria === categoria.chave 
						 && (!x.dataFinal || x.dataFinal === null || MesMenorIgual(data, x.dataFinal)))
            .reduce((sum, x) => sum + x.valor, 0);	

        // Calcula valores obrigatórios registrados
        valorObrigatorioRegistradoCat = Object.values(saidas)
            .filter(x => x.gastoObrigatorio && x.chaveCategoria === categoria.chave
						 && x.mesReferencia.startsWith(`${currentYear}-${currentMonth}`))
            .reduce((sum, x) => sum + x.valorParcela, 0);


        // Calcula valores extrapolados para a categoria
        valorExtrapoladoCategoria = Object.values(saidas)
            .filter(x => x.gastoObrigatorio && x.chaveCategoria === categoria.chave && x.mesReferencia.startsWith(`${currentYear}-${currentMonth}`))
            .reduce((sum, x) => sum + x.valorExtrapolado, 0);

        // Calcula o valor que falta gastar para a categoria
        valorFaltaGastarCategoria = valorObrigatorioPrevistoCat - valorObrigatorioRegistradoCat + valorExtrapoladoCategoria;

        // Calcula valores não obrigatórios previstos
        valorNaoObrigatorioPrevistoCat = Object.values(lancamentosRecorrentes)
            .filter(x => x.tipoLancamento === 0 && !x.obrigatorio && x.chaveCategoria === categoria.chave && (!x.dataFinal || x.dataFinal === null || MesMenorIgual(data, x.dataFinal)))
            .reduce((sum, x) => sum + x.valor, 0);

        // Calcula valores não obrigatórios registrados para a categoria
        valorNaoObrigatorioRegistradoCategoria = Object.values(saidas)
            .filter(x => !x.gastoObrigatorio && x.chaveCategoria === categoria.chave && x.mesReferencia.startsWith(`${currentYear}-${currentMonth}`))
            .reduce((sum, x) => sum + x.valorParcela, 0);

        // Calcula o valor que falta gastar para a categoria (incluindo não obrigatórios)
        valorFaltaGastarCategoria += Math.max(valorNaoObrigatorioPrevistoCat - valorNaoObrigatorioRegistradoCategoria, 0);

        // Acumula o valor que falta gastar para todas as categorias
        valorFaltaGastar += valorFaltaGastarCategoria;
    }

    return valorFaltaGastar;
}

// Função auxiliar para verificar se um mês é menor ou igual a outro
function MesMenorIgual(mes1, mes2) {	
    // Criar objetos Date com as datas fornecidas
    const d1 = new Date(mes1);
    const d2 = new Date(mes2);

    // Extrair o ano e o mês das duas datas
    const anoMes1 = d1.getFullYear() * 12 + d1.getMonth();
    const anoMes2 = d2.getFullYear() * 12 + d2.getMonth();

    // Comparar os valores anoMes1 e anoMes2
    return anoMes1 <= anoMes2;
}


async function CalcularPrevisaoEntradaExtra(){	
	
	// Filtrar os lançamentos recorrentes onde tipoLancamento é igual a 1
	let entradasRecorrentes = Object.values(lancamentosRecorrentes)
		.filter(x => x.tipoLancamento === 1)
		.reduce((total, x) => total + x.valor, 0);		
	

	// Obter o mês e ano atuais
	let now = new Date();
	let currentMonth = now.getMonth() + 1; // JavaScript's getMonth() returns zero-based month (0-11)
	let currentYear = now.getFullYear();

	// Filtrar as entradas onde chaveCategoria é igual a 0 e mesReferencia corresponde ao mês e ano atuais
	let entradasMes = Object.values(entradas)
		.filter(x => x.chaveCategoria === 0 &&
					 new Date(x.mesReferencia).getMonth() + 1 === currentMonth &&
					 new Date(x.mesReferencia).getFullYear() === currentYear)
		.reduce((total, x) => total + x.valor, 0);	

	return entradasRecorrentes - entradasMes;
}

function InicializarMesesFuturos(){
	// Obter o mês e ano atuais
	let now = new Date();
	let currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
	let currentYear = now.getFullYear();
	
	let saidasMesAtual = Object.values(saidas)
							.filter(x => x.tipoSaida === 0 && x.mesReferencia.startsWith(`${currentYear}-${currentMonth}`))
							.reduce((sum, x) => sum + x.valorParcela, 0);
							
	valorAtualContas = 
	
}

function AtualizarValorTotalConta(){
		
}



