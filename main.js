const { app, BrowserWindow } = require('electron');
const { autoUpdater } = require("electron-updater");

let mainWindow;

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        },
        icon: "icon.png" // Define o ícone da janela
    });

    // Remove o menu padrão
    const { Menu } = require('electron');
    Menu.setApplicationMenu(null);

    // Carrega o arquivo HTML local
    mainWindow.loadFile("index.html");

    // Iniciar a verificação de atualizações
    autoUpdater.checkForUpdatesAndNotify();
});

// Eventos para exibir mensagens no console
autoUpdater.on("update-available", () => {
    console.log("Nova atualização disponível!");
  });
  
  autoUpdater.on("update-not-available", () => {
    console.log("Nenhuma atualização encontrada.");
  });
  
  autoUpdater.on("update-downloaded", () => {
    console.log("Atualização baixada. Reinicie o aplicativo para aplicar.");
  });