const { app, BrowserWindow } = require('electron');

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
});