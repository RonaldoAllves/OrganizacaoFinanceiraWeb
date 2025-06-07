const valorAtualSpan = document.getElementById("valorAtual");
const valorMetaSpan = document.getElementById("valorMeta");
const barraProgresso = document.getElementById("barraProgresso");

const VALOR_META = 20000;

function animarValor(valorFinal) {
    let valor = 0;
    const duracao = 2000;
    const passos = 60;
    const incremento = valorFinal / passos;
    let contador = 0;

    const interval = setInterval(() => {
        valor += incremento;
        contador++;
        if (contador >= passos) {
            valor = valorFinal;
            clearInterval(interval);
        }
        const valorRestante = Math.max(VALOR_META - valor, 0);
        valorAtualSpan.textContent = `R$ ${valorRestante
                                                .toFixed(2)
                                                .replace('.', ',')
                                                .replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;

    }, duracao / passos);
}

firebase.database().ref("DadosGerais/SaldoGeral").once("value")
    .then(snapshot => {
        const saldo = snapshot.val() || 0;
        animarValor(saldo);
        const percentual = Math.min((saldo / VALOR_META) * 100, 100);
        barraProgresso.style.width = `${percentual}%`;
        
        moverCarro(percentual);

        const mensagem = document.getElementById("mensagemAnimada");
        if (percentual >= 100) {
            mensagem.textContent = "🎉 Meta atingida! Parabéns!";
            iniciarFogos(); // 🎇 dispara os fogos
        } else if (percentual >= 75) {
            mensagem.textContent = "🚀 Quase lá!";
        } else if (percentual >= 50) {
            mensagem.textContent = "👏 Você está indo muito bem!";
        } else {
            mensagem.textContent = "💪 Continue assim! Falta pouco!";
        }
    })
    .catch(error => {
        console.error("Erro ao obter saldo:", error);
        valorAtualSpan.textContent = "Erro";
    });

function iniciarFogos() {
    const canvas = document.getElementById('fogosCanvas');
    const ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#ff5050', '#ffd700', '#00ccff', '#66ff66', '#ff66cc'];

    function criarParticulas(x, y) {
        for (let i = 0; i < 50; i++) {
            particles.push({
                x: x,
                y: y,
                radius: Math.random() * 3 + 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                speedX: (Math.random() - 0.5) * 8,
                speedY: (Math.random() - 0.5) * 8,
                life: 100
            });
        }
    }

    function animar() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p, index) => {
            p.x += p.speedX;
            p.y += p.speedY;
            p.life--;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
            if (p.life <= 0) {
                particles.splice(index, 1);
            }
        });

        if (particles.length > 0) {
            requestAnimationFrame(animar);
        }
    }

    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            criarParticulas(
                Math.random() * canvas.width,
                Math.random() * canvas.height / 2
            );
            animar();
        }, i * 400);
    }
}

function iniciarParticulasLeves() {
    const canvas = document.getElementById("canvasParticulas");
    const ctx = canvas.getContext("2d");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particulas = [];

    for (let i = 0; i < 120; i++) {
        particulas.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 3 + 2, // AUMENTADO: de 1~3 para 2~5
            speedY: Math.random() * 0.6 + 0.4, // um pouco mais rápido
            alpha: Math.random() * 0.5 + 0.5, // AUMENTADO: de 0.3~0.8
            cor: `rgba(${Math.floor(Math.random() * 255)}, 
                        ${Math.floor(Math.random() * 255)}, 
                        ${Math.floor(Math.random() * 255)}, 
                        ${Math.random() * 0.5 + 0.5})` // cores aleatórias e visíveis
        });
    }


    function animarParticulas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particulas.forEach(p => {
            p.y += p.speedY;
            if (p.y > canvas.height) {
                p.y = 0;
                p.x = Math.random() * canvas.width;
            }
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.cor;
            ctx.fill();

        });
        requestAnimationFrame(animarParticulas);
    }

    animarParticulas();
}

iniciarParticulasLeves(); // chama ao carregar

function moverCarro(percentual) {
    const carro = document.getElementById("carroImagem");
    const pista = document.querySelector(".pista-container");

    const pistaLargura = pista.offsetWidth;
    const carroLargura = carro.offsetWidth;

    const maxPosicao = pistaLargura - carroLargura;
    const posicao = Math.min((percentual / 100) * maxPosicao, maxPosicao);

    carro.style.left = `${posicao}px`;
}


