const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1366,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: 'Infinix Math',
    backgroundColor: '#070b14',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the Next.js static export
  const indexPath = path.join(__dirname, '../out/index.html');
  mainWindow.loadFile(indexPath);

  // Open external links in user's default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Remove standard top menu bar for clean native application look
  mainWindow.removeMenu();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
