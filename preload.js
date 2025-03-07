console.log('✅ Preload carregado com sucesso!');

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    limparLogsArquivo: () => ipcRenderer.send('limpar-logs-arquivo'),

    sendLog: (mensagem) => {
        if (mensagem && typeof mensagem === "object" && mensagem.time && mensagem.texto) {
            console.log("🔄️ Encaminhando Log para o main.js salvar no txt:", mensagem);
            ipcRenderer.send('save-log', JSON.stringify(mensagem)); // 🔹 Envia o objeto JSON corretamente
        } else {
            console.error("❌ Erro: sendLog recebeu um tipo de dado inesperado:", mensagem);
        }
    },

    getLogs: async () => await ipcRenderer.invoke('get-logs'),

    // 🔹 Adicionamos a funcionalidade de obter a versão do app
    getAppVersion: async () => await ipcRenderer.invoke('get-app-version')
});