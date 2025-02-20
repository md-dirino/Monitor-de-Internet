const { contextBridge, ipcRenderer } = require('electron')

// Exponha funcionalidades protegidas para o processo de renderização
contextBridge.exposeInMainWorld(
    'api', {
        // Coloque aqui as funções que você quer disponibilizar para o frontend
        // Por exemplo:
        ping: () => ipcRenderer.send('ping'),
        // Adicione outras funções conforme necessário
    }
)