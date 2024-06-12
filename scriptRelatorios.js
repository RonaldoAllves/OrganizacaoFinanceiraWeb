document.addEventListener('DOMContentLoaded', async () => {
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
                    label: 'Saídas Crédito',
                    data: creditData,
                    borderColor: 'rgba(0, 255, 50, 1)',
                    backgroundColor: 'rgba(0, 255, 50, 0.2)',
                    fill: false
                },
                {
                    label: 'Saídas Dinheiro',
                    data: cashData,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    fill: false
                },
                {
                    label: 'Total Saídas',
                    data: totalData,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
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
                        text: 'Meses'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Valor (R$)'
                    },
                    suggestedMin: 0
                }
            }
        }
    });
});
