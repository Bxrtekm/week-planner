const { spawn } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const HEALTH_TIMEOUT_MS = 15000
const HEALTH_INTERVAL_MS = 300
const STDERR_TAIL_LINES = 20

// Proces backendu uruchomiony przez Electron. Backend działający wcześniej
// (np. `uvicorn --reload` odpalony ręcznie) nie jest tu zapamiętywany.
let backendProcess = null

async function isHealthy(port) {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/health`, {
      signal: AbortSignal.timeout(1000),
    })
    return response.status === 200
  } catch {
    return false
  }
}

function pythonPath(backendDir) {
  const relative = process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python'
  return path.join(backendDir, '.venv', relative)
}

async function ensureBackend({ port, backendDir }) {
  if (await isHealthy(port)) {
    console.log(`[backend] używam działającego backendu na porcie ${port}`)
    return
  }

  const python = pythonPath(backendDir)
  if (!fs.existsSync(python)) {
    throw new Error(
      'Nie znaleziono backend/.venv — wykonaj kroki z README, sekcja Backend.',
    )
  }

  console.log(`[backend] uruchamiam uvicorn na porcie ${port}`)
  const child = spawn(
    python,
    ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', String(port)],
    {
      cwd: backendDir,
      windowsHide: true,
      stdio: ['ignore', 'inherit', 'pipe'],
      // Bez tego Python na Windowsie pisze stderr w stronie kodowej systemu (np. cp1250)
      // i polskie znaki w komunikatach błędów są nieczytelne.
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
    },
  )
  backendProcess = child

  // uvicorn loguje na stderr: przekazujemy go do terminala i trzymamy ogon do komunikatów błędów.
  const stderrTail = []
  child.stderr.setEncoding('utf8')
  child.stderr.on('data', (chunk) => {
    process.stderr.write(chunk)
    stderrTail.push(...chunk.split(/\r?\n/).filter(Boolean))
    stderrTail.splice(0, Math.max(0, stderrTail.length - STDERR_TAIL_LINES))
  })
  const withTail = (message) =>
    stderrTail.length ? `${message}\n\n${stderrTail.join('\n')}` : message

  child.once('exit', () => {
    if (backendProcess === child) backendProcess = null
  })

  await new Promise((resolve, reject) => {
    let settled = false
    const finish = (error) => {
      if (settled) return
      settled = true
      clearInterval(poll)
      clearTimeout(deadline)
      if (error) reject(error)
      else resolve()
    }

    child.once('error', (err) =>
      finish(new Error(`Nie udało się uruchomić backendu: ${err.message}`)),
    )
    child.once('exit', (code) =>
      finish(new Error(withTail(`Backend zakończył działanie (kod ${code}).`))),
    )
    const poll = setInterval(async () => {
      if (await isHealthy(port)) finish()
    }, HEALTH_INTERVAL_MS)
    const deadline = setTimeout(() => {
      stopBackend()
      finish(new Error(withTail('Backend nie odpowiedział w ciągu 15 s.')))
    }, HEALTH_TIMEOUT_MS)
  })
}

function stopBackend() {
  if (backendProcess) {
    backendProcess.kill()
    backendProcess = null
  }
}

module.exports = { ensureBackend, stopBackend }
