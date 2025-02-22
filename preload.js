console.log('✅ Preload carregado com sucesso!');

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    limparLogsArquivo: () => ipcRenderer.send('limpar-logs-arquivo'),

    sendLog: (mensagem) => {
        if (typeof mensagem === "string") {
            const logData = { time: Date.now(), texto: mensagem };
            console.log("📤 Enviando log para o main.js:", logData);
            ipcRenderer.send('save-log', JSON.stringify(logData)); // 🔹 Agora enviando um JSON correto
        } else {
            console.error("❌ Erro: sendLog recebeu um tipo de dado inesperado:", mensagem);
        }
    },

    getLogs: async () => await ipcRenderer.invoke('get-logs')
});