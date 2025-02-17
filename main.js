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
        icon: "resources/app/icon.ico" // Define o ícone da janela
    });

    // Remove o menu padrão
    const { Menu } = require('electron');
    Menu.setApplicationMenu(null);

    // Carrega o arquivo HTML local
    mainWindow.loadFile("index.html");
});