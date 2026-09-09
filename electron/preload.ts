import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  ping: () => 'pong',
  quitApp: () => ipcRenderer.send('quit-app'),
  toggleFullScreen: () => ipcRenderer.send('toggle-fullscreen'),
  // Hands an external URL to the OS browser via the main process; see
  // `src/utils/openExternal.ts`.
  openExternal: (url: string) => ipcRenderer.send('open-external', url)
})