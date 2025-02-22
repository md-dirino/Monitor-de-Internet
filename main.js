console.log('Processo principal iniciado!');  // Exibe uma mensagem no console

// Importa as bibliotecas necessárias
const { app, BrowserWindow, nativeTheme, Menu, dialog } = require('electron'); // Importa as bibliotecas necessárias
const { autoUpdater, AppUpdater } = require('electron-updater'); // Importa a biblioteca de atualização

const path = require('node:path'); // Importa a biblioteca path
const log = require('electron-log'); // Importa a biblioteca de log
const fs = require('fs');
const os = require('os');

// Configurar logs para depuração
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

// Configuração de atualização automática
autoUpdater.autoDownload = false; // O download só começa quando o usuário clicar em "Sim"
autoUpdater.autoInstallOnAppQuit = true; // A atualização será instalada ao fechar o app

// URL de atualizações (verifique se está correto)
const server = 'https://update.electronjs.org';
const feed = `${server}/md-dirino/Monitor-de-Internet/${process.platform}-${process.arch}/${app.getVersion()}`;

//autoUpdater.setFeedURL({ provider: 'github' });

app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');

let mainWindow;

const logsDir = path.join(os.homedir(), 'Monitor de Internet arquivos');
const logsFile = path.join(logsDir, 'logs.txt');

function ensureLogsFileExists() {
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }
    if (!fs.existsSync(logsFile)) {
        fs.writeFileSync(logsFile, '');
        const logs = JSON.parse(localStorage.getItem('historicoLog')) || [];
        logs.forEach(log => {
            fs.appendFileSync(logsFile, `${formatarData(log.time)} - ${log.texto}\n`);
        });
    }
}

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
      autoHideMenuBar: true, // Oculta a barra de menu nativa
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

// Eventos do autoUpdater
autoUpdater.on('update-available', () => {
  dialog.showMessageBox({
      type: 'info',
      title: 'Atualização disponível',
      message: 'Uma nova versão está disponível. Deseja baixar agora?',
      buttons: ['Sim', 'Cancelar']
  }).then(result => {
      if (result.response === 0) { // Se o usuário clicar em "Sim"
          dialog.showMessageBox({
              type: 'info',
              title: 'Baixando atualização...',
              message: 'Aguarde enquanto a nova versão está sendo baixada...',
          });
          autoUpdater.downloadUpdate(); // Inicia o download manualmente
      }
  });
});

// Evento para exibir progresso do download
autoUpdater.on('download-progress', (progressObj) => {
  dialog.showMessageBox({
      type: 'info',
      title: 'Baixando atualização...',
      message: `Progresso: ${progressObj.percent.toFixed(2)}%`,
      buttons: ['OK']
  });
});

// Quando o download for concluído, exibe a mensagem de instalação
autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox({
      type: 'info',
      title: 'Atualização pronta',
      message: 'A atualização foi baixada. O aplicativo será reiniciado para aplicar as alterações.',
  }).then(() => {
      autoUpdater.quitAndInstall();
  });
});

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
    ensureLogsFileExists();
    //aboutWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });

    autoUpdater.checkForUpdates(); // Verifica por atualizações ao iniciar o app
  
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