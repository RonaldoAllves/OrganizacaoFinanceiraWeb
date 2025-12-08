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

function Carrossel(){
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
		w = (widthPage - 430) * -0.454545 + 210
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

    // Posicionar o carrossel no início
    carousel.style.transform = `translateX(${w}px)`;
    currentTranslate = w;
    prevTranslate = w;
}

function onResize() {
    Carrossel();
}

// Adiciona o evento resize ao window
window.addEventListener('resize', onResize);

function atualizarValorTotalContas(contas, saidas, entradas) {
	const hoje = new Date();

	for (const conta of contas) {
		const chaveConta = conta.chave;

		// Total de saídas até hoje (inclusive)
		let saidasConta = Object.values(saidas)
			.filter(s => s.chaveConta === chaveConta && s.mesReferencia && new Date(s.mesReferencia) <= hoje)
			.reduce((soma, s) => soma + s.valorParcela, 0);

		// Total de entradas até hoje (inclusive)
		let entradasConta = Object.values(entradas)
			.filter(e => e.chaveConta === chaveConta && e.mesReferencia && new Date(e.mesReferencia) <= hoje)
			.reduce((soma, e) => soma + e.valor, 0);

		// Crédito do mês atual (saídas do tipo 0 exatamente no mês atual)
		let creditoMesAtual = Object.values(saidas)
			.filter(s => s.chaveConta === chaveConta && s.tipoSaida === 0 && s.mesReferencia && datasIguaisMesAno(new Date(s.mesReferencia), hoje))
			.reduce((soma, s) => soma + s.valorParcela, 0);

		saidasConta -= creditoMesAtual;

		// valorAtual = valorInicial - saídas + entradas
		conta.valorAtual = (conta.valorInicial || 0) - saidasConta + entradasConta;
	}
}

// Função auxiliar para comparar mês/ano das datas
function datasIguaisMesAno(data1, data2) {
	return data1.getMonth() === data2.getMonth() && data1.getFullYear() === data2.getFullYear();
}

async function carregarProjecao(projecoes, categorias, meses, contas, entradas, saidas, lancamentosRecorrentes, lancamentosRecorrentesDetalhado) {
    const hoje = new Date();
    const anoSelecionado = hoje.getFullYear();
    const mesSelecionado = hoje.getMonth() + 1;

    atualizarValorTotalContas(contas, saidas, entradas);

    for (const chave in categorias) {
        const categoria = categorias[chave];

        const mes = Object.values(meses).find(m => {
            if (m.chaveCategoria !== categoria.chave || !m.mes) return false;
            const dataMes = new Date(m.mes);
            return dataMes.getFullYear() === anoSelecionado && dataMes.getMonth() + 1 === mesSelecionado;
        });

        if (!mes) continue;

        const totalSaidas = Object.values(saidas)
            .filter(s => s.chaveCategoria === categoria.chave && s.mesReferencia && new Date(s.mesReferencia).getFullYear() === anoSelecionado && new Date(s.mesReferencia).getMonth() + 1 === mesSelecionado)
            .reduce((soma, s) => soma + s.valorParcela, 0);

        const verbaOriginal = mes.verbaOriginal || 0;
        const verbaAdicional = mes.verbaAdicional || 0;
        const saldoMes = verbaOriginal + verbaAdicional - totalSaidas;
        const saldoGeral = calcularSaldoGeral(categoria.chave, meses, saidas);
        const maxVerbaCategoria = Math.max(Math.max(saldoMes, saldoGeral), 0);

        const maxLancRecorrente = valorFaltaGastarCategoria(categoria, false, saidas, new Date(), lancamentosRecorrentes, lancamentosRecorrentesDetalhado, meses);
        let maxDeveGastar = Math.max(maxVerbaCategoria, maxLancRecorrente)

        projecoes.push({
            chaveCategoria: categoria.chave,
            descricaoCategoria: categoria.descricao,
            maxVerbaCategoria,
            maxLancRecorrente,
            maxDeveGastar,
            gastoFlexivel: categoria.gastoFlexivel,
            prioridade: categoria.prioridade
        });
    }

    await preencherMaxDeveGastarMesAtual(projecoes, Object.values(categorias), Object.values(saidas), contas, entradas, lancamentosRecorrentes, lancamentosRecorrentesDetalhado, meses);  
}



function calcularSaldoGeral(chaveCategoria, meses, saidas) {
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth() + 1;

    let verbaTotal = 0;
    for (const mes of Object.values(meses)) {
        if (mes.chaveCategoria !== chaveCategoria) continue;

        const [ano, mesStr] = mes.mes.split('-');
        const mesNum = parseInt(mesStr);
        const anoNum = parseInt(ano);

        if (anoNum < anoAtual || (anoNum === anoAtual && mesNum <= mesAtual)) {
            verbaTotal += (mes.verbaOriginal || 0) + (mes.verbaAdicional || 0);
        }
    }

    const totalSaidas = Object.values(saidas)
        .filter(s => s.chaveCategoria === chaveCategoria)
        .reduce((soma, s) => soma + s.valorParcela, 0);

    return verbaTotal - totalSaidas;
}

function valorFaltaGastarCategoria(categoria, ignorarPoupanca, saidas, data, lancamentosRecorrentes, lancamentosRecorrentesDetalhado, meses) {
    const mesRef = data.getMonth() + 1;
    const anoRef = data.getFullYear();

    const obrigatorioPrevisto = obterValorSaidaCategoria(categoria, data, true, lancamentosRecorrentes, lancamentosRecorrentesDetalhado);
    const obrigatorioRegistrado = Object.values(saidas).filter(s =>
        s.chaveCategoria === categoria.chave && s.gastoObrigatorio && new Date(s.mesReferencia).getMonth() + 1 === mesRef && new Date(s.mesReferencia).getFullYear() === anoRef
    ).reduce((sum, s) => sum + s.valorParcela, 0);

    const extrapolado = Object.values(saidas).filter(s =>
        s.chaveCategoria === categoria.chave && s.gastoObrigatorio && new Date(s.mesReferencia).getMonth() + 1 === mesRef && new Date(s.mesReferencia).getFullYear() === anoRef
    ).reduce((sum, s) => sum + s.valorExtrapolado, 0);

    let faltaGastar = obrigatorioPrevisto - obrigatorioRegistrado + extrapolado;

    const naoObrigatorioPrevisto = obterValorSaidaCategoria(categoria, data, false, lancamentosRecorrentes, lancamentosRecorrentesDetalhado);
    const naoObrigatorioRegistrado = Object.values(saidas).filter(s =>
        s.chaveCategoria === categoria.chave && !s.gastoObrigatorio && new Date(s.mesReferencia).getMonth() + 1 === mesRef && new Date(s.mesReferencia).getFullYear() === anoRef
    ).reduce((sum, s) => sum + s.valorParcela, 0);

    faltaGastar += Math.max(naoObrigatorioPrevisto - naoObrigatorioRegistrado, 0);

    const mesCategoria = Object.values(meses).find(m =>
        m.chaveCategoria === categoria.chave && new Date(m.mes).getMonth() + 1 === mesRef && new Date(m.mes).getFullYear() === anoRef
    );
    const saldoCategoria = mesCategoria ? Math.max(mesCategoria.saldoMes || 0, 0) : 0;

    if (ignorarPoupanca && categoria.descricao !== "Poupança" && categoria.descricao !== "cofre carro") {
        faltaGastar = Math.max(saldoCategoria, faltaGastar);
    }

    return faltaGastar;
}

function mesMenorOuIgual(data1, data2) {
    const ano1 = data1.getFullYear();
    const mes1 = data1.getMonth();
    const ano2 = data2.getFullYear();
    const mes2 = data2.getMonth();
    return ano1 < ano2 || (ano1 === ano2 && mes1 <= mes2);
}

function obterValorSaidaCategoria(categoria, data, obrigatorio, lancamentosRecorrentes, lancamentosRecorrentesDetalhado) {
	const tipo = 0;
	const chaveCategoria = categoria.chave;

	// Encontra o lançamento recorrente válido (sem dataFinal ou com dataFinal >= data)
	const lancRec = Object.values(lancamentosRecorrentes).find(x =>
		x.tipoLancamento === tipo &&
		x.obrigatorio === obrigatorio &&
		x.chaveCategoria === chaveCategoria &&
		(!x.dataFinal || mesMenorOuIgual(data, new Date(x.dataFinal)))
	);

	if (!lancRec) return 0;

	// Calcula a diferença de meses entre data e hoje (data base é sempre o "agora")
	const mesDiff = (data.getFullYear() - new Date().getFullYear()) * 12 + (data.getMonth() - new Date().getMonth());

	// Tenta buscar valor detalhado para o mês específico
	const lancRecDet = Object.values(lancamentosRecorrentesDetalhado).find(x =>
		x.tipoLancamento === tipo &&
		x.chaveLancRecorrente === lancRec.chave &&
		x.mes === mesDiff + 1
	);

	if (lancRecDet) return lancRecDet.valor;

	// Se não houver detalhado, retorna a soma dos valores dos lançamentos recorrentes compatíveis
	return Object.values(lancamentosRecorrentes)
		.filter(x =>
			x.tipoLancamento === tipo &&
			x.obrigatorio === obrigatorio &&
			x.chaveCategoria === chaveCategoria &&
			(!x.dataFinal || mesMenorOuIgual(data, new Date(x.dataFinal)))
		)
		.reduce((sum, x) => sum + x.valor, 0);
}


async function preencherMaxDeveGastarMesAtual(projecoes, categorias, saidas, contas, entradas, lancamentosRecorrentes, lancamentosRecorrentesDetalhado, meses) {
    const hoje = new Date();
    const mes = hoje.getMonth() + 1;
    const ano = hoje.getFullYear();

    const creditoMesAtual = saidas
        .filter(s => s.tipoSaida === 0 && new Date(s.mesReferencia).getFullYear() === ano && new Date(s.mesReferencia).getMonth() + 1 === mes)
        .reduce((sum, s) => sum + s.valorParcela, 0);

    const entradaRestante = calcularPrevisaoEntradaExtra(entradas, lancamentosRecorrentes, lancamentosRecorrentesDetalhado, mes, ano);

    const valorContas = contas.filter(c => c.valorAtual >= 0).reduce((soma, c) => soma + c.valorAtual, 0);

    const totalMaxLancRecorrente = projecoes.reduce((sum, p) => sum + (p.maxLancRecorrente || 0), 0);
    const totalMaxVerbaCategoria = projecoes.reduce((sum, p) => sum + (p.maxVerbaCategoria || 0), 0);

    let saldoLancamentoRecorrente = valorContas + entradaRestante - creditoMesAtual - totalMaxLancRecorrente;
    let saldoVerbas = valorContas + entradaRestante - creditoMesAtual - totalMaxVerbaCategoria;
    let saldo = Math.min(saldoLancamentoRecorrente, saldoVerbas);

    if (saldo < 0) {
        for (const cat of categorias.filter(c => c.gastoFlexivel).sort((a, b) => b.prioridade - a.prioridade)) {
            const proj = projecoes.find(p => p.chaveCategoria === cat.chave);
            if (!proj) continue;

            const quantoPodiaGastar = Math.max(proj.maxLancRecorrente, proj.maxVerbaCategoria);
            if (quantoPodiaGastar < 0) continue;

            if (quantoPodiaGastar >= Math.abs(saldo)) {
                proj.maxDeveGastar += saldo;
                saldo = 0;
                break;
            }

            saldo += quantoPodiaGastar;
            proj.maxDeveGastar = 0;
        }

        if (saldo < 0) {
            for (const cat of categorias.filter(c => !c.gastoFlexivel).sort((a, b) => b.prioridade - a.prioridade)) {
                const proj = projecoes.find(p => p.chaveCategoria === cat.chave);
                if (!proj) continue;

                const quantoPodiaGastar = Math.max(proj.maxLancRecorrente, proj.maxVerbaCategoria);
                if (quantoPodiaGastar < 0) continue;

                if (quantoPodiaGastar >= Math.abs(saldo)) {
                    proj.maxDeveGastar += saldo;
                    saldo = 0;
                    break;
                }

                saldo += quantoPodiaGastar;
                proj.maxDeveGastar = 0;
            }
        }

        if (saldo < 0) {
            alert(`Após o cálculo do quanto deve gastar o saldo permanece negativo.\n\nSaldo: ${saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
        }
    }
}

function calcularPrevisaoEntradaExtra(entradas, lancamentosRecorrentes, lancamentosRecorrentesDetalhado, mesAtual, anoAtual) {
    const entradasFixa = Object.values(lancamentosRecorrentes).filter(x => x.tipoLancamento === 1 && x.usaMesFixo && new Date(x.dataFixa).getMonth() + 1 === mesAtual).reduce((soma, x) => soma + x.valor, 0);
    const entradasDetalhado = Object.values(lancamentosRecorrentesDetalhado).filter(x => x.tipoLancamento === 1 && x.mes === mesAtual).reduce((soma, x) => soma + x.valor, 0);
    
    // 🔁 Primeira parte: chaveCategoria === 0 (entradas não distribuídas)
    const entradasMesNaoDistribuidas = Object.values(entradas)
        .filter(x =>
            x.mesReferencia &&
            new Date(x.mesReferencia).getFullYear() === anoAtual &&
            new Date(x.mesReferencia).getMonth() + 1 === mesAtual &&
            x.chaveCategoria === 0
        )
        .reduce((soma, x) => soma + x.valor, 0);

    // 🔁 Segunda parte: chaveCategoriaMesFuturo > 0
    const entradasMesFuturo = Object.values(entradas)
        .filter(x =>
            x.mesReferencia &&
            new Date(x.mesReferencia).getFullYear() === anoAtual &&
            new Date(x.mesReferencia).getMonth() + 1 === mesAtual &&
            x.chaveCategoriaMesFuturo > 0
        )
        .reduce((soma, x) => soma + x.valor, 0);

    const entradasMes = entradasMesNaoDistribuidas + entradasMesFuturo;
    const entradaExtra = entradasDetalhado + entradasFixa - entradasMes;

    return entradaExtra < 0 ? 0 : entradaExtra;
}
