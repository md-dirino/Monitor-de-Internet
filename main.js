console.log('Processo principal iniciado!');  // Exibe uma mensagem no console

// Importa as bibliotecas necessárias
const { app, BrowserWindow, nativeTheme, Menu, dialog, ipcMain, Tray } = require('electron'); // Adicionado Tray às importações
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

const packageJsonPath = path.join(app.getAppPath(), 'package.json');

// Função para obter a versão da aplicação no package.json
function getAppVersion() {
  try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      return packageJson.version || "Versão não encontrada";
  } catch (error) {
      console.error("Erro ao ler a versão do package.json:", error);
      return "Desconhecida";
  }
}

let mainWindow;
let tray = null; // Nova variável global para armazenar a instância do tray

const logsDir = path.join(os.homedir(), 'Monitor de Internet arquivos');
const logsFile = path.join(logsDir, 'logs.txt');

// Garante que a pasta e o arquivo de logs existam
function ensureLogsFileExists() {
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }
    if (!fs.existsSync(logsFile)) {
        fs.writeFileSync(logsFile, '');  // Apenas cria o arquivo vazio
    }
}

// Função para salvar logs enviada pelo Renderer
ipcMain.on('save-log', (event, mensagemJson) => {
    try {
        console.log("Log recebido do renderer:", mensagemJson);

        const mensagemObj = JSON.parse(mensagemJson);

        if (!mensagemObj || typeof mensagemObj !== 'object' || !mensagemObj.time || !mensagemObj.texto) {
            throw new Error("JSON inválido recebido! Estrutura esperada: { time, texto }");
        }

        const { time, texto } = mensagemObj;
        const logEntry = `${new Date(time).toLocaleString()} - ${texto}\n`;

        // Lê o conteúdo atual do arquivo de logs
        let logsAtuais = '';
        if (fs.existsSync(logsFile)) {
            logsAtuais = fs.readFileSync(logsFile, 'utf-8');
        }

        // Adiciona o novo log no topo
        const novoConteudo = logEntry + logsAtuais;

        // Escreve o novo conteúdo no arquivo de logs
        fs.writeFileSync(logsFile, novoConteudo);
        console.log("Log salvo:", logEntry);
    } catch (error) {
        console.error("Erro ao salvar log:", error);
    }
});

// Listener para limpar os logs do arquivo
ipcMain.on('limpar-logs-arquivo', () => {
    try {
        fs.writeFileSync(logsFile, '');  // Limpa o conteúdo do arquivo de logs
        console.log('Logs do arquivo "logs.txt" foram limpos.');
    } catch (error) {
        console.error("Erro ao limpar logs do arquivo:", error);
    }
});

// Função para converter datas no formato "DD/MM/YYYY, HH:MM:SS" para timestamp correto
function converterDataHora(dataHora) {
  const regex = /^(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2})$/;
  const match = dataHora.match(regex);

  if (match) {
      const [, dia, mes, ano, hora, minuto, segundo] = match;
      const dataFormatada = `${ano}-${mes}-${dia}T${hora}:${minuto}:${segundo}`;
      return Date.parse(dataFormatada);
  }
  
  console.error(`Formato de data inválido: ${dataHora}`);
  return NaN;
}

// Função para ler logs do arquivo e converter corretamente para JSON
function lerLogsDoArquivo() {
  try {
      if (fs.existsSync(logsFile)) {
          const logs = fs.readFileSync(logsFile, 'utf-8'); // Garante leitura UTF-8 correta
          return logs.split('\n').filter(log => log.trim() !== '').map(log => {
              const match = log.match(/^(.+?) - (.+)$/); // Captura a data/hora e a mensagem
              if (match) {
                  const dataHora = match[1].trim();
                  const texto = match[2].trim();

                  // Usar a função de conversão corrigida
                  const timestamp = converterDataHora(dataHora);
                  if (!isNaN(timestamp)) {
                      return { time: timestamp, texto };
                  } else {
                      console.error(`Erro ao converter data corrigida: ${dataHora}`);
                  }
              }
              return null; // Ignorar linhas inválidas
          }).filter(log => log !== null);
      }
  } catch (error) {
      console.error("Erro ao ler logs do arquivo:", error);
  }
  return [];
}

// Envia os logs para o renderer process quando solicitado
ipcMain.handle('get-logs', () => {
  const logs = lerLogsDoArquivo();
  console.log("Enviando logs para exibicao (renderer):", logs);
  return logs;
});

// Função para criar o ícone na bandeja do sistema
function createTray() {
    const iconPath = path.join(__dirname, 'resources/app/icon.ico');
    tray = new Tray(iconPath);
    
    tray.setToolTip('Monitor de Internet');
    
    tray.on('click', () => {
        // Exibe a janela principal ao clicar no ícone da bandeja
        if (mainWindow === null) {
            createWindow();
        } else {
            mainWindow.show();
        }
    });
    
    const contextMenu = Menu.buildFromTemplate([
        { 
            label: 'Abrir Monitor', 
            click: () => {
                if (mainWindow === null) {
                    createWindow();
                } else {
                    mainWindow.show();
                }
            }
        },
        { type: 'separator' },
        { 
            label: 'Sair', 
            click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);
    
    tray.setContextMenu(contextMenu);
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
      show: false // A janela é criada oculta inicialmente
  })

  // Exibe o template do Menu personalizado
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));

  // Carrega o arquivo HTML local
  mainWindow.loadFile("index.html");

  // Exibe a janela quando estiver pronta
  mainWindow.once('ready-to-show', () => {
      // Não mostra automaticamente na inicialização
  });

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

  // Recarrega a janela com F5
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'F5') {
        mainWindow.reload(); // Recarrega a janela
    }
  });

  // Intercepta o evento 'close' para minimizar em vez de fechar
  mainWindow.on('close', (event) => {
      if (!app.isQuitting) {
          event.preventDefault();
          mainWindow.hide();
          return false;
      }
      return true;
  });

  // Fecha o aplicativo quando a janela é fechada
  mainWindow.on('closed', () => {
      mainWindow = null;
  });

}

// Evento para exibir progresso do download
let progressWin = null; // Variável para armazenar a janela de progresso

// Evento para exibir progresso do download
autoUpdater.on('update-available', () => {
  dialog.showMessageBox({
      type: 'info',
      title: 'Atualização disponível',
      message: 'Uma nova versão está disponível. Deseja baixar agora?',
      buttons: ['Sim', 'Cancelar']
  }).then(result => {
      if (result.response === 0) { // Se o usuário clicar em "Sim"
          progressWin = new BrowserWindow({
              width: 400,
              height: 200,
              frame: false,
              alwaysOnTop: true,
              modal: true,
              show: false,
              webPreferences: {
                  nodeIntegration: true,
                  contextIsolation: false // Necessário para usar require no HTML
              }
          });

          // Conteúdo HTML da janela de progresso
            const htmlContent = `
              <html>
              <head>
                <title>Baixando atualização...</title>
                <style>
                  body { font-family: Arial, sans-serif; text-align: center; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                  .container { text-align: center; }
                  h2 { margin-bottom: 20px; }
                  #progress { width: 100%; height: 25px; background: #ddd; border-radius: 5px; overflow: hidden; }
                  #progress div { height: 100%; width: 0%; background: #4caf50; transition: width 0.2s; }
                </style>
              </head>
              <body>
                <div class="container">
                  <h2>Baixando atualização...</h2>
                  <div id="progress"><div></div></div>
                  <p id="progress-text">0%</p>
                </div>
                <script>
                  require('electron').ipcRenderer.on('download-progress', (event, progress) => {
                    document.getElementById('progress').children[0].style.width = progress + '%';
                    document.getElementById('progress-text').innerText = progress + '%';
                  });
                </script>
              </body>
              </html>
            `;

          // Carrega o HTML codificado para garantir a exibição correta
          progressWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));

          progressWin.once('ready-to-show', () => {
              progressWin.show();
          });

          autoUpdater.downloadUpdate(); // Começa o download da atualização
      }
  });
});

// Evento para atualizar a barra de progresso
autoUpdater.on('download-progress', (progressObj) => {
  if (progressWin) {
      progressWin.webContents.send('download-progress', progressObj.percent.toFixed(2));
  }
});

// Quando o download for concluído, fechar a janela e instalar a atualização
autoUpdater.on('update-downloaded', () => {
  if (progressWin) {
      progressWin.close();
      progressWin = null;
  }

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
    ensureLogsFileExists(); // Garante que a pasta e o arquivo de logs existam
    createTray(); // Cria o ícone na bandeja do sistema
    createWindow(); // Cria a janela principal, mas ela não será exibida
    //aboutWindow();

    // Configura o aplicativo para iniciar junto com o Windows, exibindo o widget automaticamente
    if (app.isPackaged) { // Executa apenas em ambiente de produção
        app.setLoginItemSettings({
            openAtLogin: true,                     // abre o app ao iniciar o sistema
            path: app.getPath('exe'),              // caminho do executável gerado pelo Electron
        });
    }

    // Cria o menu da aplicação
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });

    ipcMain.handle('get-app-version', async () => {
      return getAppVersion();
    });

    autoUpdater.checkForUpdates(); // Verifica por atualizações ao iniciar o app
  
});

// Adiciona uma flag para controlar o comportamento de saída
app.isQuitting = false;

// Fecha a janela quando o aplicativo é fechado
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Limpa a variável tray quando o app é encerrado
app.on('before-quit', () => {
    app.isQuitting = true;
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