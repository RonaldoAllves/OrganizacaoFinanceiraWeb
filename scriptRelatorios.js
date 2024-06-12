document.addEventListener('DOMContentLoaded', async () => {
	Carrossel();
	GraficoSaidasGeral();  

	await loadCategories();
    GraficoSaidasCategoria();
});

async function loadCategories() {
    const categorySelect = document.getElementById('categorySelect');
    categorySelect.innerHTML = '';

    try {
        const categoriesSnapshot = await firebase.database().ref('/Categorias').once('value');
        const categories = categoriesSnapshot.val();

        if (categories) {
            Object.values(categories).forEach(category => {
                const option = document.createElement('option');
                option.value = category.chave;
                option.text = category.descricao;
                categorySelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error("Erro ao carregar categorias:", error);
    }
}

async function GraficoSaidasCategoria() {
    const ctx = document.getElementById('myChartCategory').getContext('2d');
    const categorySelect = document.getElementById('categorySelect');
    const today = new Date();
    const last12Months = [];

    for (let i = 0; i < 12; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        last12Months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    }

    last12Months.reverse();

    const creditData = Array(12).fill(0);
    const cashData = Array(12).fill(0);
    const totalData = Array(12).fill(0);

    async function updateChart() {
        const selectedCategory = categorySelect.value;
        creditData.fill(0);
        cashData.fill(0);
        totalData.fill(0);

        try {		
			const saidasSnapshot = await firebase.database().ref('/Saidas').orderByChild('chaveCategoria').equalTo(parseInt(selectedCategory)).once('value');
            const saidas = saidasSnapshot.val();

            if (saidas) {
                Object.values(saidas).forEach(saida => {
                    const mesReferencia = saida.mesReferencia.split('T')[0].slice(0, 7); // Extrair ano e mês
                    const monthIndex = last12Months.indexOf(mesReferencia);

                    if (monthIndex > -1) {
                        if (saida.tipoSaida === 0) {
                            creditData[monthIndex] += saida.valorParcela;
                        } else if (saida.tipoSaida === 1) {
                            cashData[monthIndex] += saida.valorParcela;
                        }
                        totalData[monthIndex] += saida.valorParcela;
                    }
                });
            }
        } catch (error) {
            console.error("Erro ao buscar saídas:", error);
        }

        myChart.update();
    }

    const myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last12Months.map(date => {
                const [year, month] = date.split('-');
                return `${month}/${year}`;
            }),
            datasets: [
                {
                    label: 'Crédito',
                    data: creditData,
                    borderColor: 'rgba(0, 255, 100, 1)',
                    backgroundColor: 'rgba(0, 255, 100, 0.2)',
                    fill: false,
                    color: '#ffffff' // Cor da legenda
                },
                {
                    label: 'Dinheiro',
                    data: cashData,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    fill: false,
                    color: '#ffffff' // Cor da legenda
                },
                {
                    label: 'Total saídas',
                    data: totalData,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    fill: false,
                    color: '#ffffff' // Cor da legenda
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#ffffff' // Cor da legenda
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Meses',
                        font: {
                            size: 16,
                            family: 'Arial',
                            weight: 'bold',
                            lineHeight: 1.2
                        },
                        color: '#ffffff' // Cor do título do eixo x
                    },
                    ticks: {
                        font: {
                            size: 12,
                            family: 'Arial',
                            weight: 'normal',
                            lineHeight: 1.2
                        },
                        color: '#ffffff' // Cor das ticks do eixo x
                    },
                    grid: {
                        color: '#949494' // Cor das linhas de grade do eixo x
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Valor (R$)',
                        font: {
                            size: 16,
                            family: 'Arial',
                            weight: 'bold',
                            lineHeight: 1.2
                        },
                        color: '#ffffff' // Cor do título do eixo y
                    },
                    ticks: {
                        font: {
                            size: 12,
                            family: 'Arial',
                            weight: 'normal',
                            lineHeight: 1.2
                        },
                        color: '#ffffff' // Cor das ticks do eixo y
                    },
                    suggestedMin: 0,
                    grid: {
                        color: '#949494' // Cor das linhas de grade do eixo y
                    }
                }
            }
        }
    });

    categorySelect.addEventListener('change', updateChart);
    await updateChart(); // Atualizar o gráfico na inicialização
}

async function GraficoSaidasGeral(){
	const ctx = document.getElementById('myChart').getContext('2d');
    const today = new Date();
    const last12Months = [];

    for (let i = 0; i < 12; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        last12Months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    }

    last12Months.reverse();

    const creditData = Array(12).fill(0);
    const cashData = Array(12).fill(0);
    const totalData = Array(12).fill(0);

    try {
        const saidasSnapshot = await firebase.database().ref('/Saidas').once('value');
        const saidas = saidasSnapshot.val();

        if (saidas) {
            Object.values(saidas).forEach(saida => {
                const mesReferencia = saida.mesReferencia.split('T')[0].slice(0, 7); // Extrair ano e mês
                const monthIndex = last12Months.indexOf(mesReferencia);

                if (monthIndex > -1) {
                    if (saida.tipoSaida === 0) {
                        creditData[monthIndex] += saida.valorParcela;
                    } else if (saida.tipoSaida === 1) {
                        cashData[monthIndex] += saida.valorParcela;
                    }
                    totalData[monthIndex] += saida.valorParcela;
                }
            });
        }
    } catch (error) {
        console.error("Erro ao buscar saídas:", error);
    }

    const myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last12Months.map(date => {
                const [year, month] = date.split('-');
                return `${month}/${year}`;
            }),
            datasets: [
                {
                    label: 'Crédito',
                    data: creditData,
                    borderColor: 'rgba(0, 255, 100, 1)',
                    backgroundColor: 'rgba(0, 255, 100, 0.2)',
                    fill: false,
                    color: '#ffffff' // Cor da legenda
                },
                {
                    label: 'Dinheiro',
                    data: cashData,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    fill: false,
                    color: '#ffffff' // Cor da legenda
                },
                {
                    label: 'Total saídas',
                    data: totalData,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    fill: false,
                    color: '#ffffff' // Cor da legenda
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#ffffff' // Cor da legenda
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Meses',
                        font: {
                            size: 16,
                            family: 'Arial',
                            weight: 'bold',
                            lineHeight: 1.2
                        },
                        color: '#ffffff' // Cor do título do eixo x
                    },
                    ticks: {
                        font: {
                            size: 12,
                            family: 'Arial',
                            weight: 'normal',
                            lineHeight: 1.2
                        },
                        color: '#ffffff' // Cor das ticks do eixo x
                    },
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Valor (R$)',
                        font: {
                            size: 16,
                            family: 'Arial',
                            weight: 'bold',
                            lineHeight: 1.2
                        },
                        color: '#ffffff' // Cor do título do eixo y
                    },
                    ticks: {
                        font: {
                            size: 12,
                            family: 'Arial',
                            weight: 'normal',
                            lineHeight: 1.2
                        },
                        color: '#ffffff' // Cor das ticks do eixo y
                    },
                    suggestedMin: 0,
					grid: {
						color: '#949494' // Cor das linhas de grade do eixo x
					}
                }
            }
        }
    });
}