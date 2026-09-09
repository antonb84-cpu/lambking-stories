export interface IElectronAPI {
  quitApp: () => void
  /** Opens an external URL in the user's default browser (Electron only). */
  openExternal?: (url: string) => void
}

declare global {
  interface Window {
    // Only defined in the Electron desktop build — the web, Android and iOS
    // builds have no bridge, so every read must be optional.
    electronAPI?: IElectronAPI
  }
}