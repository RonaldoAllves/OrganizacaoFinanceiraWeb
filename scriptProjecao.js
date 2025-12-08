document.addEventListener('DOMContentLoaded', () => {
    Carrossel();
	carregarProjecaoNaTela();
});

async function carregarProjecaoNaTela(){
	const categoriasSnap = await firebase.database().ref('/Categorias').once('value');
    const mesesSnap = await firebase.database().ref('/Meses').once('value');
    const saidasSnap = await firebase.database().ref('/Saidas').once('value');
    const contasSnap = await firebase.database().ref('/Contas').once('value');
    const entradasSnap = await firebase.database().ref('/Entradas').once('value');
    const lancRecSnap = await firebase.database().ref('/LancamentosRecorrentes').once('value');
    const lancDetSnap = await firebase.database().ref('/LancamentosRecorrentesDetalhados').once('value');
	
	const saidas = saidasSnap.val() || {};
    const contas = Object.values(contasSnap.val() || {});
    const entradas = entradasSnap.val() || {};
	const categorias = categoriasSnap.val() || {};
    const meses = mesesSnap.val() || {};
    const lancamentosRecorrentes = lancRecSnap.val() || {};
    const lancamentosRecorrentesDetalhado = lancDetSnap.val() || {};
	
	const projecoes = [];
	await carregarProjecao(projecoes, categorias, meses, contas, entradas, saidas, lancamentosRecorrentes, lancamentosRecorrentesDetalhado);
	preencherListaHtmlProjecao(projecoes);
}

function preencherListaHtmlProjecao(projecoes){
	// Ordena em ordem decrescente por maxDeveGastar
    const projecoesOrdenadas = [...projecoes].sort((a, b) => (b.maxDeveGastar || 0) - (a.maxDeveGastar || 0)); 
	const projecaoList = document.getElementById('projecaoList');
    projecaoList.innerHTML = '';
	
	for (const proj of projecoesOrdenadas) {
        const item = document.createElement('li');
        item.className = 'item';

        const header = document.createElement('div');
        header.className = 'item-header inline-group';

        const titulo = document.createElement('div');
        titulo.className = 'listaTitulo';
        titulo.textContent = proj.descricaoCategoria;

        const valor = document.createElement('div');
        valor.className = 'subLista';
        valor.textContent = (proj.maxDeveGastar).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        header.appendChild(titulo);
        header.appendChild(valor);
        item.appendChild(header);

        projecaoList.appendChild(item);
    }
}

