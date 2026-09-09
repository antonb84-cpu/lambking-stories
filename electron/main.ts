import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join } from 'path'

// Donate / website CTAs must land in the user's real browser. Without this,
// an unhandled `window.open` gets a second BrowserWindow that inherits the
// kiosk flag and our preload — a payment page in a chromeless, menu-less
// window the user can't navigate or close. Mirrors the allow-list in
// `src/utils/openExternal.ts`.
const EXTERNAL_PROTOCOLS = new Set(['https:', 'http:', 'mailto:', 'tel:'])

function openExternally(url: string) {
  try {
    if (EXTERNAL_PROTOCOLS.has(new URL(url).protocol)) void shell.openExternal(url)
  } catch {
    // Not a URL the OS can take — drop it rather than hand it to the shell.
  }
}

function isAppUrl(url: string): boolean {
  const devUrl = process.env.ELECTRON_RENDERER_URL
  return devUrl ? url.startsWith(devUrl) : url.startsWith('file://')
}

function createWindow() {
  const win = new BrowserWindow({
    width: 970,
    height: 820,
    // Use join(__dirname, ...) to find the icon relative to the built main.js
    // Since main.js is in out/main/, we go up one level to find the assets
    icon: join(__dirname, '../../resources/icon.png'),
    kiosk: true,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js')
    }
  })

  win.setMenu(null)

  win.webContents.setWindowOpenHandler(({ url }) => {
    openExternally(url)
    return { action: 'deny' }
  })

  // Same treatment for a navigation that would replace the app document
  // itself (an `<a href>` whose target was stripped, a redirect).
  win.webContents.on('will-navigate', (event, url) => {
    if (isAppUrl(url)) return
    event.preventDefault()
    openExternally(url)
  })

  // In development, load from the dev server
  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    // In production, load the built index.html
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Only open DevTools if we aren't in production
  if (process.env.ELECTRON_RENDERER_URL) {
    win.webContents.openDevTools()
  }

  // Inside createWindow()
  win.on('enter-full-screen', () => {
    console.log('Entered Fullscreen')
  })

  // Add an IPC listener if you want to trigger it from your Vue button
  ipcMain.on('toggle-fullscreen', () => {
    const isFullScreen = win.isFullScreen()
    win.setFullScreen(!isFullScreen)
  })
}

app.whenReady().then(createWindow)


// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.on('quit-app', () => {
  app.quit()
})

ipcMain.on('open-external', (_event, url: unknown) => {
  if (typeof url === 'string') openExternally(url)
})