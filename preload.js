console.log('✅ Preload carregado com sucesso!');

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    sendLog: (mensagem) => {
        console.log("📤 Enviando log para o main.js:", mensagem);
        ipcRenderer.send('save-log', mensagem);
    }
});