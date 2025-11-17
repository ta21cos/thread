import { app, BrowserWindow } from 'electron';
import path from 'path';

// NOTE: Track window instance
let mainWindow: BrowserWindow | null = null;

// NOTE: Create main application window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // NOTE: Security - disable Node.js in renderer
      nodeIntegration: false,
      // NOTE: Security - isolate preload context
      contextIsolation: true,
      // NOTE: Load preload script
      preload: path.join(__dirname, '../preload/index.js'),
    },
  });

  // NOTE: Load React app
  // In development: load from Vite dev server
  // In production: load from built files
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // NOTE: Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// NOTE: App lifecycle
app.whenReady().then(createWindow);

// NOTE: Quit when all windows closed (except macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// NOTE: macOS - re-create window when dock icon clicked
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
