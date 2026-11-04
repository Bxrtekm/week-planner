const path = require('node:path')
const { app, BrowserWindow, dialog } = require('electron')
const { ensureBackend, stopBackend } = require('./backend')

// `||`, a nie `??`: pusta zmienna (BACKEND_PORT=) też oznacza port domyślny.
const BACKEND_PORT = Number(process.env.BACKEND_PORT || 8000)
const FRONTEND_URL = 'http://127.0.0.1:5173'
const backendDir = path.join(__dirname, '..', 'backend')

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'Week Planner',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  window.loadURL(FRONTEND_URL)
}

let quitting = false
app.on('before-quit', () => {
  quitting = true
})

app.whenReady().then(async () => {
  try {
    await ensureBackend({ port: BACKEND_PORT, backendDir })
  } catch (error) {
    // Ctrl+C w trakcie startu też przerywa backend — wtedy zamykamy się bez okna błędu.
    if (quitting) return
    dialog.showErrorBox('Nie udało się uruchomić backendu', error.message)
    stopBackend()
    // Kod 1, żeby `npm run dev` zgłosił porażkę.
    app.exit(1)
    return
  }
  if (!quitting) createWindow()
})

app.on('window-all-closed', () => app.quit())
app.on('will-quit', stopBackend)

// Ctrl+C w terminalu z `npm run dev` ma zamknąć aplikację razem z backendem.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => app.quit())
}
