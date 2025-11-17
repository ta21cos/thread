import { contextBridge } from 'electron';

// NOTE: Expose safe APIs to renderer process
// Currently minimal - can be extended later for native features
contextBridge.exposeInMainWorld('electron', {
  // NOTE: Platform detection
  platform: process.platform,
  // NOTE: Can add more APIs here later (e.g., file system, notifications)
});

// NOTE: Type declaration for renderer
declare global {
  interface Window {
    electron: {
      platform: NodeJS.Platform;
    };
  }
}
