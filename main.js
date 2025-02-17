const { app, BrowserWindow, nativeTheme } = require('electron'); // Importa as bibliotecas necessárias

let mainWindow;

// Cria a janela
const createWindow = () => {
  nativeTheme.themeSource = 'dark'; // Define o tema como dark pra janela
  mainWindow = new BrowserWindow ({
      width: 800,
      height: 600,
      //resizable: false, // Desabilita o redimensionamento da janela
      webPreferences: {
          nodeIntegration: true
      },
      icon: "resources/app/icon.ico", // Define o ícone da janela
      autoHideMenuBar: true, // Oculta a barra de menu
      //titleBarStyle: 'hidden' // Oculta a barra de título e menu
  })

  // Carrega o arquivo HTML local
  mainWindow.loadFile("index.html");                                            
};

// Cria a janela quando o aplicativo é iniciado
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

// Fecha a janela quando o aplicativo é fechado
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});