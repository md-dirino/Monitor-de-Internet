const { contentBridge } = require('electron');

// processos
contentBridge.exposeInMainWorld('api', {
    verElectron: () => process.versions.electron,
});