// scriptMesesFuturo.js (corrigido) --------------------------------
document.addEventListener("DOMContentLoaded", () => {
    Carrossel();
    carregarMesesFuturos();
});

async function carregarMesesFuturos() {
    const lista = document.getElementById("listaMesesFuturos");
    lista.innerHTML = "";

    // Carregar tabelas
    const contasSnap = await firebase.database().ref("/Contas").once("value");
    const entradasSnap = await firebase.database().ref("/Entradas").once("value");
    const saidasSnap = await firebase.database().ref("/Saidas").once("value");
    const lancRecSnap = await firebase.database().ref('/LancamentosRecorrentes').once('value');
    const lancDetSnap = await firebase.database().ref('/LancamentosRecorrentesDetalhados').once('value');
    const categoriasSnap = await firebase.database().ref('/Categorias').once('value');
	const mesesSnap = await firebase.database().ref('/Meses').once('value');

    const contas = Object.values(contasSnap.val() || {});
    const entradas = Object.values(entradasSnap.val() || {});
    const saidas = Object.values(saidasSnap.val() || {});
    const lancamentosRecorrentes = Object.values(lancRecSnap.val() || {});
    const lancamentosRecorrentesDetalhado = Object.values(lancDetSnap.val() || {});
    const categorias = Object.values(categoriasSnap.val() || {});
	const mesesCat = mesesSnap.val() || {};
	
	const projecoes = [];
	await carregarProjecao(projecoes, categorias, mesesCat, contas, entradas, saidas, lancamentosRecorrentes, lancamentosRecorrentesDetalhado);
	const categoriaPoupanca = projecoes.find(p => p.descricaoCategoria?.toLowerCase() === "poupança");

    // SALDO ATUAL SOMADO DAS CONTAS
    let saldoAtual = contas.reduce((s, c) => s + (c.valorAtual || 0), 0);

    // DESCONTAR SAÍDAS DO MÊS ATUAL (registradas)
    const hoje = new Date();
    const mesAtual = hoje.getMonth() + 1;
    const anoAtual = hoje.getFullYear();

    const saidasAtual = saidas
        .filter(s => s.tipoSaida === 0 &&
            new Date(s.mesReferencia).getMonth() + 1 === mesAtual &&
            new Date(s.mesReferencia).getFullYear() === anoAtual)
        .reduce((sum, s) => sum + s.valorParcela, 0);

    // CALCULAR SAIDA EXTRA (lógica equivalente ao C# CalcularPrevisaoSaidaExtra)
    const saidaExtra = calcularPrevisaoSaidaExtra(categorias, saidas, lancamentosRecorrentes, lancamentosRecorrentesDetalhado, projecoes);

    // Ajusta saldo inicial exatamente como no C# (valorAtualContas + entradaExtra - saidaExtra - saidasMesAtual)
    // Aqui estamos apenas aplicando saidaExtra (entradas extras não estão sendo calculadas/fornecidas por UI)	
	const entradaExtra = calcularPrevisaoEntradaExtra(entradas, lancamentosRecorrentes, lancamentosRecorrentesDetalhado);

	saldoAtual = saldoAtual + entradaExtra - saidaExtra - saidasAtual;

    // MÊS 0 = mês atual
    const meses = [];
    const qtdMeses = 26;

    // Primeiro mês (mês atual)
    meses.push({
        mes: hoje,
        entradasTotais: entradas.filter(x => new Date(x.mesReferencia).getMonth() + 1 === mesAtual &&	new Date(x.mesReferencia).getFullYear() === anoAtual).reduce((s, x) => s + x.valor, 0) + entradaExtra,
        saidasTotais: saidasAtual + saidaExtra,
        saidasParceladas: saidas.filter(s => s.qtdParcelas > 1 && new Date(s.mesReferencia).getMonth() + 1 === mesAtual &&	new Date(s.mesReferencia).getFullYear() === anoAtual).reduce((s, x) => s + x.valorParcela, 0),
        saldoGeral: saldoAtual
    });

    // Demais meses
    for (let i = 1; i < qtdMeses; i++) {

        const dataMes = new Date(anoAtual, mesAtual - 1 + i, 1);

        const mesNum = dataMes.getMonth() + 1;
        const anoNum = dataMes.getFullYear();

        // Entradas fixas e recorrentes
        const entradasMes = entradas.filter(e =>
            new Date(e.mesReferencia).getMonth() + 1 === mesNum &&
            new Date(e.mesReferencia).getFullYear() === anoNum
        ).reduce((s, x) => s + x.valor, 0);

        const entradasDetalhado = lancamentosRecorrentesDetalhado
            .filter(l => l.tipoLancamento === 1 && l.mes === mesNum)
            .reduce((s, l) => s + l.valor, 0);

        const entradasFixa = lancamentosRecorrentes
            .filter(l => l.tipoLancamento === 1 && l.usaMesFixo && new Date(l.dataFixa).getMonth() + 1 === mesNum)
            .reduce((s, l) => s + l.valor, 0);

        const entradasTotais = Math.max(entradasMes, entradasDetalhado + entradasFixa);

        // Saídas parceladas
        const saidasParceladas = saidas
            .filter(s =>
                s.qtdParcelas > 1 &&
                new Date(s.mesReferencia).getMonth() + 1 === mesNum &&
                new Date(s.mesReferencia).getFullYear() === anoNum)
            .reduce((s, x) => s + x.valorParcela, 0);

        // Saídas totais (previstas) -> agora usa a mesma lógica de recorrentes e detalhados
		const saidasTotais = calcularSaidasTotaisMes(dataMes, saidas, lancamentosRecorrentes, lancamentosRecorrentesDetalhado, categorias);


        // Saldo
        const saldoGeral = saldoAtual + entradasTotais - saidasTotais;
        saldoAtual = saldoGeral;

        meses.push({
            mes: dataMes,
            entradasTotais,
            saidasTotais,
            saidasParceladas,
            saldoGeral
        });
    }
	
	// Se não tiver projeção de poupança, não calcula
	if (categoriaPoupanca) {

		// valor da poupança vindo das projeções
		const valorPoupanca = Number(categoriaPoupanca.maxDeveGastar || 0);

		// menor valor de todos os saldos projetados
		const menorSaldo = Math.min(...meses.map(m => m.saldoGeral));

		let poupancaAtual = valorPoupanca + menorSaldo;

		// evita valor negativo
		if (poupancaAtual < 0) poupancaAtual = 0;

		// exibir na tela
		document.getElementById("valorPoupancaProjetada").textContent = valorPoupanca.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
		document.getElementById("valorPoupancaReal").textContent = poupancaAtual.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
	}

    // Renderizar
    meses.forEach(m => {
        const li = document.createElement("li");
        li.className = "item";

        const cab = document.createElement("div");
        cab.className = "item-header inline-group";

        const titulo = document.createElement("div");
        titulo.className = "listaTitulo";
        titulo.textContent = m.mes.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });

        const saldo = document.createElement("div");
        saldo.className = "subLista";
        saldo.textContent = m.saldoGeral.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

        if (m.saldoGeral < 0)
            saldo.style.color = "#ff4d4d";

        cab.appendChild(titulo);
        cab.appendChild(saldo);

        // SUBLISTA
        const sub = document.createElement("div");
        sub.className = "subListInfo";
		sub.style.display = "none";

        sub.innerHTML = `
            <div>Entradas: <b>${m.entradasTotais.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</b></div>
            <div>Saídas: <b>${m.saidasTotais.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</b></div>
            <div>Parceladas: <b>${m.saidasParceladas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</b></div>
        `;
		
		// Toggle ao clicar
		li.addEventListener("click", () => {
			sub.style.display = sub.style.display === "none" ? "block" : "none";
		});

        li.appendChild(cab);
        li.appendChild(sub);
        lista.appendChild(li);
    });
}

// ---------- Funções auxiliares (replicam lógica C#) ---------------

function calcularSaidasTotaisMes(data, saidasAux, lancRec, lancDet, categorias) {
    // Replica fielmente o C# CalcularPrevisaoSaidasTotaisMes
    let saidaTotal = 0;

    // Normaliza arrays (caso venham objetos)
    const arrSaidasAux = Array.isArray(saidasAux) ? saidasAux : Object.values(saidasAux || {});
    const arrLancRec = Array.isArray(lancRec) ? lancRec : Object.values(lancRec || {});
    const arrLancDet = Array.isArray(lancDet) ? lancDet : Object.values(lancDet || {});
    const arrCategorias = Array.isArray(categorias) ? categorias : Object.values(categorias || {});

    for (const categoria of arrCategorias) {
        // Ignora categorias específicas (mesmo filtro do C#)
        if (categoria.descricao === "Poupança" || categoria.descricao === "cofre carro") {
            // ainda precisamos somar as saídas registradas desta categoria abaixo (se houver),
            // mas o C# pula a lógica de recorrentes para essas descrições.
        }

        let saidasCategoria = 0;

        if (!(categoria.descricao === "Poupança" || categoria.descricao === "cofre carro")) {
            // Lancamentos obrigatórios (tipoLancamento==0 && obrigatorio)
            const lancObrig = arrLancRec.filter(x =>
                x.tipoLancamento === 0 &&
                x.obrigatorio === true &&
                x.chaveCategoria === categoria.chave &&
                (!x.dataFinal || mesMenorOuIgualJS(data, new Date(x.dataFinal)))
            );
            saidaTotal += calcularLancamentoRecorrenteDetalhadoJS(lancObrig, data, arrLancDet);

            // Lancamentos não-obrigatórios (tipoLancamento==0 && !obrigatorio)
            const lancNaoObrig = arrLancRec.filter(x =>
                x.tipoLancamento === 0 &&
                x.obrigatorio === false &&
                x.chaveCategoria === categoria.chave &&
                (!x.dataFinal || mesMenorOuIgualJS(data, new Date(x.dataFinal)))
            );
            saidasCategoria = calcularLancamentoRecorrenteDetalhadoJS(lancNaoObrig, data, arrLancDet);
        }

        // Saídas registradas/realizadas deste mês para esta categoria
        const saidasMesCategoria = arrSaidasAux
            .filter(x =>
                x.tipoSaida === 0 &&
                x.chaveCategoria === categoria.chave &&
                x.mesReferencia &&
                new Date(x.mesReferencia).getMonth() + 1 === (data.getMonth() + 1) &&
                new Date(x.mesReferencia).getFullYear() === data.getFullYear()
            )
            .reduce((s, x) => s + (Number(x.valorParcela) || 0), 0);

        // C#: saidatotal += Math.Max(saidasCategoria, saidasMesCategoria);
        saidaTotal += Math.max(saidasCategoria, saidasMesCategoria);
    }

    return saidaTotal;
}

// Auxiliar: compara mês/ano, equivalente ao MesMenorIgual do C# (usado para dataFinal)
function mesMenorOuIgualJS(mes1, mes2) {
    const d1 = new Date(mes1.getFullYear(), mes1.getMonth(), 1);
    const d2 = new Date(mes2.getFullYear(), mes2.getMonth(), 1);
    return d1 <= d2;
}

// Calcula somatório dos lançamentos recorrentes detalhados para uma lista de lancRec (replica CalcularLancamentoRecorrenteDetalhado)
function calcularLancamentoRecorrenteDetalhadoJS(lancRecList, data, lancDetList) {
    // Se não houver lançamentos recorrentes, retorna 0
    if (!lancRecList || lancRecList.length === 0) return 0;

    const arrLancDet = Array.isArray(lancDetList) ? lancDetList : Object.values(lancDetList || {});
    let valor = 0;

    // Para cada lancRec, buscar detalhado correspondente:
    for (const lanc of lancRecList) {
        // Procurar um detalhe cuja data seja DateTime.Now.AddMonths(d.mes - 1).Date igual a `data.Date`
        const det = arrLancDet.find(d => {
            if (d.chaveLancRecorrente !== lanc.chave) return false;
            if (typeof d.mes === 'undefined' || d.mes === null) return false;

            // dataDetalhe = DateTime.Now.AddMonths(d.mes - 1)
            const hoje = new Date();
            const dataDetalhe = new Date(hoje.getFullYear(), hoje.getMonth() + (d.mes - 1), hoje.getDate());
            // comparar apenas a data (ano, mês, dia)
            return dataDetalhe.getFullYear() === data.getFullYear() &&
                   dataDetalhe.getMonth() === data.getMonth() &&
                   dataDetalhe.getDate() === data.getDate();
        });

        if (det) valor += Number(det.valor || 0);
        else valor += Number(lanc.valor || 0);
    }

    return valor;
}


function calcularPrevisaoSaidaExtra(categorias, saidas, lancRec, lancDet, projecoes) {
    // Soma valorFaltaGastarCategoria(categoria, true, saidas, DateTime.Now) para todas as categorias
    let valorFaltaGastar = 0;
    const agora = new Date();

    for (const categoria of categorias) {
        const v = valorFaltaGastarCategoria(categoria, true, saidas, agora, lancRec, lancDet, projecoes);
        valorFaltaGastar += v;
    }

    if (valorFaltaGastar < 0) valorFaltaGastar = 0;
    return valorFaltaGastar;
}

function valorFaltaGastarCategoria(categoria, ignorarPoupanca, saidas, data, lancRec, lancDet, projecoes) {
    // Replica o conteúdo do C# valorFaltaGastarCategoria mas apenas o necessário:
    // - calcula obrigatorio previsto via ObterValorSaidaCategoria
    // - calcula obrigatorio registrado, extrapolado
    // - adiciona não-obrigatório previsto - registrado (>=0)
    // - se ignorarPoupanca true & (não usa projeção) ... (ignored here)
    // - se projecoes existir e chkUsaProjecao considerado true -> usa projecoes.maxDeveGastar

    const mesRef = data.getMonth() + 1;
    const anoRef = data.getFullYear();

    const obrigatorioPrevisto = obterValorSaidaCategoriaJS(categoria, data, true, lancRec, lancDet);
    const obrigatorioRegistrado = Object.values(saidas)
        .filter(s => s.chaveCategoria === categoria.chave && s.gastoObrigatorio && new Date(s.mesReferencia).getMonth() + 1 === mesRef && new Date(s.mesReferencia).getFullYear() === anoRef)
        .reduce((sum, s) => sum + s.valorParcela, 0);

    const extrapolado = Object.values(saidas)
        .filter(s => s.chaveCategoria === categoria.chave && s.gastoObrigatorio && new Date(s.mesReferencia).getMonth() + 1 === mesRef && new Date(s.mesReferencia).getFullYear() === anoRef)
        .reduce((sum, s) => sum + (s.valorExtrapolado || 0), 0);

    let faltaGastar = obrigatorioPrevisto - obrigatorioRegistrado + extrapolado;

    const naoObrigatorioPrevisto = obterValorSaidaCategoriaJS(categoria, data, false, lancRec, lancDet);
    const naoObrigatorioRegistrado = Object.values(saidas)
        .filter(s => s.chaveCategoria === categoria.chave && !s.gastoObrigatorio && new Date(s.mesReferencia).getMonth() + 1 === mesRef && new Date(s.mesReferencia).getFullYear() === anoRef)
        .reduce((sum, s) => sum + s.valorParcela, 0);

    faltaGastar += Math.max(naoObrigatorioPrevisto - naoObrigatorioRegistrado, 0);

    // Se projecoes estão disponíveis (chkUsaProjecao == true), usa mesProjecao.maxDeveGastar
    if (projecoes && projecoes.length > 0) {
        const mesProjecao = projecoes.find(p => p.chaveCategoria === categoria.chave || p.chaveCategoria == categoria.chave);
        let saldoCategoria = mesProjecao ? (mesProjecao.maxDeveGastar || 0) : 0;
        saldoCategoria = Math.max(saldoCategoria, 0);
        faltaGastar = Math.max(saldoCategoria, faltaGastar);
        return faltaGastar;
    }

    // Caso não haja projeções, retorna cálculo normal
    return faltaGastar;
}

function obterValorSaidaCategoriaJS(categoria, data, obrigatorio, lancRec, lancDet) {
    const tipo = 0;
    const chaveCategoria = categoria.chave;

    // Encontra o lançamento recorrente válido (sem dataFinal ou com dataFinal >= data)
    const lanc = Object.values(lancRec).find(x =>
        x.tipoLancamento === tipo &&
        x.obrigatorio === obrigatorio &&
        x.chaveCategoria === chaveCategoria &&
        (!x.dataFinal || new Date(x.dataFinal) >= data)
    );

    if (!lanc) return 0;

    // Calcula diferença de meses entre data e agora
    const mesDiff = (data.getFullYear() - new Date().getFullYear()) * 12 + (data.getMonth() - new Date().getMonth());

    // Tenta buscar detalhado para o mês específico (no C# usa mes = diferencaMeses + 1)
    const lancRecDet = Object.values(lancDet).find(x =>
        x.tipoLancamento === tipo &&
        x.chaveLancRecorrente === lanc.chave &&
        x.mes === (mesDiff + 1)
    );

    if (lancRecDet) return lancRecDet.valor;

    // Se não houver detalhado: soma de todos recorrentes compatíveis
    return Object.values(lancRec)
        .filter(x =>
            x.tipoLancamento === tipo &&
            x.obrigatorio === obrigatorio &&
            x.chaveCategoria === chaveCategoria &&
            (!x.dataFinal || new Date(x.dataFinal) >= data)
        )
        .reduce((s, x) => s + (x.valor || 0), 0);
}

function calcularPrevisaoEntradaExtra(entradas, lancRec, lancDet) {

    const hoje = new Date();
    const mesAtual = hoje.getMonth() + 1;
    const anoAtual = hoje.getFullYear();

    // 1. ENTRADAS FIXAS (tipoLancamento == 1, usaMesFixo == true)
    const entradasFixa = Object.values(lancRec)
        .filter(x =>
            x.tipoLancamento === 1 &&
            x.usaMesFixo &&
            x.dataFixa &&
            new Date(x.dataFixa).getMonth() + 1 === mesAtual
        )
        .reduce((s, x) => s + (Number(x.valor) || 0), 0);

    // 2. ENTRADAS RECORRENTES DETALHADAS DO MÊS (tipoLancamento=1, mes=N)
    const entradasRecorrentesDetalhado =
        Object.values(lancDet)
            .filter(x =>
                x.tipoLancamento === 1 &&
                x.mes === mesAtual
            )
            .reduce((s, x) => s + (Number(x.valor) || 0), 0)
        + entradasFixa;

    // 3. ENTRADAS JÁ REGISTRADAS DO MÊS ATUAL
    let entradasMes = Object.values(entradas)
        .filter(x =>
            x.mesReferencia &&
            new Date(x.mesReferencia).getMonth() + 1 === mesAtual &&
            new Date(x.mesReferencia).getFullYear() === anoAtual &&
            x.chaveCategoria === 0 &&
            x.chaveCategoriaMesFuturo === 0
        )
        .reduce((s, x) => s + (Number(x.valor) || 0), 0);

    // 3b. ENTRADAS COM chaveCategoriaMesFuturo (>0)
    entradasMes += Object.values(entradas)
        .filter(x =>
            x.mesReferencia &&
            new Date(x.mesReferencia).getMonth() + 1 === mesAtual &&
            new Date(x.mesReferencia).getFullYear() === anoAtual &&
            x.chaveCategoriaMesFuturo > 0
        )
        .reduce((s, x) => s + (Number(x.valor) || 0), 0);

    // 4. entradaExtra = recorrenteDetalhado - entradasJáRegistradas
    let entradaExtra = entradasRecorrentesDetalhado - entradasMes;

    // 5. Se negativo retorna 0
    return entradaExtra < 0 ? 0 : entradaExtra;
}
