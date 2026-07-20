import { constants } from 'node:fs'
import { access } from 'node:fs/promises'
import { connect } from 'node:net'

const QA_HOST = '127.0.0.1'
const QA_PORT = 3100

function fail(message, remediation) {
  console.error(`[qa:browser:infra] ${message}`)
  console.error(`[qa:browser:infra] ${remediation}`)
  process.exitCode = 1
}

let chromium

try {
  chromium = (await import('@playwright/test')).chromium
} catch {
  fail('Playwright is not installed.', 'Run `npm ci` and retry `npm run qa:browser`.')
}

if (chromium) {
  try {
    await access(chromium.executablePath(), constants.X_OK)
  } catch {
    fail(
      'The project Chromium binary is missing or is not executable.',
      'Run `npx playwright install chromium` locally, or `npx playwright install --with-deps chromium` in CI.'
    )
  }
}

function inspectQaPort() {
  return new Promise((resolve, reject) => {
    const socket = connect({ host: QA_HOST, port: QA_PORT })

    socket.setTimeout(1_000)
    socket.once('connect', () => {
      socket.destroy()
      resolve('occupied')
    })
    socket.once('error', (error) => {
      socket.destroy()
      if (error.code === 'ECONNREFUSED') {
        resolve('available')
        return
      }
      reject(error)
    })
    socket.once('timeout', () => {
      socket.destroy()
      reject(new Error(`Timed out checking ${QA_HOST}:${QA_PORT}.`))
    })
  })
}

if (!process.exitCode && !process.env.PLAYWRIGHT_BASE_URL?.trim()) {
  try {
    const portState = await inspectQaPort()
    if (portState === 'occupied') {
      fail(
        `The fixed QA address ${QA_HOST}:${QA_PORT} is already in use.`,
        'Close the owning task normally and retry; do not choose another QA port or force-kill the process.'
      )
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    fail(
      `The environment cannot access the QA loopback address ${QA_HOST}:${QA_PORT}: ${detail}`,
      'Run outside the restricted sandbox or allow local server/browser networking, then retry.'
    )
  }
}
