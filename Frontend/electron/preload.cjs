// electron/preload.cjs
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('__electron', {
  // Renderer can call this to open folder dialog
  selectFolder: () => ipcRenderer.invoke('select-folder')
});
