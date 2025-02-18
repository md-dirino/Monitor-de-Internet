let ultimoStatus = "";
let intervaloChecagem = parseInt(localStorage.getItem("tempoChecagem")) || 30;
let somAtivado = localStorage.getItem("somNotificacao") !== "false";
let tempoRestante = intervaloChecagem;

let logAtivado = localStorage.getItem("logStatus") !== "false"; 
let manterLogDias = parseInt(localStorage.getItem("manterLogDias")) || 90;
let exibirInfos = localStorage.getItem("exibirTudo") !== "false"; // nova config

const somOnline = new Audio("https://www.fesliyanstudios.com/play-mp3/387");
const somOffline = new Audio("https://www.fesliyanstudios.com/play-mp3/6728");

function toggleConfig() {
    const config = document.getElementById("config");
    // Se já está visível, oculta; caso contrário, mostra
    config.style.display = (config.style.display === "block") ? "none" : "block";
}

function salvarConfiguracoes() {
    const tempo = document.getElementById("tempoChecagem").value;
    const som = document.getElementById("somNotificacao").checked;
    const logStatusCheck = document.getElementById("logStatus").checked;
    const manterLogDiasValue = document.getElementById("manterLogDias").value;
    const exibirTudoCheck = document.getElementById("exibirTudo").checked;

    localStorage.setItem("tempoChecagem", tempo);
    localStorage.setItem("somNotificacao", som);
    localStorage.setItem("logStatus", logStatusCheck);
    localStorage.setItem("manterLogDias", manterLogDiasValue);
    localStorage.setItem("exibirTudo", exibirTudoCheck);

    intervaloChecagem = parseInt(tempo);
    somAtivado = som;
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
    const countdown = document.getElementById("countdown");
    const configButton = document.getElementById("configButton");
    const logContainer = document.getElementById("logContainer");
    const exibirBtn = document.getElementById("exibirButton");
    const popup = document.getElementById("popup");

    if (exibirInfos) {
        // Exibe
        countdown.style.display = "block";
        configButton.style.display = "block";
        popup.style.display = "none"; // O popup aparece só quando necessário
        // Se log estiver ativado, exibe; caso contrário, oculta
        if (logAtivado) {
            logContainer.style.display = "block";
        } else {
            logContainer.style.display = "none";
        }
        // Oculta o botão "Exibir"
        exibirBtn.style.display = "none";
    } else {
        // Oculta
        countdown.style.display = "none";
        configButton.style.display = "none";
        logContainer.style.display = "none";
        popup.style.display = "none";
        // Mostra o botão "Exibir"
        exibirBtn.style.display = "block";
    }
}

// Botão "Exibir" no rodapé que reverte o estado
function toggleExibir() {
    exibirInfos = true;
    localStorage.setItem("exibirTudo", true);
    atualizarExibicao();
}

async function testarConexaoManual() {
    verificarConexao(true);
}

function adicionarLogEntrada(mensagem) {
    if (!logAtivado) return;
    let logs = JSON.parse(localStorage.getItem("historicoLog")) || [];
    logs = limparLogAntigo(logs);
    const novaEntrada = {
        time: Date.now(),
        texto: mensagem
    };
    logs.unshift(novaEntrada);
    localStorage.setItem("historicoLog", JSON.stringify(logs));
    exibirLog();
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
function exibirLog() {
    const logContainer = document.getElementById("logContainer");
    if (!logAtivado) {
        // Se o log não estiver ativado, esconde e não monta nada
        logContainer.style.display = "none";
        return;
    }
    // Se estiver ativado, exibe (caso exibirInfos seja true)
    if (exibirInfos) {
        logContainer.style.display = "block";
    }

    let logs = JSON.parse(localStorage.getItem("historicoLog")) || [];
    logs = limparLogAntigo(logs);
    localStorage.setItem("historicoLog", JSON.stringify(logs));

    // Ordena do mais antigo para o mais novo para agrupar
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
                // Datas iguais: "17/02/2025 - 20:18:48 → 20:24:25 (por 6m)"
                html += `<div class="log-item">${diaCaiu} - ${horaCaiu} → ${horaVoltou} (por ${diffStr})</div>`;
            } else {
                // Datas diferentes: "17/02/2025 - 20:18:48 → 18/02/2025 20:24:25 (por 1d)"
                html += `<div class="log-item">${diaCaiu} - ${horaCaiu} → ${diaVoltou} ${horaVoltou} (por ${diffStr})</div>`;
            }
        } else if (grupo.caiu && !grupo.voltou) {
            const dataCaiu = new Date(grupo.caiu.time);
            html += `<div class="log-item">[${formatarData(dataCaiu.getTime())}] ${grupo.caiu.texto}</div>`;
        } else if (!grupo.caiu && grupo.voltou) {
            const dataVoltou = new Date(grupo.voltou.time);
            html += `<div class="log-item">[${formatarData(dataVoltou.getTime())}] ${grupo.voltou.texto}</div>`;
        }
    }

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

async function verificarConexao(manual = false) {
    const statusElement = document.getElementById("status");
    const bodyElement = document.getElementById("body");

    if (manual || statusElement.textContent !== "Conectado à Internet") {
        statusElement.textContent = "Testando conexão...";
        bodyElement.style.backgroundColor = "orange";
    }
    tempoRestante = intervaloChecagem;

    try {
        await fetch("https://www.google.com", { mode: "no-cors" });
        const novoStatus = "Conectado à Internet";

        if (novoStatus !== ultimoStatus && somAtivado && ultimoStatus !== "") {
            try { somOnline.play(); } catch (erro) { console.log("Erro ao reproduzir som online:", erro); }
        }
        if (ultimoStatus === "Sem conexão com a Internet" && novoStatus === "Conectado à Internet") {
            adicionarLogEntrada("Conexão voltou");
        }
        statusElement.textContent = novoStatus;
        bodyElement.style.backgroundColor = "green";
        ultimoStatus = novoStatus;

    } catch (error) {
        statusElement.textContent = "Testando conexão...";
        bodyElement.style.backgroundColor = "orange";

        setTimeout(() => {
            const novoStatus = "Sem conexão com a Internet";
            if (novoStatus !== ultimoStatus && somAtivado && ultimoStatus !== "") {
                try { somOffline.play(); } catch (erro) { console.log("Erro ao reproduzir som offline:", erro); }
            }
            if (ultimoStatus === "Conectado à Internet" && novoStatus === "Sem conexão com a Internet") {
                adicionarLogEntrada("Conexão caiu");
            }
            statusElement.textContent = novoStatus;
            bodyElement.style.backgroundColor = "red";
            ultimoStatus = novoStatus;
        }, 500);
    }
}

setInterval(() => {
    tempoRestante--;
    document.getElementById("countdown").textContent =
        `${String(Math.floor(tempoRestante / 60)).padStart(2, '0')}:${String(tempoRestante % 60).padStart(2, '0')}`;
    if (tempoRestante <= 0) {
        verificarConexao();
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

window.addEventListener("load", () => {
    carregarConfiguracoes();
    exibirLog();
    verificarConexao(true);
    atualizarExibicao();
});