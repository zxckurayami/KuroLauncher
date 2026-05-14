const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

const repoRoot = path.join(__dirname, '..')
const isWin = process.platform === 'win32'
const localElectron = path.join(repoRoot, 'node_modules', '.bin', isWin ? 'electron.cmd' : 'electron')
const electronEnv = { ...process.env }
delete electronEnv.ELECTRON_RUN_AS_NODE

function spawnElectron(cmd, args, opts = {}) {
  const child = spawn(cmd, args, { stdio: 'inherit', env: electronEnv, ...opts })
  child.on('close', (code) => process.exit(code))
  child.on('error', (err) => {
    console.error('Failed to start Electron:', err)
    process.exit(1)
  })
}

if (fs.existsSync(localElectron)) {
  // On Windows the .cmd wrapper needs a shell to be executed correctly.
  const opts = {}
  if (isWin) opts.shell = true
  spawnElectron(localElectron, ['.'], opts)
} else {
  // Fallback: try global `electron` first, then `npx electron`.
  const tryGlobal = spawn('electron', ['.'], { stdio: 'inherit', shell: isWin, env: electronEnv })
  tryGlobal.on('close', (code) => process.exit(code))
  tryGlobal.on('error', () => {
    console.log('Global electron not found, trying npx...')
    const npx = spawn('npx', ['electron', '.'], { stdio: 'inherit', shell: true, env: electronEnv })
    npx.on('close', (code) => process.exit(code))
    npx.on('error', (err) => {
      console.error('Failed to start Electron via npx:', err)
      process.exit(1)
    })
  })
}
