console.log('✅ Script iniciado!');

let ultimoStatus = "";
let intervaloChecagem = parseInt(localStorage.getItem("tempoChecagem")) || 30;
let somAtivado = localStorage.getItem("somNotificacao") !== "false";
let notificacaoAtivada = localStorage.getItem("notificacaoSistema") !== "false"; // Nova variável
let tempoRestante = intervaloChecagem;

let logAtivado = localStorage.getItem("logStatus") !== "false";
let manterLogDias = parseInt(localStorage.getItem("manterLogDias")) || 90;
let exibirInfos = localStorage.getItem("exibirTudo") !== "false"; // nova config

const somOnline = new Audio("https://www.fesliyanstudios.com/play-mp3/5263");
const somOffline = new Audio("https://www.fesliyanstudios.com/play-mp3/6728");

window.addEventListener("DOMContentLoaded", () => {
    console.log("🔄️ Verificando se existem logs antigos no localStorage para enviar pro arquivo local logs.txt");

    let logs = JSON.parse(localStorage.getItem("historicoLog")) || [];

    if (logs.length > 0 && window.electron) {
        logs.forEach(log => {
            console.log(`📜 Exportando log antigo: ${log.texto} (${new Date(log.time).toLocaleString()})`);
            window.electron.sendLog({ time: log.time, texto: log.texto });
        });

        // ✅ Após exportação, limpar o localStorage para evitar duplicações
        localStorage.removeItem("historicoLog");
        console.log("🗑️ Logs antigos removidos do localStorage!");
    } else {
        console.log("✅ Nenhum log encontrado no localStorage para exportação.");
    }
});

function toggleConfig() {
    const config = document.getElementById("config");
    // Se já está visível, oculta; caso contrário, mostra
    config.style.display = (config.style.display === "block") ? "none" : "block";
}

function salvarConfiguracoes() {
    const tempo = document.getElementById("tempoChecagem").value;
    const som = document.getElementById("somNotificacao").checked;
    const notificacao = document.getElementById("notificacaoSistema").checked;
    const logStatusCheck = document.getElementById("logStatus").checked;
    const manterLogDiasValue = document.getElementById("manterLogDias").value;
    const exibirTudoCheck = document.getElementById("exibirTudo").checked;

    localStorage.setItem("tempoChecagem", tempo);
    localStorage.setItem("somNotificacao", som);
    localStorage.setItem("notificacaoSistema", notificacao);
    localStorage.setItem("logStatus", logStatusCheck);
    localStorage.setItem("manterLogDias", manterLogDiasValue);
    localStorage.setItem("exibirTudo", exibirTudoCheck);

    intervaloChecagem = parseInt(tempo);
    somAtivado = som;
    notificacaoAtivada = notificacao;
    logAtivado = logStatusCheck;
    manterLogDias = parseInt(manterLogDiasValue);
    exibirInfos = exibirTudoCheck;

    tempoRestante = intervaloChecagem;
    document.getElementById("config").style.display = "none";
    mostrarPopup("Salvo!");
    atualizarExibicao();
}

function mostrarPopup(mensagem) {
    const popup = document.getElementById("popup");
    popup.textContent = mensagem;
    popup.style.display = "block";
    popup.classList.add("show");

    setTimeout(() => {
        popup.classList.remove("show");
        setTimeout(() => {
            popup.style.display = "none";
        }, 1000);
    }, 3000);
}

function carregarConfiguracoes() {
    const tempo = localStorage.getItem("tempoChecagem");
    const som = localStorage.getItem("somNotificacao");
    const notificacao = localStorage.getItem("notificacaoSistema");
    const logStatusCheck = localStorage.getItem("logStatus");
    const manterLogDiasStorage = localStorage.getItem("manterLogDias");
    const exibirTudoStorage = localStorage.getItem("exibirTudo");

    if (tempo) {
        document.getElementById("tempoChecagem").value = tempo;
        intervaloChecagem = parseInt(tempo);
        tempoRestante = intervaloChecagem;
    }
    if (som !== null) {
        document.getElementById("somNotificacao").checked = (som !== "false");
        somAtivado = (som !== "false");
    }
    if (notificacao !== null) {
        document.getElementById("notificacaoSistema").checked = (notificacao !== "false");
        notificacaoAtivada = (notificacao !== "false");
    }
    if (logStatusCheck !== null) {
        document.getElementById("logStatus").checked = (logStatusCheck !== "false");
        logAtivado = (logStatusCheck !== "false");
    }
    if (manterLogDiasStorage) {
        document.getElementById("manterLogDias").value = manterLogDiasStorage;
        manterLogDias = parseInt(manterLogDiasStorage);
    }
    if (exibirTudoStorage !== null) {
        document.getElementById("exibirTudo").checked = (exibirTudoStorage !== "false");
        exibirInfos = (exibirTudoStorage !== "false");
    }
}

// Oculta ou exibe tudo, exceto o status, com base em "exibirInfos"
function atualizarExibicao() {
    const toggleables = document.querySelectorAll('.toggleable:not(#status):not(#config):not(#statusIndicator)');
    const logContainer = document.getElementById('logContainer');
    const logs = JSON.parse(localStorage.getItem("historicoLog")) || [];

    toggleables.forEach(element => {
        // Caso especial para o logContainer
        if (element === logContainer) {
            element.style.display = exibirInfos && logs.length > 0 ? "block" : "none";
        } else {
            element.style.display = exibirInfos ? "block" : "none";
        }
    });

    // Exibe o botão "Exibir" quando exibirTudo estiver desativado
    const exibirBtn = document.getElementById("exibirButton");
    exibirBtn.style.display = exibirInfos ? "none" : "block";
}

// Botão "Exibir" no rodapé que reverte o estado
function toggleExibir() {
    exibirInfos = true;
    localStorage.setItem("exibirTudo", true);
    atualizarExibicao();
}

function toggleVisibility() {
    exibirInfos = !exibirInfos;
    localStorage.setItem("exibirTudo", exibirInfos);
    atualizarExibicao();
}

async function testarConexaoManual() {
    verificarConexao(true);
}

function adicionarLogEntrada(mensagem) {
    console.log("🔹 Função adicionarLogEntrada chamada com mensagem:", mensagem);

    if (!logAtivado) {
        console.log("⚠ Log desativado! Nenhuma ação será realizada.");
        return;
    }

    let logs = JSON.parse(localStorage.getItem("historicoLog")) || [];
    console.log("📌 Logs atuais no localStorage:", logs);

    logs = limparLogAntigo(logs);
    console.log("✅ Logs antigos limpos.");

    const novaEntrada = {
        time: Date.now(),
        texto: mensagem
    };

    logs.unshift(novaEntrada);
    localStorage.setItem("historicoLog", JSON.stringify(logs));
    console.log("✅ Novo log armazenado no localStorage:", novaEntrada);

    exibirLog();
    console.log("📢 Logs exibidos na interface!");

    // Verificar se a API do preload.js está acessível
    if (window.electron) {
        console.log("🟢 API do preload.js encontrada! Enviando log para o main.js...");
        window.electron.sendLog(novaEntrada.texto);
    } else {
        console.log("❌ API do preload.js NÃO encontrada! O log não será salvo no arquivo.");
    }
}

function limparLogAntigo(logs) {
    const agora = Date.now();
    const diasEmMs = manterLogDias * 24 * 60 * 60 * 1000;
    return logs.filter(entry => {
        return (agora - entry.time) <= diasEmMs;
    });
}

// Função para arredondar a diferença de tempo (em ms) para s, m, h ou d
function getTimeDiffStr(msDiff) {
    let seconds = msDiff / 1000;
    if (seconds < 60) {
        return Math.round(seconds) + "s";
    }
    let minutes = seconds / 60;
    if (minutes < 60) {
        return Math.round(minutes) + "m";
    }
    let hours = minutes / 60;
    if (hours < 24) {
        return Math.round(hours) + "h";
    }
    let days = hours / 24;
    return Math.round(days) + "d";
}

// Agrupamento de "Caiu" e "Voltou" com formatação padronizada
async function exibirLog() {
    const logContainer = document.getElementById("logContainer");
    let logs = [];

    if (window.electron) {
        logs = await window.electron.getLogs();
    } else {
        logs = JSON.parse(localStorage.getItem("historicoLog")) || [];
    }

    logs = limparLogAntigo(logs);
    localStorage.setItem("historicoLog", JSON.stringify(logs));

    // Gera o conteúdo de log
    const ordenadoAsc = [...logs].reverse();
    const agrupado = [];
    let pendenteCaiu = null;
    for (let i = 0; i < ordenadoAsc.length; i++) {
        const entry = ordenadoAsc[i];
        if (entry.texto.includes("caiu")) {
            if (pendenteCaiu) {
                agrupado.push({ caiu: pendenteCaiu, voltou: null });
            }
            pendenteCaiu = entry;
        } else if (entry.texto.includes("voltou")) {
            if (pendenteCaiu) {
                agrupado.push({ caiu: pendenteCaiu, voltou: entry });
                pendenteCaiu = null;
            } else {
                agrupado.push({ caiu: null, voltou: entry });
            }
        } else {
            agrupado.push({ caiu: entry, voltou: null });
        }
    }
    if (pendenteCaiu) {
        agrupado.push({ caiu: pendenteCaiu, voltou: null });
    }
    agrupado.reverse();

    let html = "";
    for (const grupo of agrupado) {
        if (grupo.caiu && grupo.voltou) {
            const dataCaiu = new Date(grupo.caiu.time);
            const dataVoltou = new Date(grupo.voltou.time);
            const diffMs = dataVoltou - dataCaiu;
            const diffStr = getTimeDiffStr(diffMs);
            const diaCaiu = formatarDia(dataCaiu);
            const horaCaiu = formatarHora(dataCaiu);
            const diaVoltou = formatarDia(dataVoltou);
            const horaVoltou = formatarHora(dataVoltou);
            if (diaCaiu === diaVoltou) {
                html += `<div class="log-item">${diaCaiu} - ${horaCaiu} → ${horaVoltou} (por ${diffStr})</div>`;
            } else {
                html += `<div class="log-item">${diaCaiu} ${horaCaiu} → ${diaVoltou} ${horaVoltou} (por ${diffStr})</div>`;
            }
        } else if (grupo.caiu && !grupo.voltou) {
            const dataCaiu = new Date(grupo.caiu.time);
            html += `<div class="log-item">[${formatarData(dataCaiu.getTime())}] ${grupo.caiu.texto}</div>`;
        } else if (!grupo.caiu && grupo.voltou) {
            const dataVoltou = new Date(grupo.voltou.time);
            html += `<div class="log-item">[${formatarData(dataVoltou.getTime())}] ${grupo.voltou.texto}</div>`;
        }
    }

    // Se log não estiver ativado, ou exibirTudo for falso, ou nenhum log gerado, oculta o container
    if (!logAtivado || !exibirInfos || html.trim() === "") {
        logContainer.style.display = "none";
        logContainer.innerHTML = "";
        return;
    }

    // Caso contrário, exibe o container com o conteúdo
    logContainer.style.display = "block";
    logContainer.innerHTML = html;
}

function formatarData(timestamp) {
    const data = new Date(timestamp);
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    const hora = String(data.getHours()).padStart(2, '0');
    const minuto = String(data.getMinutes()).padStart(2, '0');
    const segundo = String(data.getSeconds()).padStart(2, '0');
    return `${dia}/${mes}/${ano} ${hora}:${minuto}:${segundo}`;
}

function formatarDia(dateObj) {
    const dia = String(dateObj.getDate()).padStart(2, '0');
    const mes = String(dateObj.getMonth() + 1).padStart(2, '0');
    const ano = dateObj.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

function formatarHora(dateObj) {
    const hora = String(dateObj.getHours()).padStart(2, '0');
    const minuto = String(dateObj.getMinutes()).padStart(2, '0');
    const segundo = String(dateObj.getSeconds()).padStart(2, '0');
    return `${hora}:${minuto}:${segundo}`;
}

// Nova função: Exibe confirmação para limpar o log
function confirmClearLog() {
    let logs = JSON.parse(localStorage.getItem("historicoLog") || "[]");
    if (logs.length === 0) {
        mostrarPopup("Nenhum log para limpar!");
        return;
    }

    const popup = document.getElementById("popup");
    popup.innerHTML = `
        <div style="text-align:center;">
            <p>Deseja mesmo limpar o log?</p>
            <button id="confirmYes">Sim</button>
            <button id="confirmNo">Não</button>
        </div>
    `;
    popup.style.display = "block";
    popup.classList.add("show");

    document.getElementById("confirmYes").addEventListener("click", () => {
        clearLog();
        popup.classList.remove("show");
        setTimeout(() => {
            popup.style.display = "none";
        }, 1000);
    });

    document.getElementById("confirmNo").addEventListener("click", () => {
        popup.classList.remove("show");
        setTimeout(() => {
            popup.style.display = "none";
            popup.textContent = ""; // Limpa o conteúdo modificado
        }, 1000);
    });
}

// Nova função: Limpa o log do localStorage e atualiza a área de log
function clearLog() {
    localStorage.removeItem("historicoLog");
    exibirLog();
    mostrarPopup("Log limpo!");
}

// Nova variável global para pausado
let isCountdownPaused = false;

// Função que atualiza o display do countdown com formatação dinâmica
function updateCountdownDisplay() {
    const countdown = document.getElementById("countdown");
    if (isCountdownPaused) {
        countdown.textContent = "Pausado";
        return;
    }
    let totalSec = tempoRestante;
    let h = Math.floor(totalSec / 3600);
    let m = Math.floor((totalSec % 3600) / 60);
    let s = totalSec % 60;
    let display = "";
    if (h > 0) {
        display = String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
    } else if (m > 0) {
        display = String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
    } else {
        display = String(s);
    }
    countdown.textContent = display;
}

// Atualiza o countdown quando clicado para pausar/despausar
document.getElementById("countdown").style.cursor = "pointer"; // Exibe ponteiro
document.getElementById("countdown").addEventListener("click", () => {
    isCountdownPaused = !isCountdownPaused;
    updateCountdownDisplay();
});

// Nova função: Alterna tela cheia
function toggleFullscreen() {
    const btn = document.getElementById("fullscreenButton");
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
            btn.textContent = "✖"; // Muda para X para sair do fullscreen
        }).catch((err) => {
            console.log("Erro ao entrar em fullscreen:", err);
        });
    } else {
        document.exitFullscreen().then(() => {
            btn.textContent = "⛶"; // Volta para o ícone inicial
        }).catch((err) => {
            console.log("Erro ao sair do fullscreen:", err);
        });
    }
}

// Adiciona um event listener para detectar quando sai do fullscreen
document.addEventListener("fullscreenchange", () => {
    const btn = document.getElementById("fullscreenButton");
    if (!document.fullscreenElement) {
        btn.textContent = "⛶"; // Volta para o ícone inicial
    }
});

// Event listener para o botão fullscreen
document.getElementById("fullscreenButton").addEventListener("click", toggleFullscreen);

// Função para verificar se o dispositivo suporta tela cheia
function isFullscreenSupported() {
    return document.fullscreenEnabled || document.webkitFullscreenEnabled || document.mozFullScreenEnabled || document.msFullscreenEnabled;
}

// Nova função para enviar notificações do sistema
function enviarNotificacao(titulo, mensagem) {
    if (!notificacaoAtivada) return;

    if (!("Notification" in window)) return;

    const options = {
        body: mensagem,
        icon: 'resources/app/icon.ico', // Se tiver um ícone
        silent: true, // Não emite som próprio pois já temos nosso sistema de sons
        tag: 'monitor-internet', // Identifica unicamente a notificação
        requireInteraction: false, // Fecha automaticamente
        data: { application: 'Monitor de Internet' }
    };

    if (Notification.permission === "granted") {
        new Notification("Monitor de Internet - " + titulo, options);
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification("Monitor de Internet - " + titulo, options);
            }
        });
    }
}

async function verificarConexao(manual = false) {
    const statusElement = document.getElementById("status");
    const bodyElement = document.getElementById("body");
    const indicatorElement = document.getElementById("statusIndicator");

    if (manual || statusElement.textContent !== "Conectado à Internet") {
        statusElement.textContent = "Testando conexão...";
        bodyElement.style.background = "linear-gradient(180deg, orange, darkorange)";
        indicatorElement.className = "status-indicator toggleable testing";
    }
    tempoRestante = intervaloChecagem;

    try {
        if (!navigator.onLine) {
            throw new Error("Offline");
        }

        const response = await fetch('https://cloudflare.com/cdn-cgi/trace', {
            mode: 'no-cors',
            cache: 'no-store'
        });

        const novoStatus = "Conectado à Internet";

        if (novoStatus !== ultimoStatus && somAtivado && ultimoStatus !== "") {
            try { somOnline.play(); } catch (erro) { console.log("Erro ao reproduzir som online:", erro); }
        }
        if (ultimoStatus === "Sem conexão com a Internet" && novoStatus === "Conectado à Internet") {
            adicionarLogEntrada("Conexão voltou");
            enviarNotificacao("Conexão Restaurada", "Sua conexão com a Internet foi restabelecida.");
        }
        statusElement.textContent = novoStatus;
        bodyElement.style.background = "linear-gradient(180deg, green, darkgreen)";
        indicatorElement.className = "status-indicator toggleable online";
        ultimoStatus = novoStatus;

    } catch (error) {
        statusElement.textContent = "Testando conexão...";
        bodyElement.style.background = "linear-gradient(180deg, orange, dargorange)";
        indicatorElement.className = "status-indicator toggleable testing";

        setTimeout(() => {
            const novoStatus = "Sem conexão com a Internet";
            if (novoStatus !== ultimoStatus && somAtivado && ultimoStatus !== "") {
                try { somOffline.play(); } catch (erro) { console.log("Erro ao reproduzir som offline:", erro); }
            }
            if (ultimoStatus === "Conectado à Internet" && novoStatus === "Sem conexão com a Internet") {
                adicionarLogEntrada("Conexão caiu");
                enviarNotificacao("Conexão Perdida", "Sua conexão com a Internet foi interrompida.");
            }
            statusElement.textContent = novoStatus;
            bodyElement.style.background = "linear-gradient(180deg, red, darkred)";
            indicatorElement.className = "status-indicator toggleable offline";
            ultimoStatus = novoStatus;
        }, 500);
    }
}

// Modifica o setInterval para levar em conta a pausa e chamar updateCountdownDisplay
setInterval(() => {
    if (!isCountdownPaused) {
        tempoRestante--;
        updateCountdownDisplay();
        if (tempoRestante <= 0) {
            verificarConexao();
        }
    }
}, 1000);

window.addEventListener("click", (e) => {
    const config = document.getElementById("config");
    const button = document.getElementById("configButton");
    if (config.style.display === "block") {
        if (!config.contains(e.target) && e.target !== button) {
            config.style.display = "none";
        }
    }
});

// Ao carregar a página
window.addEventListener("load", () => {
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }
    carregarConfiguracoes();
    exibirLog();
    verificarConexao(true);
    atualizarExibicao();
    document.getElementById("toggleVisibilityButton").addEventListener("click", toggleVisibility);

    // Verifica se o dispositivo suporta tela cheia
    if (!isFullscreenSupported()) {
        document.getElementById("fullscreenButton").style.display = "none";
    }
});

function atualizarLogContainer() {
    const logContainer = document.getElementById('logContainer');
    const logs = Array.from(logContainer.children);

    if (logs.length === 0) {
        logContainer.style.display = 'none';
        return;
    }

    if (config.exibirTudo) {
        logContainer.style.display = 'block';
    } else {
        logContainer.style.display = 'none';
    }
}

function adicionarLog(mensagem) {
    if (!config.logStatus) return;

    const logContainer = document.getElementById('logContainer');
    const logItem = document.createElement('div');
    logItem.className = 'log-item';
    logItem.textContent = `${new Date().toLocaleString()} - ${mensagem}`;
    logContainer.appendChild(logItem);

    // Chama a função após adicionar um novo log
    atualizarLogContainer();

    salvarLogs();
}

function carregarLogs() {
    // ...existing code...

    // Adicione esta linha no final da função carregarLogs
    atualizarLogContainer();
}