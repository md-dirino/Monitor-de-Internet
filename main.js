console.log('Processo principal iniciado!');  // Exibe uma mensagem no console
console.log(`Electron: ${process.versions.electron}`); // Exibe a versão do Electron no console
console.log(`Node: ${process.versions.node}`); // Exibe a versão do Node.js no console
console.log(`Chrome: ${process.versions.chrome}`); // Exibe a versão do Chrome no console
console.log(`V8: ${process.versions.v8}`); // Exibe a versão do V8 no console
console.log(`Sistema Operacional: ${process.platform}`); // Exibe o sistema operacional no console

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
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
        webSecurity: true,
        //devTools: false  //desabilitar o DevTools (Desabilitar a ferramenta de desenvolvedor)
      },
      icon: "resources/app/icon.ico", // Define o ícone da janela
      //autoHideMenuBar: true, // Oculta a barra de menu nativa
      //titleBarStyle: 'hidden' // Oculta a barra de título e menu
      webPreferences: {
        preload: path.join(__dirname, 'preload.js')
      } // Carrega o arquivo preload.js
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

}

// Janela "Sobre"
const aboutWindow = () => {
  const sobre = new BrowserWindow({
      width: 600,
      height: 500,
      webPreferences: {
          nodeIntegration: true
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
      },
      {
        label: 'Ferramenta do desenvolvedor',
        role: 'toggleDevTools',
        accelerator: 'F12'
      }
    ]
  },
  {
    label: 'Sair',
    click: () => {
      app.quit()
      //accelerator: 'Alt+F4'
    }
  }
]