console.log('Processo principal iniciado!');  // Exibe uma mensagem no console

// Importa as bibliotecas necessárias
const { app, BrowserWindow, nativeTheme, Menu } = require('electron'); // Importa as bibliotecas necessárias
const path = require('node:path'); // Importa a biblioteca path

let mainWindow;

// Cria a janela principal
const createWindow = () => {
  nativeTheme.themeSource = 'dark'; // Define o tema como dark pra janela
  mainWindow = new BrowserWindow ({
      width: 800,
      height: 600,
      //resizable: false, // Desabilita o redimensionamento da janela
      webPreferences: {
        nodeIntegration: false, // Mudado para false por segurança
        contextIsolation: true, // Mudado para true
        enableRemoteModule: true,
        webSecurity: true,
        devTools: false,  //desabilitar o DevTools (Desabilitar a ferramenta de desenvolvedor)
        preload: path.join(__dirname, 'preload.js')  // Mantido o caminho absoluto
      },
      icon: "resources/app/icon.ico", // Define o ícone da janela
      //autoHideMenuBar: true, // Oculta a barra de menu nativa
      //titleBarStyle: 'hidden' // Oculta a barra de título e menu
  })

  // Exibe o template do Menu personalizado
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));

  // Carrega o arquivo HTML local
  mainWindow.loadFile("index.html");

  // Captura quando a tecla ESC é pressionada e sai do modo tela cheia
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'Escape') {
        mainWindow.setFullScreen(false); // Sai do modo fullscreen
    }
  });

  // Abre a ferramenta de desenvolvedor com F12
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'F12') {
        mainWindow.webContents.toggleDevTools(); // Abre a ferramenta de desenvolvedor
    }
  });

}

// Janela "Sobre"
const aboutWindow = () => {
  const sobre = new BrowserWindow({
      width: 600,
      height: 500,
      webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          preload: path.join(__dirname, 'preload.js')
      },
      icon: "resources/app/icon.ico", // Define o ícone da janela
      autoHideMenuBar: true, // Oculta a barra de menu
  })

  sobre.loadFile("sobre.html");
}

// Cria a janela quando o aplicativo é iniciado
app.whenReady().then(() => {
    createWindow(); // Exibe a janela principal ao abrir o aplicativo
    //aboutWindow();

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

// Cria template do menu
const template = [
  {
    label: 'Menu',
    submenu: [
      {
        label: 'Sobre',
        click: () => {
          aboutWindow();
        }
      }
    ]
  },
  {
    label: 'Exibir',
    submenu: [
      {
        label: 'Recarregar',
        role: 'reload',
        accelerator: 'F5'
      },
      {
        label: 'Zoom +',
        role: 'zoomIn'
      },
      {
        label: 'Zoom -',
        role: 'zoomOut'
      },
      {
        label: 'Minimizar',
        role: 'minimize'
      },
      {
        label: 'Restaurar Zoom',
        role: 'resetZoom'
      },
      {
        label: 'Tela cheia',
        role: 'togglefullscreen'
      }
    ]
  },
  {
    label: 'Ajuda',
    submenu: [
      {
        label: 'Sobre',
        click: () => {
          aboutWindow();
        }
      },
      {
        type: 'separator'
      }
    ]
  },
  {
    label: 'Sair',
    accelerator: 'Alt+F4',
    click: () => {
      app.quit()
    }
  }
]