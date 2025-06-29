const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  
  // App info
  getVersion: () => ipcRenderer.invoke('app-get-version'),
  getPlatform: () => process.platform,
  
  // File operations (if needed)
  openFile: () => ipcRenderer.invoke('dialog-open-file'),
  saveFile: (content) => ipcRenderer.invoke('dialog-save-file', content),
  
  // Notifications
  showNotification: (title, body) => 
    ipcRenderer.invoke('show-notification', title, body),
  
  // Menu events
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-action', (event, action) => callback(action));
  },
  
  // Theme
  getSystemTheme: () => ipcRenderer.invoke('get-system-theme'),
  onThemeChange: (callback) => {
    ipcRenderer.on('theme-changed', (event, theme) => callback(theme));
  },
  
  // Auto-updater events (if implementing)
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', callback);
  },
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('update-downloaded', callback);
  },
  
  // Remove all listeners for cleanup
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

// Security: Remove any Node.js APIs from the window object
delete window.require;
delete window.exports;
delete window.module;

// Optional: Add development tools in development mode
if (process.env.NODE_ENV === 'development') {
  contextBridge.exposeInMainWorld('electronDev', {
    openDevTools: () => ipcRenderer.invoke('open-dev-tools'),
    reloadApp: () => ipcRenderer.invoke('reload-app')
  });
}