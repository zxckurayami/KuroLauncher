const { app, BrowserWindow, ipcMain, Menu, shell } = require('electron')
const path = require('path')
const fs = require('fs').promises
const fsSync = require('fs')
const os = require('os')
const crypto = require('crypto')
const { execFile } = require('child_process')
const { promisify } = require('util')
const { finished } = require('stream/promises')
const axios = require('axios')
const { Client, Authenticator } = require('minecraft-launcher-core')
const { installFabric, getLoaderArtifactListFor, getForgeVersionList, installForge, getQuiltLoaderVersionsByMinecraft, installQuiltVersion, installNeoForged } = require('@xmcl/installer')
const AdmZip = require('adm-zip')
const http = require('http')
const url = require('url')
const execFileAsync = promisify(execFile)

// Paths will be initialized when app is ready
let userData, minecraftPath, versionsPath, profilesPath, settingsPath, authPath, modsPath, shaderpacksPath, resourcepacksPath, modpacksPath, modrinthCachePath
const defaultLauncherSettings = {
  theme: 'dark',
  javaPath: 'java',
  ram: 'auto',
  accent: 'red',
  fullscreen: false,
  kuroBoost: true,
  kuroBoostPreset: 'ai',
  profileName: '',
  profileStatus: '',
  avatarDataUrl: ''
}
const verboseLaunchLogging = process.env.KURO_DEBUG_LAUNCH === '1'
let mainWindow = null
let currentDevServerPort = null
let minecraftProcessActive = false
let mainWindowShownAt = 0
const STARTUP_CLOSE_GUARD_MS = 1500

function broadcastLaunchProgress(payload = {}) {
  try {
    mainWindow?.webContents.send('launcher:launchProgress', payload)
  } catch {}
  return payload
}

async function loadRendererUrl(targetWindow) {
  if (!targetWindow) return

  if (!app.isPackaged) {
    const port = currentDevServerPort || 4173
    await targetWindow.loadURL(`http://localhost:${port}`)
    return
  }

  await targetWindow.loadFile(path.join(__dirname, '../dist/index.html'))
}

async function ensureStorage() {
  await fs.mkdir(userData, { recursive: true })
  await fs.mkdir(minecraftPath, { recursive: true })
  await fs.mkdir(versionsPath, { recursive: true })
  await fs.mkdir(modsPath, { recursive: true })
  await fs.mkdir(shaderpacksPath, { recursive: true })
  await fs.mkdir(resourcepacksPath, { recursive: true })
  await fs.mkdir(modpacksPath, { recursive: true })
  if (!fsSync.existsSync(profilesPath)) await fs.writeFile(profilesPath, '[]')
  if (!fsSync.existsSync(settingsPath)) await fs.writeFile(settingsPath, JSON.stringify(defaultLauncherSettings, null, 2))
  if (!fsSync.existsSync(authPath)) await fs.writeFile(authPath, JSON.stringify({}), 'utf-8')
  if (!fsSync.existsSync(modrinthCachePath)) await fs.writeFile(modrinthCachePath, JSON.stringify({}, null, 2), 'utf-8')
}

// IPC handlers for skin management
ipcMain.handle('launcher:saveSkin', async (event, profileId, base64Data) => {
  try {
    const skinsDir = path.join(userData, 'skins')
    await fs.mkdir(skinsDir, { recursive: true })
    // base64Data may be a data URL or raw base64
    let raw = base64Data
    if (typeof raw === 'string' && raw.startsWith('data:')) {
      raw = raw.split(',', 2)[1]
    }
    const buf = Buffer.from(raw || '', 'base64')
    const filename = `${profileId}.png`
    const destination = path.join(skinsDir, filename)
    await fs.writeFile(destination, buf)
    const url = skinServerPort ? `http://127.0.0.1:${skinServerPort}/skins/${filename}` : null
    return { ok: true, url }
  } catch (e) {
    console.error('Failed to save skin:', e && e.message)
    return { ok: false, error: e && e.message }
  }
})

ipcMain.handle('launcher:getSkinUrl', async (event, profileId) => {
  try {
    const filename = `${profileId}.png`
    const filePath = path.join(userData, 'skins', filename)
    if (fsSync.existsSync(filePath) && skinServerPort) {
      return `http://127.0.0.1:${skinServerPort}/skins/${filename}`
    }
    return null
  } catch (e) {
    return null
  }
})

ipcMain.handle('launcher:openExternal', async (_event, targetUrl) => {
  try {
    const parsed = new URL(String(targetUrl || ''))
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { ok: false, error: 'unsupported_protocol' }
    }

    await shell.openExternal(parsed.toString())
    return { ok: true }
  } catch (e) {
    console.error('Failed to open external link:', e && e.message)
    return { ok: false, error: e && e.message }
  }
})

// Simple local HTTP server to serve saved skins from userData/skins
let skinServer = null
let skinServerPort = null
async function startSkinServer() {
  try {
    const skinsDir = path.join(userData, 'skins')
    await fs.mkdir(skinsDir, { recursive: true })

    skinServer = http.createServer((req, res) => {
      try {
        const parsed = url.parse(req.url || '')
        if (!parsed || !parsed.pathname) {
          res.statusCode = 404
          return res.end('Not found')
        }
        const parts = parsed.pathname.split('/')
        // Expect URL like /skins/<filename>
        if (parts.length !== 3 || parts[1] !== 'skins') {
          res.statusCode = 404
          return res.end('Not found')
        }
        const filename = path.basename(parts[2])
        const filePath = path.join(skinsDir, filename)
        if (!fsSync.existsSync(filePath)) {
          res.statusCode = 404
          return res.end('Not found')
        }
        const stream = fsSync.createReadStream(filePath)
        res.setHeader('Content-Type', 'image/png')
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
        res.setHeader('Access-Control-Allow-Origin', '*')
        stream.pipe(res)
      } catch (e) {
        res.statusCode = 500
        res.end('Error')
      }
    })

    await new Promise((resolve, reject) => {
      skinServer.listen(0, '127.0.0.1')
      skinServer.once('listening', () => {
        try {
          skinServerPort = skinServer.address().port
        } catch { skinServerPort = null }
        console.log('Skin server listening on port', skinServerPort)
        resolve()
      })
      skinServer.once('error', (err) => reject(err))
    })
  } catch (e) {
    console.error('Failed to start skin server:', e && e.message)
    skinServer = null
    skinServerPort = null
  }
}

async function readJson(filePath, fallback) {
  try {
    const text = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(text)
  } catch {
    return fallback
  }
}

async function summarizeLatestCrashReport(gameDirectory) {
  try {
    const crashDir = path.join(gameDirectory, 'crash-reports')
    if (!fsSync.existsSync(crashDir)) return null

    const reports = await fs.readdir(crashDir, { withFileTypes: true })
    const latest = reports
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.txt'))
      .map((entry) => {
        const fullPath = path.join(crashDir, entry.name)
        const stat = fsSync.statSync(fullPath)
        return { fullPath, mtimeMs: stat.mtimeMs || 0 }
      })
      .sort((a, b) => b.mtimeMs - a.mtimeMs)[0]

    if (!latest) return null

    const content = await fs.readFile(latest.fullPath, 'utf-8')
    const lines = content.split(/\r?\n/)
    const descriptionLine = lines.find((line) => line.startsWith('Description:'))
    const exceptionLine = lines.find((line) => /^\w[\w.$]+(?:Exception|Error):/.test(line.trim()))
    const causedByLine = lines.find((line) => line.trim().startsWith('Caused by:'))

    const details = [
      descriptionLine ? descriptionLine.replace(/^Description:\s*/, '').trim() : '',
      causedByLine ? causedByLine.trim() : '',
      exceptionLine ? exceptionLine.trim() : ''
    ].filter(Boolean)

    return {
      path: latest.fullPath,
      message: details.length > 0 ? [...new Set(details)].join(' | ') : path.basename(latest.fullPath)
    }
  } catch (error) {
    console.warn('Failed to summarize crash report:', error && error.message)
    return null
  }
}

function getKuroLaunchLogPath(gameDirectory) {
  return path.join(gameDirectory, 'logs', 'kuro-launcher.log')
}

function redactLaunchLogText(value, authorization = null) {
  let text = String(value ?? '')
  const secrets = [
    authorization?.access_token,
    authorization?.client_token,
    authorization?.meta?.clientId
  ].filter((secret) => typeof secret === 'string' && secret.length > 4)

  for (const secret of secrets) {
    text = text.split(secret).join('<redacted>')
  }

  text = text.replace(/(--accessToken(?:=|\s+))\S+/g, '$1<redacted>')
  text = text.replace(/(--clientId(?:=|\s+))\S+/g, '$1<redacted>')
  text = text.replace(/("access_token"\s*:\s*")([^"]+)(")/g, '$1<redacted>$3')
  text = text.replace(/("client_token"\s*:\s*")([^"]+)(")/g, '$1<redacted>$3')
  return text
}

async function beginLaunchLog(gameDirectory, metadata = {}, authorization = null) {
  try {
    const logPath = getKuroLaunchLogPath(gameDirectory)
    await fs.mkdir(path.dirname(logPath), { recursive: true })
    const header = [
      '',
      '============================================================',
      `KuroLauncher launch ${new Date().toISOString()}`,
      redactLaunchLogText(JSON.stringify(metadata, null, 2), authorization),
      '============================================================',
      ''
    ].join('\n')
    await fs.writeFile(logPath, header, 'utf-8')
    return logPath
  } catch (error) {
    console.warn('Failed to create KuroLauncher launch log:', error && error.message)
    return null
  }
}

function appendLaunchLog(logPath, stream, message, authorization = null) {
  if (!logPath) return
  const text = redactLaunchLogText(message, authorization)
  const lines = text.split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
  if (lines.length === 0) return

  const payload = lines
    .map((line) => `[${new Date().toISOString()}] [${stream}] ${line}`)
    .join('\n') + '\n'

  try {
    fsSync.appendFileSync(logPath, payload, 'utf-8')
  } catch (error) {
    if (verboseLaunchLogging) console.warn('Failed to append KuroLauncher launch log:', error && error.message)
  }
}

async function summarizeLatestKuroLaunchLog(gameDirectory) {
  try {
    const logPath = getKuroLaunchLogPath(gameDirectory)
    if (!fsSync.existsSync(logPath)) return null

    const content = await fs.readFile(logPath, 'utf-8')
    const rawLines = content.split(/\r?\n/)
    const eventLines = rawLines
      .map((line) => {
        const match = line.match(/^\[[^\]]+\]\s+\[([^\]]+)\]\s+(.*)$/)
        return match ? { stream: match[1], text: match[2] } : { stream: 'raw', text: line }
      })
      .filter((entry) => entry.text && entry.text.trim())
      .filter((entry) => entry.stream !== 'arguments')
      .filter((entry) => !(entry.stream === 'debug' && entry.text.includes('[MCLC]: Launching with arguments')))

    const lines = eventLines
      .map((entry) => entry.text.trim())
      .filter(Boolean)

    const nonFatalNoise = (line) =>
      /Failed to update resource pack|Error while downloading|SocketTimeoutException: Connect timed out/i.test(line)

    const fatal = lines.filter((line) =>
      !nonFatalNoise(line) &&
      /(?:Exception in thread|[A-Za-z0-9_.$]+(?:Exception|Error):|Caused by:|Could not find or load main class|NoClassDefFoundError|ClassNotFoundException|FindException|ResolutionException)/i.test(line)
    )

    const important = lines.filter((line) =>
      !nonFatalNoise(line) &&
      /(?:\bError:|Exception|Caused by:|Could not|Unable to|Failed to|Duplicate|NoClassDefFoundError|ClassNotFoundException|FindException|ResolutionException)/i.test(line)
    )

    const selected = (fatal.length > 0 ? fatal : important.length > 0 ? important : lines).slice(-4)
    if (selected.length === 0) return null

    return {
      path: logPath,
      message: selected.join(' | ')
    }
  } catch (error) {
    console.warn('Failed to summarize KuroLauncher launch log:', error && error.message)
    return null
  }
}

async function downloadFile(url, destination) {
  const response = await axios.get(url, { responseType: 'stream', timeout: 120000 })
  if (response.status !== 200) {
    throw new Error(`Не удалось скачать ${url}: HTTP ${response.status}`)
  }
  await fs.mkdir(path.dirname(destination), { recursive: true })
  const writer = fsSync.createWriteStream(destination)
  response.data.pipe(writer)
  try {
    await finished(writer)
  } catch (error) {
    writer.destroy()
    throw error
  }
}

async function downloadAndInstallJava(majorVersion, event = null, maxRetries = 3) {
  const javaDir = path.join(userData, 'java')
  const jdkDir = path.join(javaDir, `jdk-${majorVersion}`)
  const javaExe = path.join(jdkDir, 'bin', 'java.exe')

  if (fsSync.existsSync(javaExe)) {
    console.log(`Java ${majorVersion} already installed at ${jdkDir}`)
    return javaExe
  }

  console.log(`Downloading Java ${majorVersion}...`)
  broadcastLaunchProgress({ message: `Загрузка Java ${majorVersion}...`, phase: 'preparing' })

  let lastError = null

  async function flattenExtractedJdkDirectory(targetDir) {
    const entries = await fs.readdir(targetDir, { withFileTypes: true })
    const subdirectories = entries.filter((entry) => entry.isDirectory())
    if (subdirectories.length !== 1) return false

    const nestedDir = path.join(targetDir, subdirectories[0].name)
    const nestedJavaExe = path.join(nestedDir, 'bin', 'java.exe')
    if (!fsSync.existsSync(nestedJavaExe)) return false

    const nestedEntries = await fs.readdir(nestedDir)
    for (const entry of nestedEntries) {
      await fs.rename(path.join(nestedDir, entry), path.join(targetDir, entry))
    }
    await fs.rmdir(nestedDir)
    return true
  }

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const versionToTry = majorVersion
    console.log(`Trying Java ${versionToTry} (attempt ${attempt + 1}/${maxRetries})...`)

    let downloadUrl = `https://api.adoptium.net/v3/binary/latest/${versionToTry}/ga/windows/x64/jdk/hotspot/normal/eclipse`
    const filename = `jdk-${versionToTry}.zip`
    const tempZip = path.join(javaDir, filename)

    try {
      await downloadFile(downloadUrl, tempZip)

      await fs.mkdir(jdkDir, { recursive: true })
      const zip = new AdmZip(tempZip)
      zip.extractAllTo(jdkDir, true)

      await fs.unlink(tempZip)

      if (!fsSync.existsSync(javaExe)) {
        await flattenExtractedJdkDirectory(jdkDir)
      }

      if (fsSync.existsSync(javaExe)) {
        const installedMajor = getJavaVersionMajor(javaExe)
        if (installedMajor !== null && installedMajor >= majorVersion) {
          console.log(`Java ${installedMajor} installed successfully`)
          return javaExe
        }
        console.warn(`Downloaded Java at ${javaExe}, but detected version ${installedMajor}; expected ${majorVersion}+`)
        lastError = new Error(`Скачанная Java имеет версию ${installedMajor}, ожидалась ${majorVersion}+`)
      } else {
        lastError = new Error(`После распаковки Java ${versionToTry} не найден файл ${javaExe}`)
      }
    } catch (error) {
      console.warn(`Failed to download Java ${versionToTry}:`, error.message)
      lastError = error
    }
  }

  const details = lastError && typeof lastError.message === 'string' && lastError.message
    ? lastError.message
    : String(lastError || 'неизвестная ошибка')
  console.error(`Failed to download/install Java ${majorVersion}:`, details)
  throw new Error(`Не удалось скачать Java ${majorVersion}: ${details}`)
}

async function getNeoForgedVersionsFromMaven(minecraftVersion) {
  try {
    const response = await axios.get('https://maven.neoforged.net/releases/net/neoforged/neoforge/maven-metadata.xml', { timeout: 15000 })
    const xml = response.data
    
    const versionMatches = xml.match(/<version>([^<]+)<\/version>/g)
    if (!versionMatches) {
      console.log('No version tags found in XML')
      return []
    }
    
    let versions = versionMatches.map(m => m.replace(/<\/?version>/g, ''))
    
    console.log('Total NeoForge versions in Maven:', versions.length)
    
    // NeoForge version format: <nfMajor>.<nfMinor>.<patch>
    // NeoForge only exists for MC 1.20.1+.
    // The mapping from MC version to NeoForge major.minor is NOT always 1:1:
    //   MC 1.20.1 -> NeoForge 20.4.x  (NF started with minor=4 for historical reasons)
    //   MC 1.20.2 -> NeoForge 20.2.x
    //   MC 1.20.4 -> NeoForge 20.4.x  (same branch as 1.20.1)
    //   MC 1.20.6 -> NeoForge 20.6.x
    //   MC 1.21   -> NeoForge 21.0.x
    //   MC 1.21.1 -> NeoForge 21.1.x
    const MC_TO_NF_MINOR = { '1.20.1': 4, '1.20.4': 4 }
    const mcParts = minecraftVersion.split('.')
    const mcMajor = parseInt(mcParts[1] || '0', 10)
    const mcMinor = parseInt(mcParts[2] || '0', 10)

    // NeoForge only supports 1.20.1+
    if (mcMajor < 20 || (mcMajor === 20 && mcMinor < 1)) {
      console.log('NeoForge not available for MC', minecraftVersion, '(requires 1.20.1+)')
      return []
    }

    const nfMinor = MC_TO_NF_MINOR[minecraftVersion] !== undefined
      ? MC_TO_NF_MINOR[minecraftVersion]
      : mcMinor

    console.log('Looking for MC version:', minecraftVersion, '-> NF major.minor:', mcMajor + '.' + nfMinor)

    versions = versions.filter(v => {
      const parts = v.split('.')
      return parseInt(parts[0], 10) === mcMajor && parseInt(parts[1], 10) === nfMinor
    })
    
    console.log('NeoForge versions for', minecraftVersion, ': found', versions.length)
    
    const result = versions.map(v => ({
      version: v,
      mcversion: minecraftVersion,
      stable: !v.includes('beta') && !v.includes('alpha')
    }))
    
    result.sort((a, b) => {
      if (a.stable && !b.stable) return -1
      if (!a.stable && b.stable) return 1
      return b.version.localeCompare(a.version, undefined, { numeric: true })
    })
    
    return result
  } catch (error) {
    console.error('Failed to fetch NeoForge versions:', error.message)
    return []
  }
}

async function saveJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf-8')
}

function normalizeArchiveRelativePath(value) {
  if (typeof value !== 'string') return null
  const raw = value.replace(/\\/g, '/').trim()
  if (!raw || raw.includes('\0') || raw.startsWith('/') || /^[a-zA-Z]:/.test(raw)) return null

  const normalized = path.posix.normalize(raw).replace(/^\/+/, '')
  if (!normalized || normalized === '.' || normalized.startsWith('../') || normalized === '..') return null
  return normalized
}

function safeJoinInside(parentPath, relativePath) {
  const normalized = normalizeArchiveRelativePath(relativePath)
  if (!normalized) return null

  const resolved = path.resolve(parentPath, normalized.split('/').join(path.sep))
  return isPathInside(parentPath, resolved) ? resolved : null
}

function recordInstalledModpackPath(installed, relativePath) {
  const normalized = normalizeArchiveRelativePath(relativePath)
  if (!normalized) return

  const parts = normalized.split('/')
  if (parts.length < 2) return

  const topLevel = parts[0].toLowerCase()
  const fileName = parts[parts.length - 1]
  if (!fileName) return

  if (topLevel === 'mods' && Array.isArray(installed.mods)) {
    installed.mods.push(fileName)
  } else if (topLevel === 'resourcepacks' && Array.isArray(installed.resourcepacks)) {
    installed.resourcepacks.push(fileName)
  } else if (topLevel === 'shaderpacks' && Array.isArray(installed.shaderpacks)) {
    installed.shaderpacks.push(fileName)
  }
}

async function copyDirectoryContents(sourceDir, targetDir, options = {}) {
  const { installed = null, relativeBase = '' } = options
  const entries = await fs.readdir(sourceDir, { withFileTypes: true })

  for (const entry of entries) {
    const relativePath = relativeBase ? `${relativeBase}/${entry.name}` : entry.name
    const destination = safeJoinInside(targetDir, relativePath)
    if (!destination) {
      console.warn('Skipping unsafe archive path:', relativePath)
      continue
    }

    const source = path.join(sourceDir, entry.name)
    if (entry.isDirectory()) {
      await fs.mkdir(destination, { recursive: true })
      await copyDirectoryContents(source, targetDir, { installed, relativeBase: relativePath })
    } else if (entry.isFile()) {
      await fs.mkdir(path.dirname(destination), { recursive: true })
      if (path.resolve(source) !== path.resolve(destination)) {
        await fs.copyFile(source, destination)
      }
      if (installed) recordInstalledModpackPath(installed, relativePath)
    }
  }
}

function resolveLibraryRelativePath(library) {
  if (!library || typeof library !== 'object') return null

  const artifactPath = library.downloads?.artifact?.path
  if (typeof artifactPath === 'string' && artifactPath.endsWith('.jar')) {
    return normalizeArchiveRelativePath(`libraries/${artifactPath}`)
  }

  if (typeof library.name !== 'string') return null
  const parts = library.name.split(':')
  if (parts.length < 3) return null

  const [groupId, artifactId, version, classifier] = parts
  const fileName = `${artifactId}-${version}${classifier ? `-${classifier}` : ''}.jar`
  return normalizeArchiveRelativePath(`libraries/${groupId.replace(/\./g, '/')}/${artifactId}/${version}/${fileName}`)
}

function getLibraryRuleAction(library, osName = process.platform === 'win32' ? 'windows' : process.platform === 'darwin' ? 'osx' : 'linux') {
  if (!Array.isArray(library?.rules) || library.rules.length === 0) return true

  let allowed = false
  for (const rule of library.rules) {
    const matchesOs = !rule.os?.name || rule.os.name === osName
    if (!matchesOs) continue
    allowed = rule.action === 'allow'
  }
  return allowed
}

function getBaseLibraryRelativePaths(versionJson) {
  if (!Array.isArray(versionJson?.libraries)) return []

  const libraries = []
  for (const library of versionJson.libraries) {
    if (!getLibraryRuleAction(library)) continue
    const relativePath = resolveLibraryRelativePath(library)
    if (relativePath) libraries.push(relativePath)
  }
  return Array.from(new Set(libraries))
}

function appendJvmPropertyList(args, propertyName, entries, separator = process.platform === 'win32' ? ';' : ':') {
  if (!Array.isArray(args) || !Array.isArray(entries) || entries.length === 0) return

  const cleanEntries = entries.filter(Boolean)
  if (cleanEntries.length === 0) return

  const prefix = `-D${propertyName}=`
  const propertyIndex = args.findIndex((item) => typeof item === 'string' && item.startsWith(prefix))
  if (propertyIndex >= 0) {
    const current = args[propertyIndex].slice(prefix.length)
    const merged = Array.from(new Set([...current.split(separator).filter(Boolean), ...cleanEntries]))
    args[propertyIndex] = `${prefix}${merged.join(separator)}`
  } else {
    args.push(`${prefix}${Array.from(new Set(cleanEntries)).join(separator)}`)
  }
}

async function loadModrinthCache() {
  return await readJson(modrinthCachePath, {})
}

async function saveModrinthCache(cache) {
  await saveJson(modrinthCachePath, cache)
}

async function modrinthCacheGet(key) {
  const cache = await loadModrinthCache()
  return cache[key]
}

async function modrinthCacheSet(key, value) {
  const cache = await loadModrinthCache()
  cache[key] = value
  await saveModrinthCache(cache)
}

async function fetchModrinth(pathSuffix, params = {}) {
  const url = `https://api.modrinth.com/v2${pathSuffix}`
  const maxRetries = 5
  let lastError = null
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await axios.get(url, { 
        params,
        timeout: 30000
      })
      return response.data
    } catch (error) {
      lastError = error
      if (error.response?.status === 429) {
        const retryAfterHeader = error.response.headers['retry-after'] || error.response.headers['Retry-After']
        let waitTime = retryAfterHeader ? parseInt(retryAfterHeader, 10) * 1000 : 0
        
        if (!waitTime || waitTime < 1000) {
          waitTime = Math.max(30000, (attempt + 1) * 30000)
        }
        
        modrinthCooldownUntil = Date.now() + waitTime + 5000
        console.log(`Modrinth rate limited, setting cooldown for ${waitTime + 5000}ms`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      } else if (attempt < maxRetries - 1) {
        const waitTime = (attempt + 1) * 2000
        console.log(`Modrinth request failed, waiting ${waitTime}ms before retry ${attempt + 1}/${maxRetries}`)
        await new Promise(resolve => setTimeout(resolve, waitTime))
      }
    }
  }
  throw lastError
}

let lastModrinthRequestTime = 0
let modrinthCooldownUntil = 0
const MODRINTH_MIN_REQUEST_INTERVAL = 1000

async function rateLimitedFetchModrinth(pathSuffix, params = {}) {
  const now = Date.now()
  
  if (now < modrinthCooldownUntil) {
    const waitTime = modrinthCooldownUntil - now
    console.log(`Modrinth in cooldown, waiting ${waitTime}ms`)
    await new Promise(resolve => setTimeout(resolve, waitTime))
  }
  
  const timeSinceLastRequest = now - lastModrinthRequestTime
  if (timeSinceLastRequest < MODRINTH_MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MODRINTH_MIN_REQUEST_INTERVAL - timeSinceLastRequest))
  }
  lastModrinthRequestTime = Date.now()
  return fetchModrinth(pathSuffix, params)
}

function buildModrinthFacets(version, projectType, loader) {
  const facets = []
  if (version) facets.push([`versions:${version}`])
  if (projectType && projectType !== 'all') facets.push([`project_type:${projectType}`])
  if (loader) facets.push([`categories:${loader}`])
  return facets
}

function buildModrinthFilters(version, projectType, loader) {
  const filters = []
  if (version) filters.push(`game_versions="${version}"`)
  if (projectType && projectType !== 'all') filters.push(`project_types="${projectType}"`)
  if (loader) filters.push(`categories="${loader}"`)
  return filters.join(' AND ')
}

async function searchModrinth(query, options = {}) {
  const { version, loader, projectType, page = 1, pageSize = 20 } = options
  const normalizedQuery = typeof query === 'string' ? query.trim() : ''
  const params = {
    limit: pageSize,
    offset: (page - 1) * pageSize
  }

  if (normalizedQuery.length > 0) {
    params.query = normalizedQuery
  }

  const filters = buildModrinthFilters(version, projectType, loader)
  if (filters) {
    params.new_filters = filters
  }

  console.log('Modrinth search params:', JSON.stringify(params))

  const cacheKey = `search_v2:${params.query || 'all'}:${version}:${loader}:${projectType}:${page}:${pageSize}`
  const cached = await modrinthCacheGet(cacheKey)
  if (cached) return cached

  const data = await rateLimitedFetchModrinth('/search', params)
  console.log('Modrinth search result:', data.hits?.length || 0, 'hits')
  await modrinthCacheSet(cacheKey, data)
  return data
}

async function projectMatchesLoader(projectSlug, loader) {
  const project = await getModrinthProject(projectSlug)
  if (!project || !Array.isArray(project.loaders)) return false
  return project.loaders.map((item) => String(item).toLowerCase()).includes(String(loader).toLowerCase())
}

async function getModrinthProject(projectId) {
  const cacheKey = `project:${projectId}`
  const cached = await modrinthCacheGet(cacheKey)
  if (cached) return cached
  const data = await rateLimitedFetchModrinth(`/project/${projectId}`)
  await modrinthCacheSet(cacheKey, data)
  return data
}

async function getModrinthVersions(projectId) {
  const cacheKey = `versions:${projectId}`
  const cached = await modrinthCacheGet(cacheKey)
  if (cached) return cached
  const data = await rateLimitedFetchModrinth(`/project/${projectId}/version`)
  await modrinthCacheSet(cacheKey, data)
  return data
}



function chooseModrinthVersion(versions, gameVersion, loader) {
  let candidates = Array.isArray(versions) ? versions : []
  
  console.log('chooseModrinthVersion input:', { totalVersions: candidates.length, gameVersion, loader })
  
  if (gameVersion) {
    const before = candidates.length
    candidates = candidates.filter((version) => Array.isArray(version.game_versions) && version.game_versions.includes(gameVersion))
    console.log('After gameVersion filter:', candidates.length, 'from', before)
  }
  if (loader) {
    const before = candidates.length
    candidates = candidates.filter((version) => Array.isArray(version.loaders) && version.loaders.includes(loader))
    console.log('After loader filter:', candidates.length, 'from', before)
  }
  
  if (candidates.length === 0) {
    console.log('No matching version found, returning null')
    return null
  }
  
  candidates.sort((a, b) => new Date(b.date_published) - new Date(a.date_published))
  console.log('Selected version:', candidates[0]?.id, 'for game:', candidates[0]?.game_versions)
  return candidates[0]
}

function normalizeModrinthLoader(value) {
  const text = String(value || '').toLowerCase()
  if (!text) return null

  if (text.includes('neoforge')) return 'neoforge'
  if (text.includes('quilt')) return 'quilt'
  if (text.includes('fabric')) return 'fabric'
  if (text.includes('forge') || text.includes('minecraftforge')) return 'forge'
  return null
}

function detectLoaderFromValues(values = []) {
  const list = Array.isArray(values) ? values : [values]
  for (const value of list) {
    const detected = normalizeModrinthLoader(value)
    if (detected) return detected
  }
  return null
}

function detectLoaderFromDependencies(dependencies = {}) {
  if (!dependencies || typeof dependencies !== 'object') return null

  const keys = Object.keys(dependencies).map((key) => String(key).toLowerCase())
  if (keys.includes('fabric-loader')) return 'fabric'
  if (keys.includes('quilt-loader')) return 'quilt'
  if (keys.includes('neoforge')) return 'neoforge'
  if (keys.includes('forge')) return 'forge'
  return null
}

function pickRequiredLoaderVersion(dependencies = {}, loaderName = '') {
  if (!dependencies || typeof dependencies !== 'object') return null

  const normalizedLoader = normalizeModrinthLoader(loaderName)
  if (!normalizedLoader) return null

  const loaderDependencyKeys = {
    fabric: ['fabric-loader'],
    quilt: ['quilt-loader'],
    forge: ['forge'],
    neoforge: ['neoforge']
  }

  const keys = loaderDependencyKeys[normalizedLoader] || []
  for (const key of keys) {
    if (dependencies[key]) return String(dependencies[key])
  }

  return null
}

async function readModpackIndexData(modpackPath) {
  if (!modpackPath) return null

  const candidates = [
    path.join(modpackPath, 'modrinth.index.json'),
    path.join(modpackPath, 'overrides', 'modrinth.index.json')
  ]

  try {
    const entries = await fs.readdir(modpackPath, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      candidates.push(path.join(modpackPath, entry.name, 'modrinth.index.json'))
      candidates.push(path.join(modpackPath, entry.name, 'overrides', 'modrinth.index.json'))
    }
  } catch {}

  for (const candidate of candidates) {
    if (!fsSync.existsSync(candidate)) continue
    try {
      return JSON.parse(await fs.readFile(candidate, 'utf-8'))
    } catch (error) {
      console.warn('Failed to read modpack index:', candidate, error && error.message)
    }
  }

  return null
}

async function getModpackLaunchHints(profile) {
  if (!profile?.modpackPath) return null

  const indexData = await readModpackIndexData(profile.modpackPath)
  const profileLoader = normalizeModrinthLoader(profile.loader)
  const nameLoader = detectLoaderFromValues(profile.name)
  const dependencyLoader = detectLoaderFromDependencies(indexData?.dependencies)
  let manifestLoader = null
  let gameLoader = null
  let loaderVersion = profile.loaderVersion || ''

  if (indexData?.manifest?.minecraft?.modLoaders) {
    for (const modLoader of indexData.manifest.minecraft.modLoaders) {
      const detected = normalizeModrinthLoader(modLoader?.id || modLoader)
      if (detected) {
        manifestLoader = detected
        break
      }
    }
  }

  if (indexData?.game?.loader) {
    gameLoader = normalizeModrinthLoader(indexData.game.loader)
  }

  const loader = dependencyLoader || manifestLoader || gameLoader || nameLoader || profileLoader || 'vanilla'

  const requiredLoaderVersion = pickRequiredLoaderVersion(indexData?.dependencies, loader)
  if (requiredLoaderVersion) {
    loaderVersion = requiredLoaderVersion
  } else if (loader !== profileLoader) {
    loaderVersion = ''
  }

  return {
    loader,
    loaderVersion
  }
}

function chooseModrinthFile(files, projectType) {
  if (!Array.isArray(files) || files.length === 0) return null
  const pickByExt = (exts) => files.find((file) => exts.some((ext) => file.filename.toLowerCase().endsWith(ext)))
  if (projectType === 'modpack') {
    return pickByExt(['.mrpack', '.zip']) || files[0]
  }
  if (projectType === 'shader') {
    return pickByExt(['.zip', '.jar']) || files[0]
  }
  if (projectType === 'resourcepack') {
    return pickByExt(['.zip', '.jar']) || files[0]
  }
  return pickByExt(['.jar']) || files[0]
}

function getAddonDirectoryNameForProjectType(projectType) {
  if (projectType === 'resourcepack') return 'resourcepacks'
  if (projectType === 'shader') return 'shaderpacks'
  return 'mods'
}

function getModrinthLoaderForProjectType(projectType, loader) {
  if (projectType === 'mod' || projectType === 'modpack') return loader || ''
  return ''
}

function createModpackDirectoryKey() {
  return `custom-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`
}

function getModpackKeyFromPath(modpackPath) {
  const resolvedPath = path.resolve(modpackPath || '')
  if (!isPathInside(modpacksPath, resolvedPath)) {
    throw new Error('Некорректный путь модпака')
  }
  return path.basename(resolvedPath)
}

function getModpackMetaPath(modpackPath) {
  return path.join(modpacksPath, `${getModpackKeyFromPath(modpackPath)}.meta.json`)
}

async function ensureModpackMeta(profile) {
  if (!profile?.modpackPath) throw new Error('Профиль модпака не найден')

  const modpackKey = getModpackKeyFromPath(profile.modpackPath)
  const metaPath = getModpackMetaPath(profile.modpackPath)
  const existing = await readJson(metaPath, {})
  const meta = {
    projectId: existing.projectId || modpackKey,
    versionId: existing.versionId || 'custom',
    projectTitle: existing.projectTitle || profile.name || modpackKey,
    gameVersion: existing.gameVersion || profile.versionId,
    detectedLoader: existing.detectedLoader || profile.loader || 'vanilla',
    loaderVersion: existing.loaderVersion || profile.loaderVersion || '',
    custom: existing.custom ?? true,
    installed: {
      mods: Array.isArray(existing.installed?.mods) ? existing.installed.mods : [],
      resourcepacks: Array.isArray(existing.installed?.resourcepacks) ? existing.installed.resourcepacks : [],
      shaderpacks: Array.isArray(existing.installed?.shaderpacks) ? existing.installed.shaderpacks : []
    },
    createdAt: existing.createdAt || new Date().toISOString()
  }
  await saveJson(metaPath, meta)
  return { modpackKey, metaPath, meta }
}

async function recordTargetModpackAddon(profile, addonDirectoryName, fileName) {
  const { metaPath, meta } = await ensureModpackMeta(profile)
  if (!Array.isArray(meta.installed[addonDirectoryName])) meta.installed[addonDirectoryName] = []
  meta.installed[addonDirectoryName] = [...new Set([...meta.installed[addonDirectoryName], fileName])]
  await saveJson(metaPath, meta)
}

async function resolveModrinthInstallTarget(options = {}) {
  const targetProfileId = options.targetProfileId || options.modpackProfileId
  const profiles = await getProfiles()
  let profile = null

  if (targetProfileId) {
    profile = profiles.find((item) => item.id === targetProfileId)
  } else if (options.targetModpackPath) {
    const resolvedTargetPath = path.resolve(options.targetModpackPath)
    profile = profiles.find((item) => {
      if (!item?.modpackPath) return false
      try {
        return path.resolve(item.modpackPath) === resolvedTargetPath
      } catch {
        return false
      }
    })
  }

  if (!profile?.modpackPath) {
    throw new Error('Выберите модпак, куда установить дополнение')
  }

  const modpackPath = path.resolve(profile.modpackPath)
  if (!isPathInside(modpacksPath, modpackPath)) {
    throw new Error('Некорректный путь модпака')
  }

  await fs.mkdir(path.join(modpackPath, 'mods'), { recursive: true })
  await fs.mkdir(path.join(modpackPath, 'resourcepacks'), { recursive: true })
  await fs.mkdir(path.join(modpackPath, 'shaderpacks'), { recursive: true })
  await ensureModpackMeta(profile)

  return {
    profile,
    modpackPath,
    modpackKey: getModpackKeyFromPath(modpackPath),
    gameVersion: profile.versionId || options.gameVersion || '',
    loader: profile.loader === 'vanilla' ? '' : profile.loader || ''
  }
}

async function createCustomModpack(input = {}) {
  const name = String(input.name || '').trim()
  const versionId = String(input.versionId || input.minecraftVersion || '').trim()
  const loader = normalizeModrinthLoader(input.loader) || (input.loader === 'vanilla' ? 'vanilla' : '')
  const loaderVersion = String(input.loaderVersion || '').trim()

  if (!name) throw new Error('Введите название модпака')
  if (!versionId) throw new Error('Выберите версию Minecraft')
  if (!['vanilla', 'forge', 'fabric', 'quilt', 'neoforge'].includes(loader)) {
    throw new Error('Выберите модлоадер')
  }
  if (loader !== 'vanilla' && !loaderVersion) {
    throw new Error('Выберите версию модлоадера')
  }

  const modpackKey = createModpackDirectoryKey()
  const modpackDir = path.join(modpacksPath, modpackKey)
  await fs.mkdir(path.join(modpackDir, 'mods'), { recursive: true })
  await fs.mkdir(path.join(modpackDir, 'resourcepacks'), { recursive: true })
  await fs.mkdir(path.join(modpackDir, 'shaderpacks'), { recursive: true })
  await fs.mkdir(path.join(modpackDir, 'config'), { recursive: true })

  const profile = {
    id: `modpack-${modpackKey}`,
    name,
    versionId,
    ram: 'global',
    javaPath: 'java',
    username: '',
    loader,
    loaderVersion: loader === 'vanilla' ? '' : loaderVersion,
    fullscreenMode: 'global',
    modpackPath: modpackDir
  }

  const meta = {
    projectId: modpackKey,
    versionId: 'custom',
    projectTitle: name,
    gameVersion: versionId,
    detectedLoader: loader,
    loaderVersion: profile.loaderVersion,
    custom: true,
    installed: {
      mods: [],
      resourcepacks: [],
      shaderpacks: []
    },
    createdAt: new Date().toISOString(),
    installedAt: Date.now()
  }

  await saveProfile(profile)
  await saveJson(path.join(modpacksPath, `${modpackKey}.meta.json`), meta)

  return { success: true, profile }
}

async function installModrinthVersion(version, options = {}) {
  const { projectType = 'mod', gameVersion = '', loader = '', visited = new Set(), project = null } = options
  if (!version) throw new Error('Версия Modrinth не найдена для установки')

  const file = chooseModrinthFile(version.files, projectType)
  if (!file || !file.url) {
    throw new Error('Не удалось найти файл для загрузки Modrinth')
  }

  let target = null
  let directory = modsPath
  if (projectType === 'resourcepack') directory = resourcepacksPath
  if (projectType === 'shader') directory = shaderpacksPath
  if (projectType === 'modpack') directory = modpacksPath
  if (projectType !== 'modpack') {
    target = await resolveModrinthInstallTarget(options)
    directory = path.join(target.modpackPath, getAddonDirectoryNameForProjectType(projectType))
  }

  const destination = path.join(directory, file.filename)
  await downloadFile(file.url, destination)

  if (projectType === 'modpack') {
    await installModrinthModpackArchive(destination, version, project)
    try {
      await fs.unlink(destination)
    } catch {
      // ignore temp archive cleanup errors
    }
    return true
  }

  await recordTargetModpackAddon(target.profile, getAddonDirectoryNameForProjectType(projectType), file.filename)
  await resolveModrinthDependencies(version, {
    gameVersion: gameVersion || target.gameVersion,
    loader: loader || target.loader,
    visited,
    targetProfileId: target.profile.id
  })
  return { destination, fileName: file.filename, targetProfile: target.profile }
}

async function resolveModrinthDependencies(version, options = {}) {
  const { gameVersion = '', loader = '', visited = new Set(), targetProfileId = null } = options
  if (!Array.isArray(version.dependencies)) return []
  const installed = []

  for (const dependency of version.dependencies) {
    const projectId = dependency.project_id
    const versionId = dependency.version_id
    if (!projectId || visited.has(projectId)) continue
    if (dependency.dependency_type !== 'required') continue
    visited.add(projectId)

    try {
      if (versionId) {
        const depVersion = await getModrinthVersion(versionId)
        await installModrinthVersion(depVersion, { projectType: depVersion.project_type || 'mod', gameVersion, loader, visited, targetProfileId })
      } else {
        await installModrinthProject(projectId, { gameVersion, loader, targetProfileId })
      }
      installed.push(projectId)
    } catch (error) {
      console.error(`Ошибка установки зависимости ${projectId}:`, error)
    }
  }

  return installed
}

async function installModrinthModpackArchive(filePath, version, project = null) {
  const projectId = version.project_id || 'modpack'
  const projectTitle = project?.title || null
  let installed = { mods: [], resourcepacks: [], shaderpacks: [] }
  const extractDir = path.join(modpacksPath, `${projectId}-${version.id}`)
  if (fsSync.existsSync(extractDir)) {
    await fs.rm(extractDir, { recursive: true, force: true })
  }
  const zip = new AdmZip(filePath)
  zip.extractAllTo(extractDir, true)

  // Determine likely root (some archives contain a single top-level folder)
  let root = extractDir
  try {
    const top = await fs.readdir(extractDir, { withFileTypes: true })
    if (top.length === 1 && top[0].isDirectory()) {
      root = path.join(extractDir, top[0].name)
    }
  } catch (e) {}

  async function findCandidates(name) {
    const candidates = []
    const direct = path.join(root, name)
    if (fsSync.existsSync(direct)) candidates.push(direct)
    const overrides = path.join(root, 'overrides', name)
    if (fsSync.existsSync(overrides)) candidates.push(overrides)
    try {
      const entries = await fs.readdir(root, { withFileTypes: true })
      for (const entry of entries) {
        if (!entry.isDirectory()) continue
        const nested = path.join(root, entry.name, name)
        if (fsSync.existsSync(nested)) candidates.push(nested)
        const nestedOverrides = path.join(root, entry.name, 'overrides', name)
        if (fsSync.existsSync(nestedOverrides)) candidates.push(nestedOverrides)
      }
    } catch (e) {}
    return candidates
  }

  const installDirs = ['mods', 'resourcepacks', 'shaderpacks']
  
  // Create modpack-specific directories
  const modpackDir = path.join(modpacksPath, `${projectId}-${version.id}`)
  const modpackModsPath = path.join(modpackDir, 'mods')
  const modpackResourcepacksPath = path.join(modpackDir, 'resourcepacks')
  const modpackShaderpacksPath = path.join(modpackDir, 'shaderpacks')
  const modpackConfigPath = path.join(modpackDir, 'config')
  
  await fs.mkdir(modpackModsPath, { recursive: true })
  await fs.mkdir(modpackResourcepacksPath, { recursive: true })
  await fs.mkdir(modpackShaderpacksPath, { recursive: true })
  await fs.mkdir(modpackConfigPath, { recursive: true })

  const overridesPath = path.join(root, 'overrides')
  if (fsSync.existsSync(overridesPath)) {
    try {
      await copyDirectoryContents(overridesPath, modpackDir, { installed })
    } catch (e) {
      console.warn(`Failed to copy overrides from ${overridesPath}:`, e && e.message)
    }
  }

  for (const name of installDirs) {
    // Also copy loose .jar/.zip files from root for mods
    if (name === 'mods') {
      try {
        const rootFiles = await fs.readdir(root, { withFileTypes: true })
        for (const entry of rootFiles) {
          if (!entry.isFile()) continue
          const lower = entry.name.toLowerCase()
          if (lower.endsWith('.jar') || lower.endsWith('.zip')) {
            const src = path.join(root, entry.name)
            const dst = path.join(modpackModsPath, entry.name)
            try {
              await fs.copyFile(src, dst)
              installed.mods.push(entry.name)
            } catch (e) {
              console.warn(`Failed to copy loose mod file ${src}:`, e && e.message)
            }
          }
        }
      } catch (e) {}
    }

    const sources = await findCandidates(name)
    for (const sourceDir of sources) {
      try {
        const destinationDir = name === 'mods' ? modpackModsPath : name === 'resourcepacks' ? modpackResourcepacksPath : modpackShaderpacksPath
        await fs.mkdir(destinationDir, { recursive: true })
        await copyDirectoryContents(sourceDir, destinationDir)
        const files = await fs.readdir(destinationDir, { withFileTypes: true })
        for (const entry of files) {
          if (entry.isFile()) installed[name].push(entry.name)
        }
      } catch (e) {
        console.warn(`Failed to copy ${name} from ${sourceDir}:`, e && e.message)
      }
    }
  }
  
  // Also copy config directory if exists. Many modpacks keep nested config,
  // defaultconfigs, scripts, or KubeJS folders under overrides.
  const configCandidates = [path.join(root, 'config'), path.join(root, 'overrides', 'config')]
  for (const configSrc of configCandidates) {
    if (fsSync.existsSync(configSrc)) {
      try {
        await copyDirectoryContents(configSrc, modpackConfigPath)
      } catch (e) {}
    }
  }

  // After copying, try to detect loader by inspecting copied mod jars
  async function detectLoaderFromJarPaths(paths) {
    try {
      for (const p of paths) {
        const lower = String(p).toLowerCase()
        if (!lower.endsWith('.jar') && !lower.endsWith('.zip')) continue
        try {
          const zip = new AdmZip(p)
          const entries = zip.getEntries().map(e => e.entryName.toLowerCase())
          if (entries.some(n => n.includes('meta-inf/neoforge.mods.toml') || n.includes('neoforge.mods.toml'))) return 'neoforge'
          if (entries.some(n => n.endsWith('quilt.mod.json') || n.includes('quilt/') || n.includes('quilt_loader'))) return 'quilt'
          if (entries.some(n => n.endsWith('fabric.mod.json') || n.includes('fabric/loader') || n.includes('fabric_mod'))) return 'fabric'
          if (entries.some(n => n.includes('meta-inf/mods.toml') || n.includes('mcmod.info') || n.includes('mods.toml'))) return 'forge'
          if (lower.includes('neoforge')) return 'neoforge'
          if (lower.includes('quilt')) return 'quilt'
          if (lower.includes('fabric')) return 'fabric'
          if (lower.includes('forge')) return 'forge'
        } catch (e) {
          // not a zip or failed to read — ignore
        }
      }
    } catch (e) {
      // ignore
    }
    return null
  }

  let detectedLoader = null
  try {
    const modPaths = installed.mods.map((name) => path.join(modpackModsPath, name)).filter(p => fsSync.existsSync(p))
    detectedLoader = await detectLoaderFromJarPaths(modPaths)
    if (detectedLoader) console.log('Detected loader from jars:', detectedLoader)
  } catch (e) {
    console.warn('Loader detection failed:', e && e.message)
  }

  // Deduplicate installed files
  for (const key of Object.keys(installed)) {
    if (Array.isArray(installed[key])) {
      installed[key] = [...new Set(installed[key])]
    }
  }

  // Save meta info for this modpack so UI can map files to modpack
  try {
    const meta = {
      projectId,
      versionId: version.id,
      projectTitle: projectTitle,
      gameVersions: version.game_versions || [],
      gameVersion: version.game_versions?.[0] || '',
      installed,
      detectedLoader: detectedLoader || null,
      loaderVersion: '',
      custom: false,
      installedAt: Date.now()
    }
    await saveJson(path.join(modpacksPath, `${projectId}-${version.id}.meta.json`), meta)
  } catch (e) {
    console.warn('Failed to save modpack meta file:', e && e.message)
  }
}

async function installModrinthProject(projectId, options = {}) {
  const { gameVersion = '', loader = '' } = options
  const project = await getModrinthProject(projectId)
  const versions = await getModrinthVersions(projectId)
  const projectType = project.project_type || 'mod'

  if (projectType === 'modpack') {
    const version = chooseModrinthVersion(versions, gameVersion || project.game_versions?.[0], getModrinthLoaderForProjectType(projectType, loader))
    if (!version) {
      throw new Error('Не удалось найти совместимую версию модпака Modrinth')
    }

    const modpackProjectId = version.project_id || projectId
    await installModrinthVersion(version, { projectType: 'modpack', gameVersion, loader, project })
    const gameVersionModpack = version.game_versions?.[0] || '1.20.1'
    const extractDir = path.join(modpacksPath, `${modpackProjectId}-${version.id}`)
    const modpackDir = path.join(modpacksPath, `${modpackProjectId}-${version.id}`)
    const modpackModsPath = path.join(modpackDir, 'mods')
    const requestedModpackLoader = normalizeModrinthLoader(loader)
    let modpackLoader = requestedModpackLoader || detectLoaderFromValues(project.title) || detectLoaderFromValues(version.name) || detectLoaderFromValues(version.loaders) || detectLoaderFromValues(project.loaders) || 'vanilla'
    let modpackLoaderRequiredVersion = null
    
    // Also check meta produced during extraction for detected loader
    // NOTE: installModrinthModpackArchive saves meta using projectId (version.project_id || 'modpack')
    // So we need to use the same key
    const metaProjectId = version.project_id || 'modpack'
    try {
      const metaPath = path.join(modpacksPath, `${metaProjectId}-${version.id}.meta.json`)
      console.log(`[Modrinth] Reading meta from: ${metaPath}, exists: ${fsSync.existsSync(metaPath)}`)
      if (fsSync.existsSync(metaPath)) {
        const meta = JSON.parse(fsSync.readFileSync(metaPath, 'utf-8'))
        console.log(`[Modrinth] Meta contents:`, JSON.stringify(meta))
        console.log(`[Modrinth] Meta file detectedLoader: '${meta.detectedLoader}', type: ${typeof meta.detectedLoader}`)
        // Use detectedLoader from archive only as a last-resort fallback.
        if (meta.detectedLoader && (!modpackLoader || modpackLoader === 'vanilla')) {
          modpackLoader = normalizeModrinthLoader(meta.detectedLoader) || 'vanilla'
          console.log(`[Modrinth] Using detected loader from meta file: ${modpackLoader}`)
        }
      }
    } catch (e) {
      console.warn('Failed to read meta for loader:', e && e.message)
    }

    // Determine extraction root (handle archives with top-level folder or overrides)
    // Use same projectId key as in installModrinthModpackArchive for meta file consistency
    const metaProjectIdForDir = version.project_id || 'modpack'
    let extractRoot = path.join(modpacksPath, `${metaProjectIdForDir}-${version.id}`)
    try {
      const top = await fs.readdir(extractDir, { withFileTypes: true })
      if (top.length === 1 && top[0].isDirectory()) {
        extractRoot = path.join(extractDir, top[0].name)
      } else {
        for (const entry of top) {
          if (!entry.isDirectory()) continue
          const candidate = path.join(extractDir, entry.name)
          if (fsSync.existsSync(path.join(candidate, 'modrinth.index.json')) ||
              fsSync.existsSync(path.join(candidate, 'mods')) ||
              fsSync.existsSync(path.join(candidate, 'overrides', 'mods'))) {
            extractRoot = candidate
            break
          }
        }
      }
    } catch (e) {}

    // Try to detect loader from modrinth.index.json (search a few likely locations)
    console.log(`[Modrinth] Starting index detection, current modpackLoader=${modpackLoader}`)
    console.log(`[Modrinth] extractRoot=${extractRoot}, extractDir=${extractDir}`)
    try {
      let indexPath = null
      const indexCandidates = [
        path.join(extractRoot, 'modrinth.index.json'),
        path.join(extractDir, 'modrinth.index.json'),
        path.join(extractRoot, 'overrides', 'modrinth.index.json'),
        path.join(extractDir, 'overrides', 'modrinth.index.json')
      ]
      console.log(`[Modrinth] Checking index paths:`, indexCandidates)
      for (const p of indexCandidates) {
        console.log(`[Modrinth] Checking: ${p}, exists: ${fsSync.existsSync(p)}`)
        if (fsSync.existsSync(p)) { indexPath = p; break }
      }
      if (indexPath) {
        console.log(`[Modrinth] Found index at: ${indexPath}`)
        const indexData = JSON.parse(await fs.readFile(indexPath, 'utf-8'))
        console.log(`[Modrinth] Index data keys: ${Object.keys(indexData).join(', ')}`)
        if (indexData.game) console.log(`[Modrinth] indexData.game: ${JSON.stringify(indexData.game)}`)
        if (indexData.manifest?.minecraft?.modLoaders) console.log(`[Modrinth] modLoaders: ${JSON.stringify(indexData.manifest.minecraft.modLoaders)}`)
        
        const projectIds = new Set()
        const filesToDownload = []
        if (Array.isArray(indexData.files)) {
          for (const f of indexData.files) {
            if (f && f.downloads && f.downloads[0]) {
              const archivePath = normalizeArchiveRelativePath(f.path || f.filename || '')
              const targetPath = archivePath
                ? safeJoinInside(modpackDir, archivePath)
                : safeJoinInside(modpackModsPath, f.filename || path.basename(String(f.downloads[0])))
              if (!targetPath) {
                console.warn('[Modrinth] Skipping unsafe index file path:', f.path || f.filename)
              } else {
                const downloadUrl = f.downloads[0]
                filesToDownload.push({ url: downloadUrl, target: targetPath, archivePath: archivePath || `mods/${path.basename(targetPath)}` })
              }
            }
            if (f && (f.project_id || f.projectId || f.project)) {
              projectIds.add(f.project_id || f.projectId || f.project)
            }
          }
        }
        console.log(`[Modrinth] Found ${projectIds.size} project IDs in index`)
        console.log(`[Modrinth] Files to download: ${filesToDownload.length}`)
        
        // Download additional modpack files from Modrinth CDN
        const downloadedFromIndex = []
        if (filesToDownload.length > 0) {
          for (const file of filesToDownload) {
            try {
              console.log(`[Modrinth] Downloading: ${file.url} -> ${file.target}`)
              const dir = path.dirname(file.target)
              await fs.mkdir(dir, { recursive: true })
              const response = await axios.get(file.url, { responseType: 'stream', timeout: 120000 })
              const writer = fsSync.createWriteStream(file.target)
              response.data.pipe(writer)
              await new Promise((resolve, reject) => {
                writer.on('finish', resolve)
                writer.on('error', reject)
              })
              const basename = path.basename(file.target)
              console.log(`[Modrinth] Downloaded: ${basename}`)
              downloadedFromIndex.push({ name: basename, archivePath: file.archivePath })
            } catch (e) {
              console.warn(`[Modrinth] Failed to download ${file.url}:`, e && e.message)
            }
          }
        }
        // Update meta.json so these files are associated with the modpack (not "standalone")
        if (downloadedFromIndex.length > 0) {
          try {
            const metaPathForIndex = path.join(modpacksPath, `${metaProjectId}-${version.id}.meta.json`)
            const existingMeta = fsSync.existsSync(metaPathForIndex)
              ? JSON.parse(fsSync.readFileSync(metaPathForIndex, 'utf-8'))
              : { projectId: metaProjectId, versionId: version.id, installed: { mods: [], resourcepacks: [], shaderpacks: [] } }
            if (!existingMeta.installed) existingMeta.installed = { mods: [], resourcepacks: [], shaderpacks: [] }
            if (!Array.isArray(existingMeta.installed.mods)) existingMeta.installed.mods = []
            if (!Array.isArray(existingMeta.installed.resourcepacks)) existingMeta.installed.resourcepacks = []
            if (!Array.isArray(existingMeta.installed.shaderpacks)) existingMeta.installed.shaderpacks = []
            for (const item of downloadedFromIndex) {
              recordInstalledModpackPath(existingMeta.installed, item.archivePath)
            }
            existingMeta.installed.mods = [...new Set(existingMeta.installed.mods)]
            existingMeta.installed.resourcepacks = [...new Set(existingMeta.installed.resourcepacks)]
            existingMeta.installed.shaderpacks = [...new Set(existingMeta.installed.shaderpacks)]
            await saveJson(metaPathForIndex, existingMeta)
            console.log(`[Modrinth] Updated meta with ${downloadedFromIndex.length} index-downloaded files`)
          } catch (e) {
            console.warn('[Modrinth] Failed to update meta with index downloads:', e && e.message)
          }
        }

        const detectedFromDependencies = detectLoaderFromDependencies(indexData.dependencies)
        if (detectedFromDependencies && !requestedModpackLoader) {
          modpackLoader = detectedFromDependencies
          console.log(`[Modrinth] Detected loader from index dependencies: ${modpackLoader}`)
        }

        if (modpackLoader === 'vanilla') {
          if (indexData.game && indexData.game.loader) {
            const detectedFromGame = normalizeModrinthLoader(indexData.game.loader)
            if (detectedFromGame) modpackLoader = detectedFromGame
          }
          if (indexData.manifest && indexData.manifest.minecraft && Array.isArray(indexData.manifest.minecraft.modLoaders)) {
            for (const ml of indexData.manifest.minecraft.modLoaders) {
              const detectedFromManifest = normalizeModrinthLoader(ml.id || ml)
              if (detectedFromManifest) {
                modpackLoader = detectedFromManifest
                break
              }
            }
          }
        }
        
        const detectedRequiredLoaderVersion = pickRequiredLoaderVersion(indexData.dependencies, modpackLoader)
        if (detectedRequiredLoaderVersion) {
          modpackLoaderRequiredVersion = detectedRequiredLoaderVersion
          console.log(`[Modrinth] Required ${modpackLoader} loader from index: ${modpackLoaderRequiredVersion}`)
        }
      }
    } catch (e) {
      console.warn('Failed to detect modpack loader from index:', e && e.message)
    }

    // NOTE: Removed meta file loader detection - it incorrectly overrides the detected loader

    // Fallback: scan mods folder filenames (search a few likely locations)
    try {
      const candidates = [
        path.join(extractRoot, 'mods'),
        path.join(extractRoot, 'overrides', 'mods'),
        path.join(extractDir, 'mods'),
        path.join(extractDir, 'overrides', 'mods')
      ]
      if (modpackLoader === 'vanilla') {
        for (const modsSourceDir of candidates) {
          if (!fsSync.existsSync(modsSourceDir)) continue
          const modFiles = await fs.readdir(modsSourceDir)
          const modFileNames = modFiles.map(f => f.toLowerCase())
          console.log(`[Modrinth] Checking mods dir: ${modsSourceDir}, files: ${modFiles.slice(0, 5).join(', ')}`)
          if (modFileNames.some(f => f.includes('neoforge'))) {
            modpackLoader = 'neoforge'
            console.log(`[Modrinth] Detected neoforge from file: ${modFiles.find(f => f.toLowerCase().includes('neoforge'))}`)
            break
          }
          if (modFileNames.some(f => f.includes('quilt') && f.includes('loader'))) {
            modpackLoader = 'quilt'
            console.log(`[Modrinth] Detected quilt from file: ${modFiles.find(f => f.toLowerCase().includes('quilt') && f.toLowerCase().includes('loader'))}`)
            break
          }
          if (modFileNames.some(f => f.includes('fabric') && (f.includes('api') || f.includes('loader')))) {
            modpackLoader = 'fabric'
            console.log(`[Modrinth] Detected fabric from file: ${modFiles.find(f => f.toLowerCase().includes('fabric'))}`)
            break
          }
          if (modFileNames.some(f => f.includes('forge') && !f.includes('forgeconfigapiport') && !f.includes('forge-config-api-port'))) {
            modpackLoader = 'forge'
            console.log(`[Modrinth] Detected forge from file: ${modFiles.find(f => f.toLowerCase().includes('forge'))}`)
            break
          }
        }
      }
      console.log(`[Modrinth] After fallback scan: modpackLoader=${modpackLoader}`)
    } catch (e) {
      console.warn('Failed to detect modpack loader by files:', e && e.message)
    }
    
    console.log(`[Modrinth] FINAL modpackLoader before profile: ${modpackLoader}`)
    
    // Store modpack-specific directory paths in profile (reuse modpackDir from line 702)
    const metaProjectIdForProfile = version.project_id || projectId
    const modpackProfileDir = path.join(modpacksPath, `${metaProjectIdForProfile}-${version.id}`)
    const modpackProfile = {
      id: `modpack-${projectId}`,
      name: `Modpack: ${project.title}`,
      versionId: gameVersionModpack,
      ram: 'global',
      javaPath: 'java',
      username: '',
      loader: modpackLoader,
      fullscreenMode: 'global',
      modpackPath: modpackProfileDir
    }

    // Try to auto-select a loader version when possible
    // Use same logic as profile creation (getLoaderVersions API)
    try {
      console.log(`[Modrinth] Auto-selecting ${modpackLoader} version for Minecraft ${gameVersionModpack}`)

      let selectedVersion = null

      if (modpackLoader === 'fabric') {
        const loaders = await getLoaderArtifactListFor(gameVersionModpack)
        const list = Array.isArray(loaders) ? loaders : Object.values(loaders || {})
        const versions = list
          .map((item) => ({
            version: item?.loader?.version || item?.version || '',
            label: item?.loader?.version || item?.version || '',
            stable: item?.loader?.stable || false
          }))
          .filter((item) => item.version)

        // Priority: modpack required version, then latest stable
        if (modpackLoaderRequiredVersion) {
          selectedVersion = versions.find(v => v.version === modpackLoaderRequiredVersion)
          if (selectedVersion) {
            console.log(`[Modrinth] Using modpack required Fabric version: ${selectedVersion.version}`)
          }
        }
        if (!selectedVersion) {
          const stableVersions = versions
            .filter(v => v.stable)
            .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }))
          if (stableVersions.length > 0) {
            selectedVersion = stableVersions[0] // latest stable
            console.log(`[Modrinth] Using latest stable Fabric version: ${selectedVersion.version}`)
          } else {
            selectedVersion = [...versions].sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }))[0] // latest available
            console.log(`[Modrinth] Using latest available Fabric version: ${selectedVersion.version}`)
          }
        }

      } else if (modpackLoader === 'quilt') {
        const loaders = await getQuiltLoaderVersionsByMinecraft({ minecraftVersion: gameVersionModpack })
        const list = Array.isArray(loaders) ? loaders : Object.values(loaders || {})
        const versions = list
          .map((item) => ({
            version: item?.loader?.version || item?.version || '',
            label: item?.loader?.version || item?.version || '',
            stable: item?.loader?.stable || false
          }))
          .filter((item) => item.version)

        const stableVersions = versions
          .filter(v => v.stable)
          .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }))
        if (stableVersions.length > 0) {
          selectedVersion = stableVersions[0] // latest stable
          console.log(`[Modrinth] Using latest stable Quilt version: ${selectedVersion.version}`)
        } else {
          selectedVersion = [...versions].sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }))[0] // latest available
          console.log(`[Modrinth] Using latest available Quilt version: ${selectedVersion.version}`)
        }

      } else if (modpackLoader === 'forge') {
        const result = await getForgeVersionList({ minecraft: gameVersionModpack })
        const versions = Array.isArray(result) ? result : result?.versions || Object.values(result || {})
        const forgeVersions = versions
          .map((item) => ({
            version: item.version,
            label: item.version,
            mcversion: item.mcversion,
            stable: item?.stable || false
          }))
          .filter((item) => item.version)

        let selected = forgeVersions.find((item) => item.stable) || forgeVersions[0]
        if (selected) {
          selectedVersion = { version: selected.version }
          console.log(`[Modrinth] Using stable Forge version: ${selectedVersion.version}`)
        }

      } else if (modpackLoader === 'neoforge') {
        const versions = await getNeoForgedVersionsFromMaven(gameVersionModpack)
        const neoforgeVersions = versions
          .map((item) => ({
            version: item.version,
            label: item.version,
            mcversion: item.mcversion,
            stable: item.stable
          }))
          .filter((item) => item.version)

        const stableVersions = neoforgeVersions.filter(v => v.stable)
        if (stableVersions.length > 0) {
          selectedVersion = stableVersions[0] // latest stable
          console.log(`[Modrinth] Using latest stable NeoForge version: ${selectedVersion.version}`)
        } else {
          selectedVersion = neoforgeVersions[0] // latest available
          console.log(`[Modrinth] Using latest available NeoForge version: ${selectedVersion.version}`)
        }
      }

      if (selectedVersion) {
        modpackProfile.loaderVersion = selectedVersion.version
        console.log(`[Modrinth] Selected ${modpackLoader} version:`, modpackProfile.loaderVersion)
      } else {
        console.warn(`[Modrinth] No ${modpackLoader} version found for Minecraft ${gameVersionModpack}`)
      }
    } catch (e) {
      console.warn('Auto-select loader version failed:', e && e.message)
    }
    
    console.log(`[Modrinth] Creating profile: name=${modpackProfile.name}, versionId=${modpackProfile.versionId}, loader=${modpackProfile.loader}, loaderVersion=${modpackProfile.loaderVersion}`)
    await saveProfile(modpackProfile)
    console.log(`[Modrinth] Saved profile successfully with loaderVersion=${modpackProfile.loaderVersion}`)
    // Update meta file with project title for UI mapping
    try {
      const metaPath = path.join(modpacksPath, `${metaProjectIdForProfile}-${version.id}.meta.json`)
      if (fsSync.existsSync(metaPath)) {
        const meta = await readJson(metaPath, {})
        meta.projectTitle = project.title
        meta.gameVersion = gameVersionModpack
        meta.detectedLoader = modpackLoader
        meta.loaderVersion = modpackProfile.loaderVersion || ''
        meta.custom = false
        if (!meta.installed) meta.installed = { mods: [], resourcepacks: [], shaderpacks: [] }
        await saveJson(metaPath, meta)
      } else {
        await saveJson(metaPath, {
          projectId,
          versionId: version.id,
          projectTitle: project.title,
          gameVersion: gameVersionModpack,
          installed: { mods: [], resourcepacks: [], shaderpacks: [] },
          detectedLoader: modpackLoader,
          loaderVersion: modpackProfile.loaderVersion || '',
          custom: false,
          installedAt: Date.now()
        })
      }
    } catch (e) {
      console.warn('Failed to update modpack meta with title:', e && e.message)
    }
    return { success: true, profile: modpackProfile }
  }

  const target = await resolveModrinthInstallTarget(options)
  const effectiveGameVersion = gameVersion || target.gameVersion || project.game_versions?.[0] || ''
  const effectiveLoader = getModrinthLoaderForProjectType(projectType, loader || target.loader)

  if (projectType === 'mod' && !effectiveLoader) {
    throw new Error('В выбранном модпаке Vanilla нет модлоадера для установки модов')
  }

  const version = chooseModrinthVersion(versions, effectiveGameVersion, effectiveLoader)

  if (!version) {
    const targetText = [
      effectiveGameVersion,
      effectiveLoader ? effectiveLoader : null
    ].filter(Boolean).join(' / ')
    throw new Error(`Нет совместимой версии "${project.title}" для ${targetText || 'выбранного модпака'}`)
  }

  const installResult = await installModrinthVersion(version, {
    projectType,
    gameVersion: effectiveGameVersion,
    loader: effectiveLoader,
    project,
    targetProfileId: target.profile.id
  })
  console.log(`[Modrinth] Установлен проект: ${project.title} (${projectType}) -> ${target.profile.name}`)
  return {
    success: true,
    projectType,
    version: version.version_number || version.name,
    targetProfile: target.profile,
    fileName: installResult?.fileName
  }
}

async function getInstalledModrinthAddons() {
  const addons = []

  // Build mapping from installed filename -> modpack meta (if available)
  const originMap = {} // filenameLower -> origin meta
  const modpackMetaByKey = {}
  try {
    if (fsSync.existsSync(modpacksPath)) {
      const metaFiles = await fs.readdir(modpacksPath)
      for (const mf of metaFiles) {
        if (!mf.endsWith('.meta.json')) continue
        try {
          const meta = JSON.parse(fsSync.readFileSync(path.join(modpacksPath, mf), 'utf-8'))
          const modpackKey = mf.replace(/\.meta\.json$/, '')
          const origin = {
            modpackKey,
            projectId: meta.projectId || modpackKey,
            versionId: meta.versionId || null,
            detectedLoader: meta.detectedLoader || null,
            projectTitle: meta.projectTitle || modpackKey,
            gameVersion: meta.gameVersion || (Array.isArray(meta.gameVersions) ? meta.gameVersions[0] : ''),
            loaderVersion: meta.loaderVersion || '',
            custom: Boolean(meta.custom)
          }
          modpackMetaByKey[modpackKey] = origin
          if (meta.installed) {
            // Map all addon types: mods, shaderpacks, resourcepacks
            const addonTypes = ['mods', 'shaderpacks', 'resourcepacks']
            for (const type of addonTypes) {
              if (Array.isArray(meta.installed[type])) {
                for (const filename of meta.installed[type]) {
                  if (!filename) continue
                  const key = String(filename).toLowerCase()
                  originMap[key] = origin
                  // also map potential .disabled variant
                  originMap[key + '.disabled'] = origin
                }
              }
            }
          }
        } catch (e) {
          // ignore bad meta
        }
      }
    }
  } catch (e) {
    // ignore
  }

  const toAddonOrigin = (origin) => origin ? ({
    modpackKey: origin.modpackKey,
    modpackId: origin.projectId,
    modpackVersion: origin.versionId,
    detectedLoader: origin.detectedLoader,
    projectTitle: origin.projectTitle,
    gameVersion: origin.gameVersion,
    loaderVersion: origin.loaderVersion,
    custom: origin.custom
  }) : null

  const scanDirectory = async (directory, type, inferredOrigin = null) => {
    try {
      const entries = await fs.readdir(directory, { withFileTypes: true })
      for (const entry of entries) {
        if (!entry.isFile()) continue
        const enabled = !entry.name.endsWith('.disabled')
        const cleanName = enabled ? entry.name : entry.name.replace(/\.disabled$/, '')
        const nameLower = entry.name.toLowerCase()
        const cleanNameLower = cleanName.toLowerCase()
        const origin = toAddonOrigin(inferredOrigin || originMap[nameLower] || originMap[cleanNameLower])
        addons.push({
          id: `${type}:${path.resolve(directory, entry.name)}`,
          name: cleanName,
          type,
          enabled,
          path: path.join(directory, entry.name),
          origin
        })
      }
    } catch {
      // ignore
    }
  }

  // Scan main directories
  await scanDirectory(modsPath, 'mods')
  await scanDirectory(shaderpacksPath, 'shaderpacks')
  await scanDirectory(resourcepacksPath, 'resourcepacks')

  // Also scan modpack directories
  try {
    if (fsSync.existsSync(modpacksPath)) {
      const modpackDirs = await fs.readdir(modpacksPath, { withFileTypes: true })
      for (const dir of modpackDirs) {
        if (!dir.isDirectory()) continue

        // Check if this is a modpack directory (has modrinth.index.json or meta.json)
        const modpackPath = path.join(modpacksPath, dir.name)
        const hasIndex = fsSync.existsSync(path.join(modpackPath, 'modrinth.index.json'))
        const hasMeta = fsSync.existsSync(path.join(modpacksPath, `${dir.name}.meta.json`))
        const hasAddonDirs = fsSync.existsSync(path.join(modpackPath, 'mods')) ||
          fsSync.existsSync(path.join(modpackPath, 'shaderpacks')) ||
          fsSync.existsSync(path.join(modpackPath, 'resourcepacks'))

        if (hasIndex || hasMeta || hasAddonDirs) {
          const inferredOrigin = modpackMetaByKey[dir.name] || {
            modpackKey: dir.name,
            projectId: dir.name,
            versionId: '',
            detectedLoader: null,
            projectTitle: dir.name,
            gameVersion: '',
            loaderVersion: '',
            custom: false
          }
          // Scan subdirectories within the modpack
          await scanDirectory(path.join(modpackPath, 'mods'), 'mods', inferredOrigin)
          await scanDirectory(path.join(modpackPath, 'shaderpacks'), 'shaderpacks', inferredOrigin)
          await scanDirectory(path.join(modpackPath, 'resourcepacks'), 'resourcepacks', inferredOrigin)
        }
      }
    }
  } catch (error) {
    console.warn('Error scanning modpack directories:', error)
  }

  return addons
}

function getAddonDirectory(type) {
  if (type === 'mods') return modsPath
  if (type === 'shaderpacks') return shaderpacksPath
  if (type === 'resourcepacks') return resourcepacksPath
  throw new Error(`Неизвестный тип аддона: ${type}`)
}

function sanitizeManagedFileName(name) {
  const text = String(name || '').trim()
  if (!text || text.includes('\0') || text.includes('/') || text.includes('\\') || path.basename(text) !== text) {
    throw new Error('Некорректное имя файла')
  }
  return text
}

function isPathInside(parentPath, childPath) {
  const resolvedParent = path.resolve(parentPath)
  const resolvedChild = path.resolve(childPath)
  return resolvedChild === resolvedParent || resolvedChild.startsWith(resolvedParent + path.sep)
}

function resolveManagedAddonPath(type, addonPath) {
  if (!addonPath) return null
  try {
    const resolvedPath = path.resolve(addonPath)
    const mainDirectory = getAddonDirectory(type)
    if (isPathInside(mainDirectory, resolvedPath)) return resolvedPath
    if (modpacksPath && isPathInside(modpacksPath, resolvedPath)) return resolvedPath
  } catch {
    return null
  }
  return null
}

async function toggleInstalledAddon(type, name, enabled, addonPath = null) {
  // name is always the clean name without .disabled
  // The actual file might be name or name + '.disabled'
  const safeName = sanitizeManagedFileName(name)
  const possibleNames = [safeName, `${safeName}.disabled`]

  // First try the main directory
  const mainDirectory = getAddonDirectory(type)
  let currentPath = resolveManagedAddonPath(type, addonPath)

  if (!currentPath || !fsSync.existsSync(currentPath)) {
    currentPath = null
    for (const possibleName of possibleNames) {
      const testPath = path.join(mainDirectory, possibleName)
      if (fsSync.existsSync(testPath)) {
        currentPath = testPath
        break
      }
    }
  }

  // If not found in main directory, try modpack directories
  if (!currentPath) {
    try {
      if (fsSync.existsSync(modpacksPath)) {
        const modpackDirs = await fs.readdir(modpacksPath, { withFileTypes: true })
        for (const dir of modpackDirs) {
          if (!dir.isDirectory()) continue
          const modpackPath = path.join(modpacksPath, dir.name)
          for (const possibleName of possibleNames) {
            const modpackAddonPath = path.join(modpackPath, type, possibleName)
            if (fsSync.existsSync(modpackAddonPath)) {
              currentPath = modpackAddonPath
              break
            }
          }
          if (currentPath) break
        }
      }
    } catch (error) {
      // Ignore errors when searching modpack directories
    }
  }

  if (!currentPath) {
    throw new Error(`Файл не найден: ${safeName}`)
  }

  const targetName = enabled ? safeName : `${safeName}.disabled`
  const targetPath = path.join(path.dirname(currentPath), targetName)
  if (!resolveManagedAddonPath(type, targetPath)) {
    throw new Error('Некорректный путь файла')
  }

  await fs.rename(currentPath, targetPath)
}

async function deleteInstalledAddon(type, name, addonPath = null) {
  // name is always the clean name without .disabled
  // The actual file might be name or name + '.disabled'
  const safeName = sanitizeManagedFileName(name)
  const possibleNames = [safeName, `${safeName}.disabled`]

  // First try the main directory
  const mainDirectory = getAddonDirectory(type)
  let targetPath = resolveManagedAddonPath(type, addonPath)

  if (!targetPath || !fsSync.existsSync(targetPath)) {
    targetPath = null
    for (const possibleName of possibleNames) {
      const testPath = path.join(mainDirectory, possibleName)
      if (fsSync.existsSync(testPath)) {
        targetPath = testPath
        break
      }
    }
  }

  // If not found in main directory, try modpack directories
  if (!targetPath) {
    try {
      if (fsSync.existsSync(modpacksPath)) {
        const modpackDirs = await fs.readdir(modpacksPath, { withFileTypes: true })
        for (const dir of modpackDirs) {
          if (!dir.isDirectory()) continue
          const modpackPath = path.join(modpacksPath, dir.name)
          for (const possibleName of possibleNames) {
            const modpackAddonPath = path.join(modpackPath, type, possibleName)
            if (fsSync.existsSync(modpackAddonPath)) {
              targetPath = modpackAddonPath
              break
            }
          }
          if (targetPath) break
        }
      }
    } catch (error) {
      // Ignore errors when searching modpack directories
    }
  }

  if (!targetPath) {
    throw new Error(`Файл не найден: ${safeName}`)
  }

  await fs.rm(targetPath, { recursive: true, force: true })
}

async function deleteModpackDirectory(modpackKey) {
  const safeModpackKey = sanitizeManagedFileName(modpackKey)
  const dirPath = path.join(modpacksPath, safeModpackKey)
  const metaPath = path.join(modpacksPath, `${safeModpackKey}.meta.json`)
  if (!isPathInside(modpacksPath, dirPath) || !isPathInside(modpacksPath, metaPath)) {
    throw new Error('Некорректный путь модпака')
  }

  if (fsSync.existsSync(dirPath)) {
    await fs.rm(dirPath, { recursive: true, force: true })
    console.log(`Deleted modpack directory: ${dirPath}`)
  }
  if (fsSync.existsSync(metaPath)) {
    await fs.unlink(metaPath)
    console.log(`Deleted modpack meta: ${metaPath}`)
  }

  try {
    const resolvedDirPath = path.resolve(dirPath)
    const profiles = await getProfiles()
    const filteredProfiles = profiles.filter((profile) => {
      if (!profile?.modpackPath) return true
      try {
        return path.resolve(profile.modpackPath) !== resolvedDirPath
      } catch {
        return true
      }
    })

    if (filteredProfiles.length !== profiles.length) {
      await fs.writeFile(profilesPath, JSON.stringify(filteredProfiles, null, 2), 'utf-8')
      console.log(`Deleted ${profiles.length - filteredProfiles.length} modpack profile(s) for ${modpackKey}`)
    }
  } catch (error) {
    console.warn('Failed to prune modpack profiles:', error && error.message)
  }

  return true
}

async function runConcurrentTasks(items, worker, concurrency = 4) {
  const queue = [...items]
  const active = []
  while (queue.length > 0 || active.length > 0) {
    while (queue.length > 0 && active.length < concurrency) {
      const item = queue.shift()
      const promise = worker(item).finally(() => {
        const index = active.indexOf(promise)
        if (index >= 0) active.splice(index, 1)
      })
      active.push(promise)
    }
    if (active.length > 0) {
      await Promise.race(active)
    }
  }
}

async function fetchVersionManifest() {
  const response = await axios.get('https://launchermeta.mojang.com/mc/game/version_manifest_v2.json')
  return response.data.versions.map((entry) => ({ id: entry.id, type: entry.type, releaseTime: entry.releaseTime, url: entry.url }))
}

async function getInstalledVersions() {
  const items = await fs.readdir(versionsPath, { withFileTypes: true })
  return items.filter((item) => item.isDirectory()).map((item) => ({ id: item.name, status: 'Установлено', path: path.join(versionsPath, item.name) }))
}

async function deleteInstalledVersion(versionId) {
  const safeVersionId = sanitizeManagedFileName(versionId)
  const versionDir = path.join(versionsPath, safeVersionId)
  try {
    await fs.rm(versionDir, { recursive: true, force: true })
  } catch (error) {
    console.error(`Не удалось удалить версию ${safeVersionId}:`, error)
    throw new Error(`Не удалось удалить версию ${safeVersionId}`)
  }
}

function makeHash(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

async function downloadVersion(versionId, event) {
  const manifest = await axios.get('https://launchermeta.mojang.com/mc/game/version_manifest_v2.json')
  const entry = manifest.data.versions.find((item) => item.id === versionId)
  if (!entry) throw new Error('Версия не найдена')

  const versionDir = path.join(versionsPath, versionId)
  await fs.mkdir(versionDir, { recursive: true })

  const versionData = await axios.get(entry.url)
  const versionJson = versionData.data
  await fs.writeFile(path.join(versionDir, 'version.json'), JSON.stringify(versionJson, null, 2), 'utf-8')
  event?.sender.send('launcher:installProgress', { message: `Загружены метаданные ${versionId}` })

  const client = versionJson.downloads?.client
  if (client?.url) {
    await downloadFile(client.url, path.join(versionDir, `${versionId}.jar`))
    event?.sender.send('launcher:installProgress', { message: `Загружен клиент ${versionId}` })
  }

  const libraryDownloads = versionJson.libraries || []
  if (libraryDownloads.length > 0) {
    let libraryCount = 0
    await runConcurrentTasks(libraryDownloads, async (library) => {
      if (!library.downloads?.artifact?.url) return
      const libraryPath = library.downloads.artifact.path
      await downloadFile(library.downloads.artifact.url, path.join(versionDir, 'libraries', libraryPath))
      libraryCount += 1
      if (libraryCount % 8 === 0 || libraryCount === libraryDownloads.length) {
        event?.sender.send('launcher:installProgress', { message: `Библиотеки: ${libraryCount}/${libraryDownloads.length}` })
      }
    }, 3)
  }

  const assetsIndex = versionJson.assets ? versionJson.assetIndex : null
  if (assetsIndex?.url) {
    const assetIndexResponse = await axios.get(assetsIndex.url)
    await fs.writeFile(path.join(versionDir, 'assetIndex.json'), JSON.stringify(assetIndexResponse.data, null, 2), 'utf-8')
    const objects = assetIndexResponse.data.objects || {}
    const hashes = Object.values(objects).map((obj) => obj.hash)
    let assetCount = 0
    await runConcurrentTasks(hashes, async (hash) => {
      const subdir = hash.slice(0, 2)
      const assetUrl = `https://resources.download.minecraft.net/${subdir}/${hash}`
      await downloadFile(assetUrl, path.join(versionDir, 'assets', 'objects', subdir, hash))
      assetCount += 1
      if (assetCount % 40 === 0 || assetCount === hashes.length) {
        event?.sender.send('launcher:installProgress', { message: `Активы: ${assetCount}/${hashes.length}` })
      }
    }, 2)
  }
}

async function ensureBaseVersionInstalled(versionId, event) {
  const versionDir = path.join(versionsPath, versionId)
  await fs.mkdir(versionDir, { recursive: true })

  // Try to find an existing JSON under either <id>.json or version.json
  const candidateJson1 = path.join(versionDir, `${versionId}.json`)
  const candidateJson2 = path.join(versionDir, 'version.json')
  let versionJson = null
  let versionJsonPath = null
  if (fsSync.existsSync(candidateJson1)) {
    versionJson = JSON.parse(fsSync.readFileSync(candidateJson1, 'utf-8'))
    versionJsonPath = candidateJson1
  } else if (fsSync.existsSync(candidateJson2)) {
    versionJson = JSON.parse(fsSync.readFileSync(candidateJson2, 'utf-8'))
    versionJsonPath = candidateJson2
  }

  if (!versionJson) {
    // Fetch manifest and download the version JSON
    const manifest = await axios.get('https://launchermeta.mojang.com/mc/game/version_manifest_v2.json')
    const entry = manifest.data.versions.find((item) => item.id === versionId)
    if (!entry) throw new Error(`Версия ${versionId} не найдена в манифесте`)
    const versionData = await axios.get(entry.url)
    versionJson = versionData.data
    // save under both possible names for compatibility
    await fs.writeFile(path.join(versionDir, `${versionId}.json`), JSON.stringify(versionJson, null, 2), 'utf-8')
    await fs.writeFile(path.join(versionDir, 'version.json'), JSON.stringify(versionJson, null, 2), 'utf-8')
    versionJsonPath = path.join(versionDir, `${versionId}.json`)
    event?.sender.send('launcher:installProgress', { message: `Загружены метаданные ${versionId}` })
  }

  // Ensure client jar is present (so MCLC won't try to download it)
  const jarPath = path.join(versionDir, `${versionId}.jar`)
  if (!fsSync.existsSync(jarPath) && versionJson.downloads && versionJson.downloads.client && versionJson.downloads.client.url) {
    event?.sender.send('launcher:installProgress', { message: `Загружаю клиент ${versionId}` })
    await downloadFile(versionJson.downloads.client.url, jarPath)
  }

  return { versionJsonPath, versionJson }
}

async function findForgeInstallerJar(root) {
  const libsDir = path.join(root, 'libraries', 'net', 'minecraftforge', 'forge')
  if (!fsSync.existsSync(libsDir)) return null

  try {
    const versions = await fs.readdir(libsDir, { withFileTypes: true })
    let best = null
    let bestMtime = 0

    for (const versionDir of versions) {
      if (!versionDir.isDirectory()) continue
      const versionPath = path.join(libsDir, versionDir.name)
      const files = await fs.readdir(versionPath, { withFileTypes: true })

      for (const file of files) {
        if (!file.isFile()) continue
        const name = file.name.toLowerCase()
        // Prefer installer.jar, then universal.jar
        if (name.includes('installer.jar')) {
          return path.join(versionPath, file.name)
        }
        if (name.includes('universal.jar')) {
          const stat = fsSync.statSync(path.join(versionPath, file.name))
          const mtime = stat.mtimeMs || 0
          if (mtime >= bestMtime) {
            bestMtime = mtime
            best = path.join(versionPath, file.name)
          }
        }
      }
    }
    return best
  } catch (error) {
    console.warn('Error finding forge installer:', error && error.message)
    return null
  }
}

function filterQuiltProblematicLibraries(versionJson) {
  // Remove libraries that reference problematic service loaders or old launchwrapper
  if (!versionJson.libraries || !Array.isArray(versionJson.libraries)) return versionJson

  const problematicPatterns = [
    'minecraftforge' // Quilt should not need forge libs
    // NOTE: do NOT remove 'sponge-mixin' here — Quilt needs the Mixin bootstrap classes
    // NOTE: launchwrapper IS NEEDED for Quilt Mixin service (LaunchClassLoader)
  ]

  let filtered = versionJson.libraries.filter(lib => {
    const name = lib.name || ''
    const lowerName = name.toLowerCase()
    return !problematicPatterns.some(pattern => lowerName.includes(pattern.toLowerCase()))
  })

  filtered = filtered.map(lib => {
    if (lib.name === 'net.fabricmc:sponge-mixin:0.12.5+mixin.0.8.5') {
      return {
        ...lib,
        name: 'net.fabricmc:sponge-mixin:0.17.1+mixin.0.8.7'
      }
    }
    return lib
  })

  // Also clear any problematic arguments that might reference launchwrapper
  const cleanedJson = {
    ...versionJson,
    libraries: filtered
  }

  if (cleanedJson.arguments?.jvm) {
    cleanedJson.arguments.jvm = cleanedJson.arguments.jvm.filter(
      arg => !String(arg).toLowerCase().includes('fml') &&
             !String(arg).toLowerCase().includes('forge')
    )
  }

  return cleanedJson
}

async function getProfiles() {
  return await readJson(profilesPath, [])
}

async function saveProfile(profile) {
  const profiles = await getProfiles()
  const existing = profiles.find((item) => item.id === profile.id)
  if (existing) {
    const updated = profiles.map((item) => (item.id === profile.id ? profile : item))
    await fs.writeFile(profilesPath, JSON.stringify(updated, null, 2), 'utf-8')
  } else {
    profiles.push(profile)
    await fs.writeFile(profilesPath, JSON.stringify(profiles, null, 2), 'utf-8')
  }
}

async function deleteProfile(profileId) {
  const profiles = await getProfiles()
  const filtered = profiles.filter((item) => item.id !== profileId)
  await fs.writeFile(profilesPath, JSON.stringify(filtered, null, 2), 'utf-8')
}

async function getSettings() {
  const storedSettings = await readJson(settingsPath, defaultLauncherSettings)
  return { ...defaultLauncherSettings, ...(storedSettings || {}) }
}

async function saveSettings(settings) {
  await fs.writeFile(settingsPath, JSON.stringify({ ...defaultLauncherSettings, ...(settings || {}) }, null, 2), 'utf-8')
}

function normalizeMinecraftUsername(value) {
  const name = String(value || '').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 16)
  return name.length >= 3 ? name : ''
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function getSystemRamGB() {
  const oneGB = 1024 * 1024 * 1024
  return {
    total: Math.max(1, Math.round(os.totalmem() / oneGB)),
    free: Math.max(1, Math.round(os.freemem() / oneGB))
  }
}

async function detectWindowsKuroBoostHardware() {
  if (process.platform !== 'win32') return {}

  const script = [
    '$gpu = Get-CimInstance Win32_VideoController -ErrorAction SilentlyContinue | Select-Object Name, AdapterRAM',
    '$disk = Get-PhysicalDisk -ErrorAction SilentlyContinue | Select-Object FriendlyName, MediaType',
    '$battery = Get-CimInstance Win32_Battery -ErrorAction SilentlyContinue',
    '[pscustomobject]@{ gpu = $gpu; disks = $disk; laptop = [bool]$battery } | ConvertTo-Json -Compress -Depth 4'
  ].join('; ')

  try {
    const { stdout } = await execFileAsync('powershell.exe', ['-NoProfile', '-Command', script], {
      timeout: 5000,
      windowsHide: true,
      maxBuffer: 1024 * 1024
    })
    return JSON.parse(String(stdout || '{}').trim() || '{}')
  } catch (error) {
    if (verboseLaunchLogging) console.warn('KuroBoost hardware probe failed:', error && error.message)
    return {}
  }
}

function normalizeHardwareList(value) {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

async function getKuroBoostHardwareProfile() {
  const cpus = os.cpus() || []
  const ram = getSystemRamGB()
  const windowsProbe = await detectWindowsKuroBoostHardware()
  const gpus = normalizeHardwareList(windowsProbe.gpu)
    .map((item) => ({
      name: String(item?.Name || '').trim(),
      vramGB: item?.AdapterRAM ? Math.max(0, Math.round(Number(item.AdapterRAM) / (1024 * 1024 * 1024))) : 0
    }))
    .filter((item) => item.name)
  const disks = normalizeHardwareList(windowsProbe.disks)
    .map((item) => ({
      name: String(item?.FriendlyName || '').trim(),
      type: String(item?.MediaType || '').trim()
    }))
    .filter((item) => item.name || item.type)

  return {
    cpu: {
      model: cpus[0]?.model || os.arch(),
      cores: cpus.length || 1
    },
    ram,
    gpu: gpus,
    disks,
    laptop: Boolean(windowsProbe.laptop),
    platform: `${os.type()} ${os.release()} ${os.arch()}`
  }
}

function getKuroBoostFileList(directory, extensions) {
  try {
    if (!directory || !fsSync.existsSync(directory)) return []
    return fsSync.readdirSync(directory, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => extensions.some((ext) => name.toLowerCase().endsWith(ext)))
  } catch {
    return []
  }
}

function getKuroBoostModKey(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/\.disabled$/i, '')
    .replace(/\.(jar|zip)$/i, '')
    .replace(/(?:^|[-_.+ ])(?:mc|forge|fabric|quilt|neoforge)?\d+(?:\.\d+){1,4}[\w.+-]*/g, '')
    .replace(/[-_.+ ]+/g, '')
}

function scanKuroBoostGameState(gameDirectory) {
  const mods = getKuroBoostFileList(path.join(gameDirectory, 'mods'), ['.jar', '.jar.disabled'])
  const shaderpacks = getKuroBoostFileList(path.join(gameDirectory, 'shaderpacks'), ['.zip', '.zip.disabled'])
  const resourcepacks = getKuroBoostFileList(path.join(gameDirectory, 'resourcepacks'), ['.zip', '.zip.disabled'])
  const normalized = mods.map((name) => ({ name, key: getKuroBoostModKey(name) })).filter((item) => item.key)
  const duplicates = []
  const byKey = new Map()

  for (const item of normalized) {
    const list = byKey.get(item.key) || []
    list.push(item.name)
    byKey.set(item.key, list)
  }

  for (const list of byKey.values()) {
    if (list.length > 1) duplicates.push(list)
  }

  const lowerNames = mods.map((name) => name.toLowerCase())
  const has = (pattern) => lowerNames.some((name) => pattern.test(name))
  const warnings = []

  if (has(/sodium/) && has(/optifine/)) warnings.push('Sodium и OptiFine обычно конфликтуют: оставьте один рендер-пайплайн.')
  if (has(/sodium/) && has(/embeddium/)) warnings.push('Sodium и Embeddium выполняют одну роль; дубликат может ломать запуск.')
  if (has(/iris/) && has(/oculus/)) warnings.push('Iris и Oculus относятся к разным loader-экосистемам; проверьте совместимость.')
  if (has(/betterfoliage|better-foliage/)) warnings.push('BetterFoliage найден: на слабых GPU он часто даёт просадки frametime.')

  for (const list of duplicates.slice(0, 3)) {
    warnings.push(`Найден возможный дубликат мода: ${list.join(' / ')}`)
  }

  return {
    mods,
    shaderpacks,
    resourcepacks,
    warnings
  }
}

function recommendKuroBoostRam(profile, hardware, gameState) {
  const totalRam = hardware.ram.total
  const modCount = gameState.mods.length
  const shaderCount = gameState.shaderpacks.length
  const isModded = profile.loader && profile.loader !== 'vanilla'
  let recommended = isModded ? 5 : 4

  if (profile.modpackPath || modCount > 35) recommended = 6
  if (modCount > 80 || shaderCount > 0) recommended = 8
  if (modCount > 150) recommended = 10

  if (totalRam <= 8) recommended = Math.min(recommended, 3)
  else if (totalRam <= 12) recommended = Math.min(recommended, 4)
  else if (totalRam <= 16) recommended = Math.min(recommended, 6)
  else if (totalRam <= 24) recommended = Math.min(recommended, 8)

  return `${clampNumber(recommended, 2, Math.max(2, totalRam - 3))}G`
}

function buildKuroBoostGameOptions(profile, hardware, gameState) {
  const totalRam = hardware.ram.total
  const modCount = gameState.mods.length
  const hasShaders = gameState.shaderpacks.length > 0
  const isLaptop = hardware.laptop
  const isHeavyPack = profile.modpackPath || modCount > 55 || hasShaders
  const renderDistance = isLaptop
    ? 8
    : isHeavyPack
      ? (totalRam >= 24 ? 12 : 10)
      : (totalRam >= 16 ? 12 : 10)
  const maxFps = isLaptop ? 75 : 144

  return {
    renderDistance: String(renderDistance),
    simulationDistance: String(clampNumber(renderDistance - 2, 5, 10)),
    maxFps: String(maxFps),
    particles: isHeavyPack ? '1' : '0',
    mipmapLevels: totalRam <= 8 ? '2' : '4'
  }
}

function buildKuroBoostJvmArgs(hardware) {
  const args = [
    '-XX:+UseG1GC',
    '-XX:+ParallelRefProcEnabled',
    '-XX:+UnlockExperimentalVMOptions',
    '-XX:MaxGCPauseMillis=80',
    '-XX:+DisableExplicitGC',
    '-XX:+UseStringDeduplication',
    '-XX:+PerfDisableSharedMem',
    '-Dkuroboost.enabled=true',
    '-Dkuroboost.preset=ai-optimized'
  ]

  if (hardware.ram.total >= 16) {
    args.push('-XX:G1NewSizePercent=20', '-XX:G1ReservePercent=20')
  }

  return args
}

async function applyKuroBoostOptions(gameDirectory, optionsPatch) {
  try {
    await fs.mkdir(gameDirectory, { recursive: true })
    const optionsPath = path.join(gameDirectory, 'options.txt')
    const existing = fsSync.existsSync(optionsPath)
      ? String(await fs.readFile(optionsPath, 'utf-8')).split(/\r?\n/)
      : []
    const values = new Map()

    for (const line of existing) {
      const index = line.indexOf(':')
      if (index <= 0) continue
      values.set(line.slice(0, index), line.slice(index + 1))
    }

    for (const [key, value] of Object.entries(optionsPatch)) {
      values.set(key, value)
    }

    const keys = Array.from(values.keys())
    await fs.writeFile(optionsPath, keys.map((key) => `${key}:${values.get(key)}`).join('\n') + '\n', 'utf-8')
  } catch (error) {
    console.warn('KuroBoost failed to write Minecraft options:', error && error.message)
  }
}

async function prepareKuroBoostPlan(profile, settings, gameDirectory) {
  const enabled = settings?.kuroBoost !== false
  if (!enabled) {
    return { enabled, warnings: [] }
  }

  const hardware = await getKuroBoostHardwareProfile()
  const gameState = scanKuroBoostGameState(gameDirectory)

  return {
    enabled,
    preset: 'AI Optimized',
    hardware,
    gameState,
    recommendedRam: recommendKuroBoostRam(profile, hardware, gameState),
    gameOptions: buildKuroBoostGameOptions(profile, hardware, gameState),
    jvmArgs: buildKuroBoostJvmArgs(hardware),
    warnings: gameState.warnings
  }
}

async function writeKuroBoostPlan(gameDirectory, plan) {
  if (!plan?.enabled) return
  try {
    const planPath = path.join(gameDirectory, '.kuroboost', 'last-plan.json')
    await saveJson(planPath, {
      createdAt: new Date().toISOString(),
      preset: plan.preset,
      hardware: plan.hardware,
      gameState: {
        mods: plan.gameState.mods.length,
        shaderpacks: plan.gameState.shaderpacks.length,
        resourcepacks: plan.gameState.resourcepacks.length
      },
      recommendedRam: plan.recommendedRam,
      gameOptions: plan.gameOptions,
      jvmArgs: plan.jvmArgs,
      warnings: plan.warnings
    })
  } catch (error) {
    console.warn('KuroBoost failed to write plan:', error && error.message)
  }
}

async function getAuthState() {
  const auth = await readJson(authPath, {})
  if (auth.email && auth.loggedIn) {
    return auth
  }
  return { email: '', loggedIn: false }
}

function normalizeUserProperties(value) {
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value !== null) return JSON.stringify(value)
  return '{}'
}

async function refreshStoredAuth(authState) {
  try {
    const refreshed = await Authenticator.refreshAuth(authState.access_token, authState.client_token)
    if (!refreshed || !refreshed.access_token || !refreshed.client_token) return null

    const result = {
      ...authState,
      ...refreshed,
      email: authState.email,
      password: authState.password,
      loggedIn: true
    }
    await fs.writeFile(authPath, JSON.stringify(result, null, 2), 'utf-8')
    return result
  } catch {
    return null
  }
}

async function loginUser(email, password) {
  const auth = await readJson(authPath, {})

  // Try local stored auth first.
  if (auth.email === email && auth.password === makeHash(password)) {
    const result = { ...auth, loggedIn: true }
    await fs.writeFile(authPath, JSON.stringify(result, null, 2), 'utf-8')
    return { email, loggedIn: true, message: 'Вход выполнен' }
  }

  // Try authenticating with Mojang using the launcher authenticator.
  try {
    const user = await Authenticator.getAuth(email, password)
    const result = {
      ...user,
      email,
      password: makeHash(password),
      loggedIn: true
    }
    await fs.writeFile(authPath, JSON.stringify(result, null, 2), 'utf-8')
    return { email, loggedIn: true, message: 'Вход выполнен онлайн' }
  } catch (error) {
    console.error('Online auth failed:', error)
  }

  return { email: '', loggedIn: false, message: 'Неверный email или пароль' }
}

async function registerUser(email, password) {
  const auth = await readJson(authPath, {})
  if (auth.email) {
    return { email: '', loggedIn: false, message: 'Пользователь уже зарегистрирован' }
  }
  const hashed = makeHash(password)
  const result = { email, password: hashed, loggedIn: true }
  await fs.writeFile(authPath, JSON.stringify(result, null, 2), 'utf-8')
  return { email, loggedIn: true, message: 'Регистрация прошла успешно' }
}

function isExecutable(pathToFile) {
  try {
    return fsSync.existsSync(pathToFile)
  } catch {
    return false
  }
}

function getJavaVersionMajor(candidate) {
  try {
    const result = require('child_process').spawnSync(candidate, ['-version'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    const output = `${result.stdout || ''}\n${result.stderr || ''}`
    const match = output.match(/version "(\d+)(?:\.(\d+))?/) || output.match(/openjdk version "(\d+)(?:\.(\d+))?/) || output.match(/java version "(\d+)(?:\.(\d+))?/) 
    if (!match) return null
    let major = parseInt(match[1], 10)
    if (major === 1) {
      major = parseInt(match[2] || '0', 10)
    }
    return result.status === 0 ? major : null
  } catch {
    return null
  }
}

function testJava(candidate, minMajor = 17) {
  const major = getJavaVersionMajor(candidate)
  return major !== null && major >= minMajor
}

function getClassFileMajorVersion(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 8) return null
  if (buffer.readUInt32BE(0) !== 0xCAFEBABE) return null
  return buffer.readUInt16BE(6)
}

function mapClassFileMajorToJavaMajor(classFileMajor) {
  if (typeof classFileMajor !== 'number' || classFileMajor < 45) return null
  return classFileMajor - 44
}

function getRequiredJavaMajorFromJar(jarPath, mainClass = 'net.minecraft.client.main.Main') {
  try {
    if (!jarPath || !fsSync.existsSync(jarPath)) return null
    const zip = new AdmZip(jarPath)
    const preferredEntries = Array.from(new Set([
      typeof mainClass === 'string' && mainClass
        ? `${mainClass.replace(/\./g, '/')}.class`
        : null,
      'net/minecraft/client/main/Main.class'
    ].filter(Boolean)))

    for (const entryName of preferredEntries) {
      const entry = zip.getEntry(entryName)
      if (!entry) continue
      const classFileMajor = getClassFileMajorVersion(entry.getData())
      const javaMajor = mapClassFileMajorToJavaMajor(classFileMajor)
      if (javaMajor !== null) return javaMajor
    }

    const fallbackEntries = zip.getEntries()
      .filter((entry) => !entry.isDirectory && entry.entryName.endsWith('.class'))
      .slice(0, 200)
    let detectedJavaMajor = null
    for (const entry of fallbackEntries) {
      const classFileMajor = getClassFileMajorVersion(entry.getData())
      const javaMajor = mapClassFileMajorToJavaMajor(classFileMajor)
      if (javaMajor === null) continue
      detectedJavaMajor = detectedJavaMajor === null ? javaMajor : Math.max(detectedJavaMajor, javaMajor)
    }
    return detectedJavaMajor
  } catch (error) {
    console.warn(`Failed to inspect client jar for Java requirement (${jarPath}):`, error.message)
    return null
  }
}

function inferRequiredJavaMajorFromVersionData(data, versionId) {
  let majorVersion = 17
  if (data.javaVersion && typeof data.javaVersion.majorVersion === 'number') {
    majorVersion = data.javaVersion.majorVersion
  } else if (data.javaVersion && typeof data.javaVersion.component === 'string') {
    const match = data.javaVersion.component.match(/(\d+)/)
    if (match) majorVersion = parseInt(match[1], 10)
  } else {
    const parts = String(versionId || '').split('.').map((part) => parseInt(part, 10) || 0)
    if ((parts[0] === 1 && parts[1] >= 21) || parts[0] > 1) {
      majorVersion = 21
    }
  }
  return majorVersion
}

function inferJavaCompatibilityRangeFromVersionId(versionId) {
  const match = String(versionId || '').match(/^(\d+)\.(\d+)(?:\.(\d+))?/)
  if (!match) {
    return { minMajor: 17, maxMajor: null }
  }

  const major = parseInt(match[1], 10) || 0
  const minor = parseInt(match[2], 10) || 0
  const patch = parseInt(match[3] || '0', 10) || 0

  if (major !== 1) {
    return major > 1
      ? { minMajor: 21, maxMajor: null }
      : { minMajor: 17, maxMajor: null }
  }

  if (minor <= 16) {
    return { minMajor: 8, maxMajor: 15 }
  }
  if (minor === 17) {
    return { minMajor: 16, maxMajor: 16 }
  }
  if (minor < 20 || (minor === 20 && patch <= 4)) {
    return { minMajor: 17, maxMajor: 20 }
  }
  return { minMajor: 21, maxMajor: null }
}

function formatJavaCompatibilityRange(range) {
  if (!range || typeof range.minMajor !== 'number') return '17+'
  if (typeof range.maxMajor === 'number') {
    return range.minMajor === range.maxMajor
      ? `${range.minMajor}`
      : `${range.minMajor}-${range.maxMajor}`
  }
  return `${range.minMajor}+`
}

function resolveLoaderJvmArgs(loaderJsonPath, { loaderId, baseVersionId, root }) {
  try {
    if (!loaderJsonPath || !fsSync.existsSync(loaderJsonPath)) return []
    const json = JSON.parse(fsSync.readFileSync(loaderJsonPath, 'utf-8'))
    const jvmArgs = Array.isArray(json?.arguments?.jvm) ? json.arguments.jvm : []
    const libraryDirectory = path.join(root, 'libraries')
    const classpathSeparator = process.platform === 'win32' ? ';' : ':'
    const versionName = loaderId || baseVersionId
    const resolved = []

    const pushValue = (value) => {
      if (Array.isArray(value)) {
        for (const item of value) pushValue(item)
        return
      }
      if (typeof value !== 'string') return
      resolved.push(
        value
          .replace(/\$\{library_directory\}/g, libraryDirectory)
          .replace(/\$\{classpath_separator\}/g, classpathSeparator)
          .replace(/\$\{version_name\}/g, versionName)
      )
    }

    for (const entry of jvmArgs) {
      if (typeof entry === 'string') {
        pushValue(entry)
      } else if (entry && typeof entry === 'object' && 'value' in entry) {
        pushValue(entry.value)
      }
    }

    return resolved
  } catch (error) {
    console.warn('Failed to resolve loader JVM args:', error && error.message)
    return []
  }
}

function dedupeJvmArgsPreservingPairs(args) {
  if (!Array.isArray(args)) return []

  const result = []
  const seen = new Set()
  const optionsWithValue = new Set([
    '-p',
    '--module-path',
    '--upgrade-module-path',
    '--add-modules',
    '--add-reads',
    '--add-opens',
    '--add-exports',
    '--patch-module',
    '--limit-modules',
    '--enable-native-access'
  ])

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (typeof arg === 'string' && optionsWithValue.has(arg) && typeof args[i + 1] === 'string') {
      const key = `${arg}\0${args[i + 1]}`
      if (!seen.has(key)) {
        result.push(arg, args[i + 1])
        seen.add(key)
      }
      i += 1
      continue
    }

    const key = typeof arg === 'string' ? arg : JSON.stringify(arg)
    if (!seen.has(key)) {
      result.push(arg)
      seen.add(key)
    }
  }

  return result
}

function parseJavaArgsFile(argsFilePath) {
  try {
    if (!argsFilePath || !fsSync.existsSync(argsFilePath)) return []
    const content = fsSync.readFileSync(argsFilePath, 'utf-8')

    // Tokenize lines while handling quoted strings and ignoring comments
    const lines = content.split(/\r?\n/)
    const raw = []
    for (const line of lines) {
      const trimmed = (line || '').trim()
      if (!trimmed) continue
      if (trimmed.startsWith('#') || trimmed.startsWith('//')) continue

      const parts = trimmed.match(/(?:[^\s\"]+|\"[^\"]*\")+/g) || []
      for (let p of parts) {
        if (p.startsWith('"') && p.endsWith('"')) p = p.slice(1, -1)
        if (p) raw.push(p)
      }
    }

    // Some JVM options (like --add-opens/--add-exports/--add-reads) accept
    // multiple values. To avoid ambiguities when the launcher constructs
    // the final command line, convert each value into a separate
    // token of the form `--option=value`.
    const multiValueOpts = new Set(['--add-opens', '--add-exports', '--add-reads'])
    const result = []
    for (let i = 0; i < raw.length; i++) {
      const token = raw[i]
      if (!token) continue

      if (token.startsWith('-')) {
        if (multiValueOpts.has(token)) {
          // Collect subsequent non-flag tokens as values for this option
          const values = []
          let j = i + 1
          while (j < raw.length && !raw[j].startsWith('-')) {
            values.push(raw[j])
            j += 1
          }
          if (values.length === 0) {
            result.push(token)
          } else {
            for (const v of values) {
              result.push(`${token}=${v}`)
            }
            i = j - 1
          }
        } else {
          // Regular flag: if next token is a non-flag, pair it, otherwise keep single
          if (raw[i + 1] && !raw[i + 1].startsWith('-')) {
            result.push(token)
            result.push(raw[i + 1])
            i += 1
          } else {
            result.push(token)
          }
        }
      } else {
        // Non-flag token encountered -> likely the main class or game argument.
        // Stop parsing JVM arguments here and do not include application args.
        break
      }
    }

    return result
  } catch (error) {
    console.warn('Failed to parse Java args file:', error && error.message)
    return []
  }
}

function mergeJavaCompatibilityRanges(primaryRange, fallbackRange) {
  const normalizedPrimary = primaryRange || {}
  const normalizedFallback = fallbackRange || {}
  const minMajor = Math.max(
    typeof normalizedPrimary.minMajor === 'number' ? normalizedPrimary.minMajor : 0,
    typeof normalizedFallback.minMajor === 'number' ? normalizedFallback.minMajor : 0
  )

  const maxCandidates = [
    normalizedPrimary.maxMajor,
    normalizedFallback.maxMajor
  ].filter((value) => typeof value === 'number')
  const maxMajor = maxCandidates.length > 0 ? Math.min(...maxCandidates) : null

  if (typeof maxMajor === 'number' && maxMajor < minMajor) {
    return { minMajor, maxMajor: minMajor }
  }

  return { minMajor, maxMajor }
}

async function readInstalledVersionMetadata(versionId) {
  const versionDir = path.join(versionsPath, versionId)
  const candidates = [
    path.join(versionDir, `${versionId}.json`),
    path.join(versionDir, 'version.json')
  ]

  for (const versionFile of candidates) {
    if (!fsSync.existsSync(versionFile)) continue
    const data = await readJson(versionFile, null)
    if (data && typeof data === 'object') {
      return { data, versionFile }
    }
  }

  return null
}

async function getJavaCompatibilityRange(versionId) {
  try {
    const fallbackRange = inferJavaCompatibilityRangeFromVersionId(versionId)
    const metadata = await readInstalledVersionMetadata(versionId)
    const versionData = metadata?.data || null
    if (versionData) {
      const requiredMajor = inferRequiredJavaMajorFromVersionData(versionData, versionId)
      const range = mergeJavaCompatibilityRanges({ minMajor: requiredMajor, maxMajor: null }, fallbackRange)
      if (verboseLaunchLogging) console.log(`Detected required Java version: ${formatJavaCompatibilityRange(range)} (${metadata.versionFile})`)
      return range
    }

    const versionDir = path.join(versionsPath, versionId)
    const jarCandidates = [
      path.join(versionDir, `${versionId}.jar`),
      path.join(versionDir, 'client.jar')
    ]
    for (const jarPath of jarCandidates) {
      const jarJavaMajor = getRequiredJavaMajorFromJar(jarPath)
      if (jarJavaMajor !== null) {
        const range = mergeJavaCompatibilityRanges({ minMajor: jarJavaMajor, maxMajor: null }, fallbackRange)
        if (verboseLaunchLogging) console.log(`Detected required Java version from jar: ${formatJavaCompatibilityRange(range)} (${jarPath})`)
        return range
      }
    }

    if (verboseLaunchLogging) console.log(`Detected required Java version: ${formatJavaCompatibilityRange(fallbackRange)} (fallback by version id)`)
    return fallbackRange
  } catch (error) {
    console.warn(`Failed to detect required Java version for ${versionId}:`, error.message)
    return { minMajor: 17, maxMajor: null }
  }
}

function expandPath(value) {
  if (!value) return value
  return value.replace(/%([^%]+)%/g, (_, name) => process.env[name] || '')
}

function parseMemory(value) {
  if (typeof value === 'string' && value.trim()) {
    const match = value.trim().toUpperCase().match(/^(\d+)(G|M)?$/)
    if (match) {
      let requested = Number(match[1])
      if (match[2] === 'M') {
        requested = Math.floor(requested / 1024)
      }
      if (match[2] === undefined || match[2] === 'G') {
        return `${requested}G`
      }
    }
  }
  return '2G'
}



async function findJavaPath(preferredPath, minMajor = 17, maxMajor = null, event = null) {
  const candidates = []
  if (preferredPath) {
    candidates.push(preferredPath)
    candidates.push(expandPath(preferredPath))
  }
  candidates.push('java')

  // Add local JREs
  const jreDir = path.join(userData, 'jre')
  if (fsSync.existsSync(jreDir)) {
    const entries = fsSync.readdirSync(jreDir, { withFileTypes: true })
    entries.forEach((entry) => {
      if (entry.isDirectory()) {
        const javaExe = path.join(jreDir, entry.name, 'bin', 'java.exe')
        if (fsSync.existsSync(javaExe)) {
          candidates.push(javaExe)
        }
      }
    })
  }

  // Add local JDKs
  const javaDir = path.join(userData, 'java')
  if (fsSync.existsSync(javaDir)) {
    const entries = fsSync.readdirSync(javaDir, { withFileTypes: true })
    entries.forEach((entry) => {
      if (entry.isDirectory()) {
        const javaExe = path.join(javaDir, entry.name, 'bin', 'java.exe')
        if (fsSync.existsSync(javaExe)) {
          candidates.push(javaExe)
        }
      }
    })
  }

  if (process.platform === 'win32') {
    const whereResult = require('child_process').spawnSync('where', ['java'], { encoding: 'utf8' })
    if (whereResult.status === 0) {
      whereResult.stdout.split(/\r?\n/).forEach((line) => {
        if (line.trim()) candidates.push(line.trim())
      })
    }
    const programFiles = [process.env.ProgramW6432, process.env.ProgramFiles, process.env['ProgramFiles(x86)']]
    programFiles.forEach((programPath) => {
      if (!programPath) return
      const base = path.join(programPath, 'Java')
      try {
        const entries = fsSync.readdirSync(base, { withFileTypes: true })
        entries.forEach((entry) => {
          if (!entry.isDirectory()) return
          const candidate = path.join(base, entry.name, 'bin', 'java.exe')
          candidates.push(candidate)
        })
      } catch {
      }
    })
  } else {
    const whichResult = require('child_process').spawnSync('which', ['java'], { encoding: 'utf8' })
    if (whichResult.status === 0) {
      whichResult.stdout.split(/\r?\n/).forEach((line) => {
        if (line.trim()) candidates.push(line.trim())
      })
    }
  }

  const unique = Array.from(new Set(candidates.filter(Boolean)))
  const matches = unique
    .map((candidate) => {
      if (!candidate || (candidate !== 'java' && !isExecutable(candidate))) return null
      const major = getJavaVersionMajor(candidate)
      if (major === null || major < minMajor) return null
      if (typeof maxMajor === 'number' && major > maxMajor) return null
      return { candidate, major }
    })
    .filter(Boolean)

  if (matches.length === 0) {
    const requestedRange = formatJavaCompatibilityRange({ minMajor, maxMajor })
    if (verboseLaunchLogging) console.log(`Java ${requestedRange} not found, downloading Java ${minMajor}...`)
    try {
      const downloadedPath = await downloadAndInstallJava(minMajor, event)
      return downloadedPath
    } catch (error) {
      throw new Error(`Java ${requestedRange} не найдена и не удалось скачать Java ${minMajor}: ${error.message}`)
    }
  }

  // Select the lowest Java that fits the compatibility range.
  matches.sort((a, b) => a.major - b.major)
  const selected = matches.find((m) => m.major >= minMajor && (typeof maxMajor !== 'number' || m.major <= maxMajor))
  if (!selected) {
    const requestedRange = formatJavaCompatibilityRange({ minMajor, maxMajor })
    if (verboseLaunchLogging) console.log(`Java ${requestedRange} not found in matches, downloading Java ${minMajor}...`)
    try {
      const downloadedPath = await downloadAndInstallJava(minMajor, event)
      return downloadedPath
    } catch (error) {
      throw new Error(`Java ${requestedRange} не найдена и не удалось скачать Java ${minMajor}: ${error.message}`)
    }
  }
  if (verboseLaunchLogging) console.log(`Using Java ${selected.major} (${selected.candidate}) for range ${formatJavaCompatibilityRange({ minMajor, maxMajor })}`)
  return selected.candidate
}

async function launchGame(profile, event, launcherProfileNameOverride = '') {
  broadcastLaunchProgress({ message: `Подготовка запуска профиля "${profile.name || profile.versionId}"...` })
  try {
    const modpackHints = await getModpackLaunchHints(profile)
    if (modpackHints?.loader && (modpackHints.loader !== profile.loader || (modpackHints.loaderVersion || '') !== (profile.loaderVersion || ''))) {
      profile = {
        ...profile,
        loader: modpackHints.loader,
        loaderVersion: modpackHints.loaderVersion || ''
      }
      await saveProfile(profile)
      broadcastLaunchProgress({ message: `Профиль модпака синхронизирован: ${profile.loader}${profile.loaderVersion ? ` ${profile.loaderVersion}` : ''}` })
    }
  } catch (error) {
    console.warn('Failed to sync modpack launch hints:', error && error.message)
  }

  const launcherSettings = await getSettings()
  const javaCompatibilityRange = await getJavaCompatibilityRange(profile.versionId)
  broadcastLaunchProgress({ message: `Требуемая Java: ${formatJavaCompatibilityRange(javaCompatibilityRange)}`, phase: 'preparing' })
  const javaPath = await findJavaPath(
    profile.javaPath || launcherSettings.javaPath || '',
    javaCompatibilityRange.minMajor,
    javaCompatibilityRange.maxMajor,
    event
  )
  const launcher = new Client()
  const root = path.join(userData, 'minecraft')
  const boostGameDirectory = profile.modpackPath || root
  const kuroBoostPlan = await prepareKuroBoostPlan(profile, launcherSettings, boostGameDirectory)
  if (kuroBoostPlan.enabled) {
    const gpuLabel = kuroBoostPlan.hardware.gpu?.[0]?.name || 'GPU не определён'
    broadcastLaunchProgress({
      message: `KuroBoost: AI Optimized • ${kuroBoostPlan.hardware.cpu.cores} потоков CPU • RAM ${kuroBoostPlan.hardware.ram.total} GB • ${gpuLabel}`,
      phase: 'preparing'
    })
    for (const warning of kuroBoostPlan.warnings.slice(0, 4)) {
      broadcastLaunchProgress({ message: `KuroBoost: ${warning}`, tone: 'warning', phase: 'preparing' })
    }
  }
  let authState = await readJson(authPath, {})

  const profileName = normalizeMinecraftUsername(launcherProfileNameOverride)
    || normalizeMinecraftUsername(launcherSettings.profileName)
    || normalizeMinecraftUsername(authState.name)
    || normalizeMinecraftUsername(profile.username)
    || 'KuroPlayer'
  let authorization = null
  let isOfflineFallback = false

  if (authState.access_token && authState.client_token) {
    try {
      await Authenticator.validate(authState.access_token, authState.client_token)
    } catch {
      const refreshed = await refreshStoredAuth(authState)
      if (refreshed) {
        authState = refreshed
      } else {
        authState.access_token = null
        authState.client_token = null
      }
    }
  }

  const isOnlineProfile = authState.access_token && authState.client_token
  if (isOnlineProfile) {
    authorization = {
      username: profileName,
      name: profileName,
      uuid: profile.uuid || authState.uuid || '00000000-0000-0000-0000-000000000000',
      access_token: authState.access_token,
      client_token: authState.client_token,
      user_properties: normalizeUserProperties(authState.user_properties),
      meta: {
        ...(authState.meta || { type: 'mojang' }),
        demo: false
      }
    }
  } else {
    // No valid online auth present — fall back to an offline session so the
    // user can still launch the game without signing in. This preserves the
    // previous behavior where offline launches are allowed implicitly.
    const makeOfflineUUID = (name) => {
      const h = crypto.createHash('md5').update('OfflinePlayer:' + (name || '')).digest('hex')
      return `${h.substring(0,8)}-${h.substring(8,12)}-${h.substring(12,16)}-${h.substring(16,20)}-${h.substring(20,32)}`
    }

    const offlineUuid = profile.uuid || authState.uuid || makeOfflineUUID(profileName)
    authorization = {
      username: profileName,
      name: profileName,
      uuid: offlineUuid,
      access_token: '0',
      client_token: '0',
      user_properties: normalizeUserProperties(authState.user_properties),
      meta: {
        ...(authState.meta || { type: 'mojang' }),
        demo: false,
        offline: true
      }
    }
    isOfflineFallback = true
  }

  // If user provided a custom skin for this profile, attach it to the session
  try {
    let userProps = {}
    if (authorization.user_properties) {
      try {
        userProps = typeof authorization.user_properties === 'string'
          ? JSON.parse(authorization.user_properties)
          : authorization.user_properties || {}
      } catch {}
    }

    if (profile && profile.skin) {
      const localSkinPath = path.join(userData, 'skins', `${profile.id}.png`)
      const hasLocalSkin = fsSync.existsSync(localSkinPath)
      let skinUrl = null

      if (hasLocalSkin && skinServerPort) {
        skinUrl = `http://127.0.0.1:${skinServerPort}/skins/${profile.id}.png`
      } else if (profile.skin.url) {
        skinUrl = profile.skin.url
      }

      if (skinUrl) {
        if (verboseLaunchLogging) console.log('Using custom skin URL for profile', profile.id, skinUrl)
        const texturesObj = {
          timestamp: Date.now(),
          profileId: authorization.uuid,
          profileName: authorization.name || profileName,
          textures: {
            SKIN: {
              url: skinUrl,
              metadata: profile.skin.model === 'slim' ? { model: 'slim' } : undefined
            }
          }
        }
        const encoded = Buffer.from(JSON.stringify(texturesObj)).toString('base64')
        // Store as array to match authenticator.parsePropts output (arrays of values)
        userProps.textures = [encoded]
      }
    }

    authorization.user_properties = JSON.stringify(userProps)
  } catch (e) {
    console.warn('Failed to attach custom skin to session properties:', e && e.message)
  }

  let versionInfo = {
    number: profile.versionId,
    type: 'release'
  }
  // Handle loader
  let installedLoaderId = null
  let installedLoaderVersion = null
  let installedForgeInstallerJar = null
  let installedForgeClientJar = null
  let installedQuiltRemappedJar = null
  let installedNeoForgeArgsFile = null

  // Ensure base version JSON/jar available so installer and MCLC have a fallback
  try {
    await ensureBaseVersionInstalled(profile.versionId, event)
  } catch (e) {
    console.warn('Failed to ensure base version installed:', e && e.message)
  }

  if (profile.loader === 'fabric') {
    broadcastLaunchProgress({ message: 'Установка Fabric...', phase: 'preparing' })
    try {
      const loaders = await getLoaderArtifactListFor(profile.versionId)
      const selected = profile.loaderVersion
        ? loaders.find((item) => item?.loader?.version === profile.loaderVersion || item?.version === profile.loaderVersion)
        : loaders.find((item) => item?.loader?.stable) || loaders[0]
      if (!selected) {
        throw new Error(`No Fabric loader found for Minecraft ${profile.versionId}`)
      }
      const loaderVersion = selected.loader?.version || selected.version
      installedLoaderVersion = loaderVersion
      if (verboseLaunchLogging) console.log('Fabric: installing loader', loaderVersion, 'for', profile.versionId)
      
      try {
        const installedVersionId = await installFabric({
          minecraft: root,
          minecraftVersion: profile.versionId,
          version: loaderVersion
        })
        installedLoaderId = installedVersionId || null
      } catch (e) {
        throw new Error(`Не удалось установить Fabric ${loaderVersion}: ${e && e.message ? e.message : e}`)
      }
      
      if (verboseLaunchLogging) console.log('Fabric setup completed, version:', versionInfo.number)
    } catch (error) {
      console.error('Fabric install error:', error)
      broadcastLaunchProgress({ message: `Ошибка установки Fabric: ${error.message}`, tone: 'error', phase: 'error' })
      throw error
    }
  } else if (profile.loader === 'forge') {
    broadcastLaunchProgress({ message: 'Установка Forge...', phase: 'preparing' })
    try {
      const result = await getForgeVersionList({ minecraft: profile.versionId })
      const forgeVersions = Array.isArray(result)
        ? result
        : result?.versions || []
      const selected = profile.loaderVersion
        ? forgeVersions.find((item) => item.version === profile.loaderVersion)
        : forgeVersions.find((item) => item.stable) || forgeVersions[0]
      if (!selected) {
        throw new Error(`No Forge version found for Minecraft ${profile.versionId}`)
      }
      // The installer expects a version object with `version` and `mcversion`.
      // Pass the selected object (not a plain string) to `installForge`.
      installedLoaderVersion = selected.version || selected.mcversion
      const computeForgeArtifact = (v) => {
        const mcver = v?.mcversion || profile.versionId
        const ver = v?.version || ''
        const parts = String(mcver).split('.')
        const minor = Number.parseInt(parts[1] || '0')
        if (minor >= 7 && minor <= 8) return `${mcver}-${ver}-${mcver}`
        if (ver.startsWith(mcver)) return ver
        return `${mcver}-${ver}`
      }

      const artifactName = computeForgeArtifact(selected)
      if (verboseLaunchLogging) console.log('Forge: installing', artifactName, 'for', profile.versionId)

      try {
        const installedVersionId = await installForge(selected, root, { mcversion: profile.versionId, java: javaPath })
        installedLoaderId = installedVersionId || `forge-${artifactName}`
        try {
          const expectedForgeClientJar = path.join(root, 'libraries', 'net', 'minecraftforge', 'forge', artifactName, `forge-${artifactName}-client.jar`)
          if (fsSync.existsSync(expectedForgeClientJar)) {
            installedForgeClientJar = expectedForgeClientJar
            if (verboseLaunchLogging) console.log('Found forge client jar:', installedForgeClientJar)
          }

          // Try expected path first using computed artifact folder
          const expectedForgeJar = path.join(root, 'libraries', 'net', 'minecraftforge', 'forge', artifactName, `forge-${artifactName}-installer.jar`)
          if (fsSync.existsSync(expectedForgeJar)) {
            installedForgeInstallerJar = expectedForgeJar
            if (verboseLaunchLogging) console.log('Found forge installer jar at expected path:', installedForgeInstallerJar)
          } else {
            // Fallback to searching the libraries tree
            installedForgeInstallerJar = await findForgeInstallerJar(root)
            if (verboseLaunchLogging) console.log('Found forge installer jar via search:', installedForgeInstallerJar)
          }
          if (installedForgeInstallerJar) {
            if (verboseLaunchLogging) console.log('Forge installer jar exists on disk:', fsSync.existsSync(installedForgeInstallerJar))
          }
        } catch (err) {
          console.warn('Failed to locate forge installer jar:', err && (err.stack || err.message))
        }
      } catch (e) {
        throw new Error(`Не удалось установить Forge ${installedLoaderVersion || ''}: ${e && e.message ? e.message : e}`)
      }
      
      if (verboseLaunchLogging) console.log('Forge setup completed, version:', versionInfo.number)
    } catch (error) {
      console.error('Forge install error:', error)
      broadcastLaunchProgress({ message: `Ошибка установки Forge: ${error.message}`, tone: 'error', phase: 'error' })
      throw error
    }
  } else if (profile.loader === 'neoforge') {
    broadcastLaunchProgress({ message: 'Установка NeoForge...', phase: 'preparing' })
    try {
      const result = await getNeoForgedVersionsFromMaven(profile.versionId)
      const neoVersions = Array.isArray(result)
        ? result
        : result?.versions || []
      const requestedVersion = profile.loaderVersion
        ? neoVersions.find((item) => item?.version === profile.loaderVersion)
        : null
      const stableVersions = neoVersions
        .filter((item) => item?.stable)
        .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }))
      const candidateVersions = [
        ...(requestedVersion ? [requestedVersion] : []),
        ...stableVersions.filter((item) => item.version !== requestedVersion?.version)
      ]
      if (candidateVersions.length === 0) {
        throw new Error(`No stable NeoForge version found for Minecraft ${profile.versionId}`)
      }
      
      for (const selected of candidateVersions) {
        installedLoaderVersion = selected.version
        if (verboseLaunchLogging) console.log('NeoForge: trying to install', selected.version, 'for', profile.versionId)
        try {
          const installedVersionId = await installNeoForged('neoforge', selected.version, root, { mcversion: profile.versionId, java: javaPath })
          installedLoaderId = installedVersionId || `neoforge-${selected.version}`
          const argsFileName = process.platform === 'win32' ? 'win_args.txt' : 'unix_args.txt'
          const argsFilePath = path.join(root, 'libraries', 'net', 'neoforged', 'neoforge', selected.version, argsFileName)
          if (fsSync.existsSync(argsFilePath)) {
            installedNeoForgeArgsFile = argsFilePath
          }
          if (verboseLaunchLogging) console.log('NeoForge setup completed, version:', installedLoaderId)
          break
        } catch (e) {
          console.warn('NeoForge install failed for', selected.version, ':', e && (e.stack || e.message), 'trying next version')
        }
      }
      
      if (!installedLoaderId) {
        throw new Error('Не удалось установить ни одну совместимую версию NeoForge')
      }
    } catch (error) {
      console.error('NeoForge install error:', error)
      broadcastLaunchProgress({ message: `Ошибка установки NeoForge: ${error.message}`, tone: 'error', phase: 'error' })
      throw error
    }
  } else if (profile.loader === 'quilt') {
    broadcastLaunchProgress({ message: 'Установка Quilt...', phase: 'preparing' })
    try {
      const quiltVersions = await getQuiltLoaderVersionsByMinecraft({ minecraftVersion: profile.versionId })
      const list = Array.isArray(quiltVersions) ? quiltVersions : Object.values(quiltVersions || {})
      const selected = profile.loaderVersion
        ? list.find((item) => (item?.loader?.version === profile.loaderVersion) || (item?.version === profile.loaderVersion))
        : list.find((item) => item?.loader?.stable) || list[0]
      if (!selected) {
        throw new Error(`No Quilt loader found for Minecraft ${profile.versionId}`)
      }
      const loaderVersion = selected?.loader?.version || selected?.version
      installedLoaderVersion = loaderVersion
      if (!loaderVersion) {
        throw new Error(`No valid Quilt loader version found for Minecraft ${profile.versionId}`)
      }
      if (verboseLaunchLogging) console.log('Quilt: installing', loaderVersion, 'for', profile.versionId)
      
      try {
        const installedVersionId = await installQuiltVersion({
          minecraft: root,
          minecraftVersion: profile.versionId,
          version: loaderVersion
        })
        installedLoaderId = installedVersionId || `quilt-${loaderVersion}`
        try {
          const remapped = path.join(root, '.cache', 'quilt_loader', 'remappedJars', `minecraft-${profile.versionId}-${loaderVersion}`, 'client-intermediary.jar')
          if (fsSync.existsSync(remapped)) installedQuiltRemappedJar = remapped
        } catch (err) {
          console.warn('Failed to locate quilt remapped jar:', err && err.message)
        }
      } catch (e) {
        throw new Error(`Не удалось установить Quilt ${loaderVersion}: ${e && e.message ? e.message : e}`)
      }
      
      if (verboseLaunchLogging) console.log('Quilt setup completed, version:', versionInfo.number)
    } catch (error) {
      console.error('Quilt install error:', error)
      broadcastLaunchProgress({ message: `Ошибка установки Quilt: ${error.message}`, tone: 'error', phase: 'error' })
      throw error
    }
  }

  // Read version type from base version
  try {
    const versionJsonPath = path.join(versionsPath, profile.versionId, `${profile.versionId}.json`)
    const versionJson = await readJson(versionJsonPath, null)
    if (versionJson && typeof versionJson.type === 'string') {
      versionInfo.type = versionJson.type
    }
  } catch {
    // ignore and keep fallback type
  }

  // If installer produced a loader JSON but used `version.json`, ensure a <id>.json exists
  if (installedLoaderId) {
    try {
      const loaderDir = path.join(versionsPath, installedLoaderId)
      const expected = path.join(loaderDir, `${installedLoaderId}.json`)
      const alt = path.join(loaderDir, 'version.json')
      if (!fsSync.existsSync(expected) && fsSync.existsSync(alt)) {
        await fs.copyFile(alt, expected)
      }
    } catch (e) {
      console.warn('Failed to normalize loader json file:', e && e.message)
    }

    // For Quilt, filter problematic libraries before launch
    if (profile.loader === 'quilt') {
      try {
        const loaderJsonPath = path.join(versionsPath, installedLoaderId, `${installedLoaderId}.json`)
        if (fsSync.existsSync(loaderJsonPath)) {
          let json = JSON.parse(fsSync.readFileSync(loaderJsonPath, 'utf-8'))
          
          let filtered = filterQuiltProblematicLibraries(json)
          
          // Quilt 0.20+ needs launchwrapper for Mixin service - add it after filtering
          const hasLaunchWrapper = filtered.libraries && filtered.libraries.some(lib => 
            lib.name && lib.name.toLowerCase().includes('launchwrapper')
          )
          if (!hasLaunchWrapper) {
            filtered.libraries = filtered.libraries || []
            filtered.libraries.unshift({
              name: 'net.minecraft:launchwrapper:1.12',
              downloads: {
                artifact: {
                  path: 'net/minecraft/launchwrapper/1.12/launchwrapper-1.12.jar',
                  sha1: 'd78c5a76b650b1c26b6518b3f130ee1d7c196a55',
                  size: 50666,
                  url: 'https://libraries.minecraft.net/net/minecraft/launchwrapper/1.12/launchwrapper-1.12.jar'
                }
              }
            })
            if (verboseLaunchLogging) console.log('Added launchwrapper to Quilt libraries for Mixin service')
          }
          
          // Only write if there were changes
          const originalJsonString = JSON.stringify(json)
          const filteredJsonString = JSON.stringify(filtered)
          if (originalJsonString !== filteredJsonString) {
            await fs.writeFile(loaderJsonPath, JSON.stringify(filtered, null, 2), 'utf-8')
            if (verboseLaunchLogging) console.log(`Filtered Quilt libraries: ${json.libraries.length} -> ${filtered.libraries.length}`)
            if (filtered.arguments?.jvm) {
              if (verboseLaunchLogging) console.log(`Filtered Quilt JVM args: ${json.arguments?.jvm?.length || 0} -> ${filtered.arguments.jvm.length}`)
            }
          }
        }
      } catch (e) {
        console.warn('Failed to filter quilt libraries:', e && e.message)
      }
    }
  }

  // Compute safe RAM to use for JVM based on user preference and system memory
  function parseMemoryGB(value) {
    if (value === 'auto' || value === 'Auto' || value === 'AUTO' || value === 'global') {
      return null
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.max(1, Math.floor(value))
    }
    if (typeof value === 'string' && value.trim()) {
      const match = value.trim().toUpperCase().match(/^(\d+)(G|M)?$/)
      if (match) {
        let requested = Number(match[1])
        if (match[2] === 'M') {
          // convert megabytes to gigabytes, round down
          return Math.max(1, Math.floor(requested / 1024))
        }
        return Math.max(1, requested)
      }
    }
    return null
  }

  function normalizeRamPreference(value) {
    if (value === null || value === undefined) return 'global'
    if (typeof value === 'number' && Number.isFinite(value)) return `${Math.max(1, Math.floor(value))}G`
    if (typeof value !== 'string') return 'global'

    const text = value.trim()
    if (!text) return 'global'

    const lower = text.toLowerCase()
    if (lower === 'global' || lower === 'launcher' || lower === 'settings') return 'global'
    if (lower === 'auto') return 'auto'

    const match = text.toUpperCase().match(/^(\d+)\s*(G|GB|M|MB)?$/)
    if (!match) return 'global'

    const amount = Number(match[1])
    const unit = match[2] || 'G'
    if (unit === 'M' || unit === 'MB') return `${Math.max(1, Math.floor(amount / 1024))}G`
    return `${Math.max(1, amount)}G`
  }

  function resolveRamPreference(profileRam, settingsRam) {
    const normalizedProfileRam = normalizeRamPreference(profileRam)
    const normalizedSettingsRam = normalizeRamPreference(settingsRam)

    if (normalizedProfileRam !== 'global') {
      return {
        requested: normalizedProfileRam,
        source: 'profile',
        profile: normalizedProfileRam,
        global: normalizedSettingsRam
      }
    }

    const requested = normalizedSettingsRam === 'global' ? 'auto' : normalizedSettingsRam
    return {
      requested,
      source: normalizedSettingsRam === 'global' ? 'auto' : 'launcher',
      profile: normalizedProfileRam,
      global: normalizedSettingsRam
    }
  }

  function computeSafeRam(requestedValue, reserveGB = 3) {
    const ONE_GB = 1024 * 1024 * 1024
    const totalGB = Math.max(1, Math.floor(os.totalmem() / ONE_GB))

    let freeGB = totalGB
    try {
      const freeMem = os.freemem()
      freeGB = Math.max(1, Math.floor(freeMem / ONE_GB))
    } catch {}

    const hardMaxAllowed = Math.max(2, totalGB - Math.ceil(reserveGB))

    // Handle 'auto' - calculate based on system memory
    let requestedGB = parseMemoryGB(requestedValue)
    if (requestedValue === 'auto' || requestedGB === null) {
      // Auto should stay conservative, but not collapse to 2G just because
      // Windows reports little "free" RAM while much more memory is reclaimable.
      const autoFromFree = Math.floor(freeGB * 0.5)
      const autoFromTotal = Math.floor(hardMaxAllowed * 0.75)
      requestedGB = Math.max(2, Math.min(4, hardMaxAllowed, Math.max(autoFromFree, autoFromTotal)))
      if (verboseLaunchLogging) console.log('Auto RAM calculation: using', requestedGB, 'GB based on', { freeGB, totalGB, hardMaxAllowed })
    }

    const maxAllowed = hardMaxAllowed
    if (verboseLaunchLogging) console.log('RAM calculation:', { totalGB, freeGB, requestedGB, maxAllowed, reserveGB, requestedValue })

    if (requestedGB <= maxAllowed && requestedGB >= 2) {
      return `${requestedGB}G`
    }

    return `${Math.max(2, maxAllowed)}G`
  }

  const baseRamPreference = resolveRamPreference(profile.ram, launcherSettings.ram)
  const ramPreference = kuroBoostPlan.enabled && baseRamPreference.source !== 'profile'
    ? { ...baseRamPreference, requested: kuroBoostPlan.recommendedRam, source: 'kuroboost' }
    : baseRamPreference
  const safeRam = computeSafeRam(ramPreference.requested, kuroBoostPlan.enabled && kuroBoostPlan.hardware.laptop ? 4 : 3)

  // Determine base version JSON path (could be either <id>.json or version.json)
  const baseJsonCandidate = path.join(versionsPath, profile.versionId, `${profile.versionId}.json`)
  const baseJsonAlt = path.join(versionsPath, profile.versionId, 'version.json')
  let baseVersionJsonPath = null
  if (fsSync.existsSync(baseJsonCandidate)) baseVersionJsonPath = baseJsonCandidate
  else if (fsSync.existsSync(baseJsonAlt)) baseVersionJsonPath = baseJsonAlt

  const versionOption = {
    number: profile.versionId,
    type: versionInfo.type
  }
  if (installedLoaderId) versionOption.custom = installedLoaderId

  // For mod loaders, always use loader version directory if available
  const usesModLoader = profile.loader === 'forge' || profile.loader === 'quilt' || profile.loader === 'fabric' || profile.loader === 'neoforge'
  if (verboseLaunchLogging) console.log(`[Launch] usesModLoader=${usesModLoader}, profile.loader=${profile.loader}, installedLoaderId=${installedLoaderId}`)
  const versionDirectory = (installedLoaderId && usesModLoader) 
    ? path.join(versionsPath, installedLoaderId) 
    : path.join(versionsPath, profile.versionId)
  if (verboseLaunchLogging) console.log(`[Launch] versionDirectory=${versionDirectory}`)
  
  // Check if loader version directory exists
  if (installedLoaderId) {
    const loaderDirExists = fsSync.existsSync(path.join(versionsPath, installedLoaderId))
    if (verboseLaunchLogging) console.log(`[Launch] Loader directory exists: ${loaderDirExists}`)
    if (!loaderDirExists) {
      broadcastLaunchProgress({ message: `Папка установленного загрузчика не найдена: ${installedLoaderId}`, tone: 'error', phase: 'error' })
      throw new Error(`Папка установленного загрузчика не найдена: ${installedLoaderId}`)
    }
  }

  const versionJsonOverride = baseVersionJsonPath
  const baseJar = path.join(versionsPath, profile.versionId, `${profile.versionId}.jar`)
  
  // Modern Forge bootstraps Minecraft as its own module. Putting the vanilla
  // client jar on Java's classpath creates a second automatic module
  // (_1._19._2) with the same packages and crashes during module resolution.
  let mcJar = baseJar
  if (profile.loader === 'forge' && installedForgeClientJar) {
    mcJar = installedForgeClientJar
  } else if (profile.loader === 'quilt') {
    mcJar = baseJar
  } else if (installedQuiltRemappedJar) {
    mcJar = installedQuiltRemappedJar
  }

  const options = {
    clientPackage: null,
    authorization,
    version: versionOption,
    memory: {
      max: safeRam,
      min: safeRam
    },
    javaPath,
    overrides: {
      directory: versionDirectory,
      minecraftJar: mcJar,
      ...(versionJsonOverride ? { versionJson: versionJsonOverride } : {})
    }
  }
  
  // Use modpack-specific directory for gameDir if this is a modpack profile
  if (profile.modpackPath) {
    const modpackGameDir = profile.modpackPath
    if (verboseLaunchLogging) console.log(`[Launch] Using main minecraft root for libraries: ${root}`)
    if (verboseLaunchLogging) console.log(`[Launch] Using modpack game directory: ${modpackGameDir}`)
    options.root = root  // Keep main minecraft for libraries/versions
    // Use overrides to set game directory - this sets --gameDir in launch args
    options.overrides.gameDirectory = modpackGameDir
  } else {
    options.root = root
  }

  options.customArgs = options.customArgs || []
  // MCLC already emits -Xmx/-Xms from options.memory. Do not add stack or
  // metaspace caps here: large modpacks can overflow a small thread stack
  // during Fabric entrypoint/mixin initialization.
  options.customArgs = options.customArgs.filter(a => !(typeof a === 'string' && (
    a.startsWith('-Xmx') ||
    a.startsWith('-Xms') ||
    a.startsWith('-Xss') ||
    a.startsWith('-XX:MaxMetaspaceSize')
  )))
  if (!options.customArgs.some(a => typeof a === 'string' && a.startsWith('-XX:ReservedCodeCacheSize'))) options.customArgs.push('-XX:ReservedCodeCacheSize=256M')

  if (installedLoaderId && usesModLoader) {
    let resolvedLoaderJvmArgs = []
    if (profile.loader === 'neoforge' && installedNeoForgeArgsFile) {
      resolvedLoaderJvmArgs = parseJavaArgsFile(installedNeoForgeArgsFile)
    }
    if (resolvedLoaderJvmArgs.length === 0) {
      const loaderJsonPath = path.join(versionsPath, installedLoaderId, `${installedLoaderId}.json`)
      resolvedLoaderJvmArgs = resolveLoaderJvmArgs(loaderJsonPath, {
        loaderId: installedLoaderId,
        baseVersionId: profile.versionId,
        root
      })
    }

    if (profile.loader === 'neoforge') {
      try {
        const baseVersionJson = baseVersionJsonPath && fsSync.existsSync(baseVersionJsonPath)
          ? JSON.parse(fsSync.readFileSync(baseVersionJsonPath, 'utf-8'))
          : null
        const legacyClassPathEntries = getBaseLibraryRelativePaths(baseVersionJson)
        if (fsSync.existsSync(baseJar)) {
          legacyClassPathEntries.push(path.relative(root, baseJar).replace(/\\/g, '/'))
        }

        appendJvmPropertyList(resolvedLoaderJvmArgs, 'legacyClassPath', legacyClassPathEntries)
        if (verboseLaunchLogging) console.log('NeoForge legacyClassPath augmented with vanilla libraries:', legacyClassPathEntries.length)
      } catch (e) {
        console.warn('Failed to augment NeoForge legacy classpath:', e && e.message)
      }
    }

    // NeoForge early display loads LWJGL classes from the bootstrap module layer.
    // Reuse the same LWJGL version as the inherited vanilla version so bootstrap,
    // legacy classpath, and NeoForge game/plugin layers all see the same jars.
    // Keep native library handling untouched here.
    if (profile.loader === 'neoforge') {
      try {
        const baseVersionJsonPath = path.join(versionsPath, profile.versionId, `${profile.versionId}.json`)
        let preferredLwjglVersion = null

        if (fsSync.existsSync(baseVersionJsonPath)) {
          const baseVersionJson = JSON.parse(fsSync.readFileSync(baseVersionJsonPath, 'utf-8'))
          const lwjglCore = Array.isArray(baseVersionJson?.libraries)
            ? baseVersionJson.libraries.find((entry) => typeof entry?.name === 'string' && entry.name.startsWith('org.lwjgl:lwjgl:'))
            : null
          if (lwjglCore?.name) {
            preferredLwjglVersion = lwjglCore.name.split(':')[2] || null
          }
        }

        if (preferredLwjglVersion) {
          const lwjglBase = path.join(root, 'libraries', 'org', 'lwjgl')
          if (fsSync.existsSync(lwjglBase)) {
            const lwjglJars = []
              const lwjglNativeJars = []
            const artifacts = fsSync.readdirSync(lwjglBase, { withFileTypes: true })
              .filter((entry) => entry.isDirectory())
              .map((entry) => entry.name)

            for (const artifact of artifacts) {
              const artifactDir = path.join(lwjglBase, artifact, preferredLwjglVersion)
              if (!fsSync.existsSync(artifactDir)) continue
              const files = fsSync.readdirSync(artifactDir)
              for (const fileName of files) {
                const lower = fileName.toLowerCase()
                if (!lower.endsWith('.jar')) continue
                if (/-natives(?:[-.]|$)/.test(lower)) {
                  const relPath = path.relative(root, path.join(artifactDir, fileName)).replace(/\\/g, '/')
                  lwjglNativeJars.push(relPath)
                  continue
                }
                const relPath = path.relative(root, path.join(artifactDir, fileName)).replace(/\\/g, '/')
                lwjglJars.push(relPath)
              }
            }

            const uniqueLwjglJars = Array.from(new Set(lwjglJars))
            if (uniqueLwjglJars.length > 0) {
              const sep = process.platform === 'win32' ? ';' : ':'
              const joined = uniqueLwjglJars.join(sep)
              const appendPropertyList = (propertyName) => {
                const prefix = `-D${propertyName}=`
                const propertyIndex = resolvedLoaderJvmArgs.findIndex(
                  (item) => typeof item === 'string' && item.startsWith(prefix)
                )
                if (propertyIndex >= 0) {
                  const currentValue = resolvedLoaderJvmArgs[propertyIndex].slice(prefix.length)
                  const mergedValue = currentValue
                    ? Array.from(new Set([...currentValue.split(sep).filter(Boolean), ...uniqueLwjglJars])).join(sep)
                    : joined
                  resolvedLoaderJvmArgs[propertyIndex] = `${prefix}${mergedValue}`
                } else {
                  resolvedLoaderJvmArgs.push(`${prefix}${joined}`)
                }
              }

              const modulePathIndex = resolvedLoaderJvmArgs.findIndex((item) => item === '-p' || item === '--module-path')
              if (modulePathIndex >= 0 && typeof resolvedLoaderJvmArgs[modulePathIndex + 1] === 'string') {
                const mergedModulePath = Array.from(new Set([
                  ...resolvedLoaderJvmArgs[modulePathIndex + 1].split(sep).filter(Boolean),
                  ...uniqueLwjglJars
                ])).join(sep)
                resolvedLoaderJvmArgs[modulePathIndex + 1] = mergedModulePath
              } else {
                const modulePathEqIndex = resolvedLoaderJvmArgs.findIndex((item) => typeof item === 'string' && item.startsWith('--module-path='))
                if (modulePathEqIndex >= 0) {
                  const currentValue = resolvedLoaderJvmArgs[modulePathEqIndex].slice('--module-path='.length)
                  const mergedModulePath = Array.from(new Set([
                    ...currentValue.split(sep).filter(Boolean),
                    ...uniqueLwjglJars
                  ])).join(sep)
                  resolvedLoaderJvmArgs[modulePathEqIndex] = `--module-path=${mergedModulePath}`
                } else {
                  // Skip adding explicit module-path here — in some environments
                  // placing LWJGL jars on both the module-path and the classpath
                  // causes the JVM/bootstrap launcher to fail with a duplicate
                  // module error. Rely on the fml.* property lists instead.
                  if (verboseLaunchLogging) console.log('Skipping adding -p module-path to avoid LWJGL duplication')
                }
              }

              appendPropertyList('legacyClassPath')
              appendPropertyList('fml.gameLayerLibraries')
              appendPropertyList('fml.pluginLayerLibraries')

              if (verboseLaunchLogging) {
                console.log('NeoForge LWJGL visibility version:', preferredLwjglVersion)
                console.log('NeoForge LWJGL jars added:', uniqueLwjglJars)
                if (lwjglNativeJars && lwjglNativeJars.length > 0) console.log('NeoForge LWJGL native jars found:', Array.from(new Set(lwjglNativeJars)))
              }

              // If native jars were discovered, extract them to a dedicated
              // folder and set org.lwjgl.librarypath so LWJGL can load the DLLs.
              try {
                const uniqueNative = Array.from(new Set(lwjglNativeJars || []))
                if (uniqueNative.length > 0) {
                  const nativeDest = path.join(root, 'native-libs', `lwjgl-${preferredLwjglVersion}`)
                  fsSync.mkdirSync(nativeDest, { recursive: true })
                  for (const rel of uniqueNative) {
                    const jarFull = path.join(root, rel.replace(/\//g, path.sep))
                    try {
                      if (fsSync.existsSync(jarFull)) {
                        const zip = new AdmZip(jarFull)
                        zip.extractAllTo(nativeDest, true)
                      }
                    } catch (e) {
                      if (verboseLaunchLogging) console.warn('Failed to extract native jar', jarFull, e && e.message)
                    }
                  }
                  // Ensure LWJGL will search the extracted natives
                  if (!options.customArgs.some(a => typeof a === 'string' && a.startsWith('-Dorg.lwjgl.librarypath='))) {
                    options.customArgs.push('-Dorg.lwjgl.librarypath=' + nativeDest)
                  }
                  if (verboseLaunchLogging) console.log('Extracted LWJGL natives to', nativeDest)
                }
              } catch (e) {
                if (verboseLaunchLogging) console.warn('Failed to handle LWJGL native jars:', e && e.message)
              }
            }
          }
        }
      } catch (e) {
        console.warn('Failed to augment NeoForge LWJGL visibility:', e && e.message)
      }
    }

        // For NeoForge: filter module-path entries to remove only LWJGL jars.
        // Some modules (e.g. asm-commons used by Nashorn) must remain on the
        // module-path. Removing the entire module-path breaks module resolution.
        if (profile.loader === 'neoforge') {
          try {
            const sep = process.platform === 'win32' ? ';' : ':'
            const filtered = []
            for (let i = 0; i < resolvedLoaderJvmArgs.length; i++) {
              const token = resolvedLoaderJvmArgs[i]
              if (!token) continue

              // Handle split form: '-p' or '--module-path' followed by a path string
              if ((token === '-p' || token === '--module-path') && typeof resolvedLoaderJvmArgs[i + 1] === 'string') {
                const value = resolvedLoaderJvmArgs[i + 1]
                const parts = value.split(sep).filter(Boolean)
                // keep all parts except ones that reference org/lwjgl
                const kept = parts.filter(p => p.indexOf('org/lwjgl') === -1 && p.indexOf('org\\lwjgl') === -1)
                if (kept.length > 0) {
                  filtered.push(token)
                  filtered.push(kept.join(sep))
                }
                i += 1
                continue
              }

              // Handle single-token form: --module-path=...
              if (typeof token === 'string' && token.startsWith('--module-path=')) {
                const value = token.slice('--module-path='.length)
                const parts = value.split(sep).filter(Boolean)
                const kept = parts.filter(p => p.indexOf('org/lwjgl') === -1 && p.indexOf('org\\lwjgl') === -1)
                if (kept.length > 0) {
                  filtered.push(`--module-path=${kept.join(sep)}`)
                }
                continue
              }

              // Otherwise keep the token
              filtered.push(token)
            }
            resolvedLoaderJvmArgs = filtered
            if (verboseLaunchLogging) console.log('NeoForge: filtered module-path entries (removed LWJGL jars)')
          } catch (e) {
            if (verboseLaunchLogging) console.warn('NeoForge module-path selective filtering failed:', e && e.message)
          }
        }

        if (profile.loader === 'neoforge') {
          // NeoForge can need broad unnamed-module opens on some Java builds.
          // Forge 1.19.x expects the official cpw.mods.securejarhandler target.
          try {
            if (Array.isArray(resolvedLoaderJvmArgs) && resolvedLoaderJvmArgs.length > 0) {
              const normalized = []
              for (let i = 0; i < resolvedLoaderJvmArgs.length; i++) {
                const t = resolvedLoaderJvmArgs[i]
                if (!t) {
                  normalized.push(t)
                  continue
                }

                if (typeof t === 'string') {
                  if ((t.startsWith('--add-opens=') || t.startsWith('--add-exports=')) && t.endsWith('=cpw.mods.securejarhandler')) {
                    normalized.push(t.replace(/=cpw\.mods\.securejarhandler$/, '=ALL-UNNAMED'))
                    continue
                  }

                  // Handle split form: '--add-opens' followed by 'pkg=module'
                  if ((t === '--add-opens' || t === '--add-exports') && typeof resolvedLoaderJvmArgs[i + 1] === 'string') {
                    const next = resolvedLoaderJvmArgs[i + 1]
                    if (next.endsWith('=cpw.mods.securejarhandler')) {
                      normalized.push(t)
                      normalized.push(next.replace(/=cpw\.mods\.securejarhandler$/, '=ALL-UNNAMED'))
                      i += 1
                      continue
                    }
                  }
                }

                normalized.push(t)
              }
              resolvedLoaderJvmArgs = normalized
              if (verboseLaunchLogging) console.log('NeoForge normalized securejarhandler opens/exports to ALL-UNNAMED')
            }
          } catch (e) {
            if (verboseLaunchLogging) console.warn('Failed to normalize add-opens/exports:', e && e.message)
          }
        }

        // Sanitize loader-provided arguments: strip application args and main-class tokens
    const sanitizeLoaderArgs = (arr) => {
      if (!Array.isArray(arr)) return []
      const out = []
      const appArgsToStrip = new Set(['--username','--version','--gameDir','--assetsDir','--assetIndex','--uuid','--accessToken','--clientId','--xuid','--userType','--versionType','--fullscreen'])
      for (let i = 0; i < arr.length; i++) {
        const t = arr[i]
        if (!t) continue

        // If we hit a main-class (BootstrapLauncher) or similar, the rest are application args — stop.
        if (typeof t === 'string' && /BootstrapLauncher/.test(t)) {
          break
        }

        // Remove explicit launchTarget flags/values (either separate or =value form)
        if (t === '--launchTarget') { i++; continue }
        if (typeof t === 'string' && t.startsWith('--launchTarget=')) continue

        // Strip common application args that MCLC will supply (and their values)
        if (appArgsToStrip.has(t)) { i++; continue }

        out.push(t)
      }
      return out
    }

    const cleaned = sanitizeLoaderArgs(resolvedLoaderJvmArgs)
    options.customArgs.push(...cleaned)

    // If securejarhandler is present on the module-path, ensure we grant
    // it reflective access to java.base internals it needs (e.g. IMPL_LOOKUP).
    try {
      const sep = process.platform === 'win32' ? ';' : ':'
      let secureOnModulePath = false
      for (let i = 0; i < resolvedLoaderJvmArgs.length; i++) {
        const it = resolvedLoaderJvmArgs[i]
        if (!it) continue
        if ((it === '-p' || it === '--module-path') && typeof resolvedLoaderJvmArgs[i + 1] === 'string') {
          if (resolvedLoaderJvmArgs[i + 1].indexOf('securejarhandler') !== -1) { secureOnModulePath = true; break }
          i += 1
          continue
        }
        if (typeof it === 'string' && it.startsWith('--module-path=')) {
          const val = it.slice('--module-path='.length)
          if (val.indexOf('securejarhandler') !== -1) { secureOnModulePath = true; break }
        }
      }

      if (secureOnModulePath) {
        const needAdds = [
          '--add-opens=java.base/java.lang.invoke=cpw.mods.securejarhandler',
          '--add-opens=java.base/java.util.jar=cpw.mods.securejarhandler',
          '--add-exports=java.base/sun.security.util=cpw.mods.securejarhandler'
        ]
        for (const a of needAdds) {
          if (!options.customArgs.includes(a)) options.customArgs.push(a)
        }
        if (verboseLaunchLogging) console.log('Added targeted add-opens/exports for cpw.mods.securejarhandler')
      }
    } catch (e) {
      if (verboseLaunchLogging) console.warn('Failed to add securejarhandler opens/exports:', e && e.message)
    }
  }

  // If we have user_properties for custom skin injection, pass it as game launch args, not JVM args.
  if (authorization && authorization.user_properties && authorization.user_properties !== '{}') {
    options.customLaunchArgs = options.customLaunchArgs || []
    if (!options.customLaunchArgs.some(a => a === '--userProperties')) {
      options.customLaunchArgs.push('--userProperties', authorization.user_properties)
    }
  }

  const profileFullscreenMode = profile.fullscreenMode || 'global'
  const shouldLaunchFullscreen = profileFullscreenMode === 'on'
    ? true
    : profileFullscreenMode === 'off'
      ? false
      : Boolean(launcherSettings.fullscreen)

  if (shouldLaunchFullscreen) {
    options.customLaunchArgs = options.customLaunchArgs || []
    if (!options.customLaunchArgs.some((arg) => arg === '--fullscreen')) {
      options.customLaunchArgs.push('--fullscreen')
    }
  }

  if (verboseLaunchLogging) console.log('RAM debug:', { safeRam, memory: options.memory, customArgs: options.customArgs.filter(a => typeof a === 'string' && a.startsWith('-Xm')) })
  if (verboseLaunchLogging) console.log('customLaunchArgs:', options.customLaunchArgs)

  // Modern Forge is installed by @xmcl/installer as a normal custom version
  // directory with its own version json. Passing the installer jar to MCLC at
  // this point makes it generate a ForgeWrapper launch path on top of the
  // installed profile, which can exit before Minecraft writes latest.log.
  if (profile.loader === 'forge' && installedForgeInstallerJar && !installedLoaderId) {
    options.forge = installedForgeInstallerJar
  }

  // Add Quilt-specific JVM args to work around service loader issues
  if (profile.loader === 'quilt') {
    if (!Array.isArray(options.customArgs)) options.customArgs = []
    // Fix for virtual address space issues on 64-bit systems
    // NOTE: HeapBaseMinAddress and UseCompressedOops are now added for all mod loaders below
    // Allow loading from all modules
    options.customArgs.push('--add-opens', 'java.base/java.lang=ALL-UNNAMED')
    options.customArgs.push('--add-opens', 'java.base/java.io=ALL-UNNAMED')
    options.customArgs.push('--add-opens', 'java.base/java.util=ALL-UNNAMED')
    options.customArgs.push('--add-opens', 'java.base/java.util.jar=ALL-UNNAMED')
    options.customArgs.push('--add-opens', 'java.base/java.util.regex=ALL-UNNAMED')
    options.customArgs.push('--add-opens', 'java.base/java.util.zip=ALL-UNNAMED')
    options.customArgs.push('--add-opens', 'java.base/java.lang.reflect=ALL-UNNAMED')
    options.customArgs.push('--add-opens', 'java.base/java.net=ALL-UNNAMED')
    options.customArgs.push('--add-opens', 'java.base/java.nio=ALL-UNNAMED')
    options.customArgs.push('--add-opens', 'java.base/java.nio.file=ALL-UNNAMED')
    options.customArgs.push('--add-opens', 'java.base/java.security=ALL-UNNAMED')
    options.customArgs.push('--add-opens', 'java.base/java.util.concurrent=ALL-UNNAMED')
    options.customArgs.push('--add-opens', 'java.base/java.util.concurrent.atomic=ALL-UNNAMED')
    options.customArgs.push('--add-opens', 'jdk.naming.dns/com.sun.jndi.dns=ALL-UNNAMED')
    options.customArgs.push('--add-opens', 'jdk.naming.rmi/com.sun.jndi.url.rmi=ALL-UNNAMED')
    // Disable FML properties that may interfere with Quilt
    options.customArgs.push('-Dfml.ignorePatchDiscrepancies=false')
    options.customArgs.push('-Dfml.ignoreInvalidMinecraftCertificates=false')
    if (verboseLaunchLogging) console.log('Quilt custom args:', options.customArgs)
  }

  if (profile.loader === 'neoforge') {
    if (!Array.isArray(options.customArgs)) options.customArgs = []
    if (!installedNeoForgeArgsFile) {
      const libDir = path.join(userData, 'minecraft', 'libraries').replace(/\\/g, '\\\\')
      options.customArgs.push('-DlibraryDirectory=' + libDir)
      // HeapBaseMinAddress and UseCompressedOops moved below for all mod loaders
      // Add opens for Java 17+ module system as a fallback if official arg file is unavailable
      options.customArgs.push('--add-opens', 'java.base/java.lang.invoke=ALL-UNNAMED')
      options.customArgs.push('--add-opens', 'java.base/java.lang=ALL-UNNAMED')
      options.customArgs.push('--add-opens', 'java.base/java.io=ALL-UNNAMED')
      options.customArgs.push('--add-opens', 'java.base/java.util=ALL-UNNAMED')
      options.customArgs.push('--add-opens', 'java.base/java.util.jar=ALL-UNNAMED')
      options.customArgs.push('--add-opens', 'java.base/java.util.zip=ALL-UNNAMED')
      options.customArgs.push('--add-opens', 'java.base/java.lang.reflect=ALL-UNNAMED')
      options.customArgs.push('--add-opens', 'java.base/java.net=ALL-UNNAMED')
      options.customArgs.push('--add-opens', 'java.base/java.nio=ALL-UNNAMED')
      options.customArgs.push('--add-opens', 'java.base/java.security=ALL-UNNAMED')
      options.customArgs.push('--add-opens', 'java.base/java.util.concurrent=ALL-UNNAMED')
      options.customArgs.push('--add-opens', 'java.base/java.util.concurrent.atomic=ALL-UNNAMED')
      options.customArgs.push('-Dfml.ignorePatchDiscrepancies=false')
      options.customArgs.push('-Dfml.ignoreInvalidMinecraftCertificates=false')
    }
    if (verboseLaunchLogging) console.log('NeoForge custom args:', options.customArgs)
  }

  // Do not force low-level heap placement or compressed-oops overrides for mod loaders.
  // These flags can destabilize LWJGL/HotSpot startup on some Windows systems.
  if (usesModLoader && Array.isArray(options.customArgs)) {
    options.customArgs = options.customArgs.filter((arg) => {
      if (typeof arg !== 'string') return true
      return !arg.startsWith('-XX:HeapBaseMinAddress') &&
        arg !== '-XX:-UseCompressedOops' &&
        !arg.startsWith('-Xmx') &&
        !arg.startsWith('-Xms') &&
        !arg.startsWith('-Xss') &&
        !arg.startsWith('-XX:MaxMetaspaceSize')
    })
    if (verboseLaunchLogging) console.log('Mod loader JVM flags sanitized')
  }

  if (kuroBoostPlan.enabled && Array.isArray(options.customArgs)) {
    options.customArgs.push(...kuroBoostPlan.jvmArgs)
    broadcastLaunchProgress({
      message: `KuroBoost: JVM профиль применён (${kuroBoostPlan.jvmArgs.length} флагов)`,
      phase: 'preparing'
    })
  }

  if (Array.isArray(options.customArgs)) {
    options.customArgs = dedupeJvmArgsPreservingPairs(options.customArgs)
  }

  const requestedGB = ramPreference.requested === 'auto' ? -1 : parseMemoryGB(ramPreference.requested)
  if (parseMemoryGB(safeRam) < (requestedGB > 0 ? requestedGB : 999)) {
    broadcastLaunchProgress({ message: `Память скорректирована до ${safeRam}`, phase: 'preparing' })
  }
  broadcastLaunchProgress({
    message: ramPreference.source === 'launcher'
      ? `RAM запуска: ${safeRam} (из настроек лаунчера)`
      : ramPreference.source === 'profile'
        ? `RAM запуска: ${safeRam} (из профиля)`
        : ramPreference.source === 'kuroboost'
          ? `RAM запуска: ${safeRam} (KuroBoost AI)`
          : `RAM запуска: ${safeRam} (авто)`,
    phase: 'preparing'
  })

  const gameDirectoryForLaunch = profile.modpackPath || root
  if (kuroBoostPlan.enabled) {
    await applyKuroBoostOptions(gameDirectoryForLaunch, kuroBoostPlan.gameOptions)
    await writeKuroBoostPlan(gameDirectoryForLaunch, kuroBoostPlan)
    broadcastLaunchProgress({
      message: `KuroBoost: options.txt обновлён (render ${kuroBoostPlan.gameOptions.renderDistance}, fps ${kuroBoostPlan.gameOptions.maxFps})`,
      phase: 'preparing'
    })
  }
  const launchLogPath = await beginLaunchLog(gameDirectoryForLaunch, {
    profile: {
      id: profile.id,
      name: profile.name,
      versionId: profile.versionId,
      loader: profile.loader,
      loaderVersion: profile.loaderVersion || installedLoaderVersion || null,
      ram: {
        profile: ramPreference.profile,
        launcher: ramPreference.global,
        requested: ramPreference.requested,
        effective: safeRam,
        source: ramPreference.source
      },
      modpackPath: profile.modpackPath || null
    },
    javaPath,
    root,
    version: versionOption,
    overrides: options.overrides,
    forge: options.forge || null,
    forgeClientJar: installedForgeClientJar || null,
    customArgs: options.customArgs || [],
    customLaunchArgs: options.customLaunchArgs || [],
    kuroBoost: kuroBoostPlan.enabled ? {
      preset: kuroBoostPlan.preset,
      recommendedRam: kuroBoostPlan.recommendedRam,
      gameOptions: kuroBoostPlan.gameOptions,
      warnings: kuroBoostPlan.warnings
    } : { enabled: false }
  }, authorization)
  if (launchLogPath) {
    broadcastLaunchProgress({ message: `Лог запуска: ${launchLogPath}`, stream: 'log', phase: 'preparing' })
  }

  let launcherFailureDetail = ''
  launcher.on('arguments', (args) => {
    const list = Array.isArray(args) ? args : [args]
    appendLaunchLog(launchLogPath, 'arguments', list.join(' '), authorization)
  })

  launcher.on('debug', (data) => {
    const text = data.toString()
    appendLaunchLog(launchLogPath, 'debug', text, authorization)
    const failurePrefix = '[MCLC]: Failed to start due to '
    if (text.includes(failurePrefix)) {
      launcherFailureDetail = text.slice(text.indexOf(failurePrefix) + failurePrefix.length).trim()
      console.warn('MCLC startup failure:', launcherFailureDetail)
    }
    if (verboseLaunchLogging) console.debug('Launcher debug:', data)
    if (!text.includes('[MCLC]: Launching with arguments')) {
      broadcastLaunchProgress({ message: text, stream: 'log', phase: 'preparing' })
    }
  })

  launcher.on('progress', (data) => {
    let message = 'Загрузка...'
    let progress = undefined

    if (data && typeof data === 'object') {
      if (typeof data.name === 'string') {
        if (typeof data.progress === 'number') {
          message = `${data.name}: ${data.progress.toFixed(0)}%`
        } else {
          message = data.name
        }
      } else if (typeof data.type === 'string' && typeof data.task === 'number' && typeof data.total === 'number') {
        const name = data.type === 'assets' ? 'Активы' : data.type === 'natives' ? 'Нативы' : data.type
        message = `Загрузка ${name}: ${data.task}/${data.total}`
        progress = { current: data.task, total: data.total }
      } else if (typeof data.type === 'string' && typeof data.current === 'number' && typeof data.total === 'number') {
        const name = data.type === 'assets' ? 'Активы' : data.type === 'natives' ? 'Нативы' : data.type
        message = `Загрузка ${name}: ${data.current}/${data.total}`
        progress = { current: data.current, total: data.total }
      } else {
        message = JSON.stringify(data)
      }
    } else {
      message = String(data)
    }

    appendLaunchLog(launchLogPath, 'progress', message, authorization)
    broadcastLaunchProgress({ message, progress, phase: 'preparing' })
  })

  launcher.on('data', (data) => {
    const text = data.toString()
    appendLaunchLog(launchLogPath, 'minecraft', text, authorization)
    if (verboseLaunchLogging) console.log('Launcher data:', text)
    broadcastLaunchProgress({ message: text, stream: 'log', phase: 'preparing' })
  })

  launcher.on('close', async (code) => {
    appendLaunchLog(launchLogPath, 'close', `MCLC close event: ${code}`, authorization)
    if (code !== 0) {
      const crashSummary = await summarizeLatestCrashReport(gameDirectoryForLaunch)
      const launchSummary = crashSummary ? null : await summarizeLatestKuroLaunchLog(gameDirectoryForLaunch)
      const failureSummary = crashSummary || launchSummary
      broadcastLaunchProgress({
        message: failureSummary?.message
          ? `Minecraft завершился с кодом ${code}: ${failureSummary.message}`
          : `Minecraft завершился с кодом ${code}`,
        tone: 'error',
        phase: 'error'
      })
    }
  })

  try {
    if (verboseLaunchLogging) {
      console.log('Launching with options.version:', versionOption)
      console.log('RAM debug:', { safeRam, memory: options.memory, customArgs: options.customArgs.filter(a => a.startsWith('-Xm')) })
      console.log('installedLoaderId:', installedLoaderId)
      console.log('installedLoaderVersion:', installedLoaderVersion)
      console.log('installedForgeInstallerJar:', installedForgeInstallerJar)
      console.log('Final launcher options (partial):', {
        version: options.version,
        overrides: options.overrides,
        forge: options.forge,
        javaPath: options.javaPath
      })
    }
    try {
      if (verboseLaunchLogging) {
        console.log('authorization preview:', {
          uuid: authorization && authorization.uuid,
          name: authorization && authorization.name,
          user_properties_preview: authorization && (typeof authorization.user_properties === 'string'
            ? authorization.user_properties.slice(0, 200)
            : JSON.stringify(authorization.user_properties).slice(0, 200))
        })
      }
    } catch (e) {
      // ignore logging errors
    }
    const child = await launcher.launch(options)
    if (!child) {
      appendLaunchLog(launchLogPath, 'error', launcherFailureDetail || 'launcher.launch returned no child process', authorization)
      throw new Error(launcherFailureDetail || 'Не удалось запустить Minecraft. Проверьте Java и версию.')
    }
    minecraftProcessActive = true

    broadcastLaunchProgress({
      message: 'Окно Minecraft открыто. Передаю управление игре...',
      gameStarted: true
    })

    if (mainWindow) {
      setTimeout(() => {
        try {
          mainWindow?.hide()
        } catch {}
      }, 180)
    }

    child.on('error', (error) => {
      minecraftProcessActive = false
      appendLaunchLog(launchLogPath, 'error', `Child process error: ${error.message}`, authorization)
      console.error('Launch error', error)
      broadcastLaunchProgress({ message: `Ошибка запуска: ${error.message}`, tone: 'error', phase: 'error' })
    })

    child.on('close', async (code) => {
      minecraftProcessActive = false
      appendLaunchLog(launchLogPath, 'close', `Minecraft process closed with code ${code}`, authorization)
      if (verboseLaunchLogging) console.log('Minecraft closed with code:', code)

      // Show launcher window again when Minecraft closes
      if (mainWindow) {
        mainWindowShownAt = Date.now()
        mainWindow.show()
        mainWindow.focus()
      }

      const gameDirectory = gameDirectoryForLaunch
      const crashSummary = code === 0 ? null : await summarizeLatestCrashReport(gameDirectory)
      const launchSummary = code === 0 || crashSummary ? null : await summarizeLatestKuroLaunchLog(gameDirectory)
      const failureSummary = crashSummary || launchSummary
      if (crashSummary) {
        console.warn('Latest Minecraft crash report:', crashSummary.path, crashSummary.message)
      } else if (launchSummary) {
        console.warn('Latest KuroLauncher launch log:', launchSummary.path, launchSummary.message)
      }

      const exitMessage = code === 0
        ? 'Игра завершена успешно'
        : failureSummary?.message
          ? `Игра завершена с кодом ${code}: ${failureSummary.message}`
          : `Игра завершена с кодом ${code}`

      broadcastLaunchProgress({ message: exitMessage, gameExited: true })
    })

    return true
  } catch (launchError) {
    appendLaunchLog(launchLogPath, 'error', `Launcher launch error: ${launchError.message}`, authorization)
    console.error('Launcher launch error:', launchError)
    if (mainWindow) {
      try {
        mainWindowShownAt = Date.now()
        mainWindow.show()
        mainWindow.focus()
      } catch {}
    }
    broadcastLaunchProgress({ message: `Не удалось запустить Minecraft: ${launchError.message}` })
    throw new Error(`Не удалось запустить Minecraft: ${launchError.message}`)
  }
}

async function createWindow() {
  // Storage and skin server are already initialized in app.whenReady

  const win = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 1100,
    minHeight: 720,
    show: false,
    backgroundColor: '#080808',
    frame: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Remove default application menu to hide File/Edit/View/Window/Help
  try { Menu.setApplicationMenu(null) } catch (e) {}

  // Keep reference to window for IPC handlers
  mainWindow = win
  let shown = false
  const showWindow = () => {
    if (shown || win.isDestroyed()) return
    shown = true
    mainWindowShownAt = Date.now()
    win.show()
  }

  win.on('close', () => {
    console.log('Main window close requested')
  })

  win.on('closed', () => {
    console.log('Main window closed')
    if (mainWindow === win) mainWindow = null
  })

  win.webContents.on('render-process-gone', (_event, details) => {
    console.error('Renderer process gone:', details)
  })

  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    console.error('Renderer did-fail-load:', { errorCode, errorDescription, validatedURL, isMainFrame })
  })

  win.once('ready-to-show', showWindow)
  await loadRendererUrl(win)
  showWindow()

  // Forward maximize/unmaximize state to renderer for UI updates
  win.on('maximize', () => win.webContents.send('window:maximize-change', true))
  win.on('unmaximize', () => win.webContents.send('window:maximize-change', false))
}

async function findDevServerPort() {
  const configuredPort = Number.parseInt(process.env.KURO_DEV_SERVER_PORT || '4173', 10)
  const port = Number.isFinite(configuredPort) ? configuredPort : 4173

  const start = Date.now()
  const maxWaitMs = 5000 // wait up to 5s for dev server to appear
  const perAttemptDelay = 300

  while (Date.now() - start < maxWaitMs) {
    try {
      const res = await axios.get(`http://localhost:${port}`, { timeout: 800 })
      if (res.status && res.status >= 200) {
        console.log('findDevServerPort: found responsive server at', port)
        return port
      }
    } catch {
      // ignore and retry the configured dev port
    }
    // small delay before retrying the port scan
    await new Promise((resolve) => setTimeout(resolve, perAttemptDelay))
  }

  return null
}

app.whenReady().then(async () => {
  // Initialize paths now that app is ready
  userData = path.join(app.getPath('userData'), 'kuro')
  minecraftPath = path.join(userData, 'minecraft')
  versionsPath = path.join(minecraftPath, 'versions')
  profilesPath = path.join(userData, 'profiles.json')
  settingsPath = path.join(userData, 'settings.json')
  authPath = path.join(userData, 'auth.json')
  modsPath = path.join(minecraftPath, 'mods')
  shaderpacksPath = path.join(minecraftPath, 'shaderpacks')
  resourcepacksPath = path.join(minecraftPath, 'resourcepacks')
  modpacksPath = path.join(userData, 'modpacks')
  modrinthCachePath = path.join(userData, 'modrinth_cache.json')

  // Initialize storage and skin server before creating window
  await ensureStorage()
  await startSkinServer()
  if (!app.isPackaged) {
    currentDevServerPort = await findDevServerPort() || 4173
    console.log('Dev server detected on port', currentDevServerPort)
  }
  await createWindow()
})

app.on('before-quit', () => {
  console.log('App before-quit')
})

app.on('will-quit', () => {
  console.log('App will-quit')
})

app.on('window-all-closed', () => {
  console.log('App window-all-closed')
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createWindow()
  }
})

ipcMain.handle('launcher:fetchVersionManifest', async () => {
  const list = await fetchVersionManifest()
  return list
})

ipcMain.handle('launcher:getInstalledVersions', async () => {
  return await getInstalledVersions()
})

ipcMain.handle('launcher:installVersion', async (event, versionId) => {
  await downloadVersion(versionId, event)
  return true
})

ipcMain.handle('launcher:deleteInstalledVersion', async (event, versionId) => {
  await deleteInstalledVersion(versionId)
  return true
})

ipcMain.handle('launcher:getProfiles', async () => {
  return await getProfiles()
})

ipcMain.handle('launcher:getLoaderVersions', async (event, minecraftVersion, loader) => {
  if (!minecraftVersion || !loader) {
    return []
  }

  if (loader === 'fabric') {
    const loaders = await getLoaderArtifactListFor(minecraftVersion)
    const list = Array.isArray(loaders) ? loaders : Object.values(loaders || {})
    return list
      .map((item) => ({
        version: item?.loader?.version || item?.version || '',
        label: item?.loader?.version || item?.version || '',
        stable: item?.loader?.stable || false
      }))
      .filter((item) => item.version)
  }

  if (loader === 'quilt') {
    const loaders = await getQuiltLoaderVersionsByMinecraft({ minecraftVersion })
    const list = Array.isArray(loaders) ? loaders : Object.values(loaders || {})
    return list
      .map((item) => ({
        version: item?.loader?.version || item?.version || '',
        label: item?.loader?.version || item?.version || '',
        stable: item?.loader?.stable || false
      }))
      .filter((item) => item.version)
  }

  if (loader === 'forge') {
    const result = await getForgeVersionList({ minecraft: minecraftVersion })
    const versions = Array.isArray(result) ? result : result?.versions || Object.values(result || {})
    return versions
      .map((item) => ({
        version: item.version,
        label: item.version,
        mcversion: item.mcversion,
        stable: item?.stable || false
      }))
      .filter((item) => item.version)
  }

  if (loader === 'neoforge') {
    const versions = await getNeoForgedVersionsFromMaven(minecraftVersion)
    return versions
      .map((item) => ({
        version: item.version,
        label: item.version,
        mcversion: item.mcversion,
        stable: item.stable
      }))
      .filter((item) => item.version)
  }

  return []
})

ipcMain.handle('launcher:saveProfile', async (event, profile) => {
  await saveProfile(profile)
  return true
})

ipcMain.handle('launcher:createCustomModpack', async (event, input) => {
  return await createCustomModpack(input)
})

ipcMain.handle('launcher:deleteProfile', async (event, profileId) => {
  await deleteProfile(profileId)
  return true
})

ipcMain.handle('launcher:getSettings', async () => {
  return await getSettings()
})

ipcMain.handle('launcher:saveSettings', async (event, settings) => {
  await saveSettings(settings)
  return true
})

ipcMain.handle('launcher:getAuthState', async () => {
  return await getAuthState()
})

ipcMain.handle('launcher:loginUser', async (event, email, password) => {
  return await loginUser(email, password)
})

ipcMain.handle('launcher:registerUser', async (event, email, password) => {
  return await registerUser(email, password)
})

ipcMain.handle('launcher:logoutUser', async () => {
  await fs.writeFile(authPath, JSON.stringify({ email: '', loggedIn: false }, null, 2), 'utf-8')
  return true
})

ipcMain.handle('launcher:launchProfile', async (event, profileId, launcherProfileName) => {
  const profiles = await getProfiles()
  const profile = profiles.find((item) => item.id === profileId)
  if (!profile) throw new Error('Профиль не найден')
  await launchGame(profile, event, launcherProfileName)
  return true
})

ipcMain.handle('launcher:searchModrinth', async (event, query, options) => {
  return await searchModrinth(query, options)
})

ipcMain.handle('launcher:getModrinthProject', async (event, projectId) => {
  return await getModrinthProject(projectId)
})

ipcMain.handle('launcher:getModrinthVersions', async (event, projectId) => {
  return await getModrinthVersions(projectId)
})

ipcMain.handle('launcher:getModrinthVersion', async (event, versionId) => {
  return await getModrinthVersion(versionId)
})

ipcMain.handle('launcher:installModrinthProject', async (event, projectId, options) => {
  return await installModrinthProject(projectId, options)
})

ipcMain.handle('launcher:installModrinthVersion', async (event, versionId, options) => {
  const version = await getModrinthVersion(versionId)
  return await installModrinthVersion(version, options)
})

ipcMain.handle('launcher:getInstalledModrinthAddons', async () => {
  return await getInstalledModrinthAddons()
})

ipcMain.handle('launcher:toggleInstalledAddon', async (event, type, name, enabled, addonPath) => {
  return await toggleInstalledAddon(type, name, enabled, addonPath)
})

ipcMain.handle('launcher:deleteInstalledAddon', async (event, type, name, addonPath) => {
  return await deleteInstalledAddon(type, name, addonPath)
})

ipcMain.handle('launcher:deleteModpackDirectory', async (event, modpackKey) => {
  try {
    return await deleteModpackDirectory(modpackKey)
  } catch (e) {
    console.error('Failed to delete modpack directory:', e && e.message)
    throw e
  }
})

// Window control handlers (used by custom titlebar)
ipcMain.handle('window:minimize', async () => {
  if (mainWindow) mainWindow.minimize()
  return true
})

ipcMain.handle('window:toggleMaximize', async () => {
  if (!mainWindow) return false
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize()
    return false
  } else {
    mainWindow.maximize()
    return true
  }
})

ipcMain.handle('window:isMaximized', async () => {
  return mainWindow ? mainWindow.isMaximized() : false
})

ipcMain.handle('window:close', async (_event, payload) => {
  try {
    const tsInfo = payload && payload.ts ? `ts=${payload.ts}` : 'no-ts'
    console.log('IPC window:close invoked', tsInfo)
    if (payload && payload.stack) {
      const lines = String(payload.stack).split('\n').slice(0, 4)
      console.log('IPC close stack (truncated):\n' + lines.join('\n'))
    }
  } catch (e) {
    console.log('IPC window:close invoked (failed to print payload)')
  }

  if (mainWindow) {
    if (minecraftProcessActive) {
      console.log('Minecraft is active, hiding launcher window instead of closing it')
      mainWindow.hide()
    } else if (Date.now() - mainWindowShownAt < STARTUP_CLOSE_GUARD_MS) {
      console.log('Ignoring window:close during startup guard')
    } else {
      mainWindow.close()
    }
  }
  return true
})
