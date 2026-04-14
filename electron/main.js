const { app, BrowserWindow, ipcMain, Menu } = require('electron')
const path = require('path')
const fs = require('fs').promises
const fsSync = require('fs')
const os = require('os')
const crypto = require('crypto')
const { finished } = require('stream/promises')
const axios = require('axios')
const { Client, Authenticator } = require('minecraft-launcher-core')
const { installFabric, getLoaderArtifactListFor, getForgeVersionList, installForge, getQuiltLoaderVersionsByMinecraft, installQuiltVersion, installNeoForged } = require('@xmcl/installer')
const AdmZip = require('adm-zip')
const http = require('http')
const url = require('url')

// Paths will be initialized when app is ready
let userData, minecraftPath, versionsPath, profilesPath, settingsPath, authPath, modsPath, shaderpacksPath, resourcepacksPath, modpacksPath, modrinthCachePath

async function ensureStorage() {
  await fs.mkdir(userData, { recursive: true })
  await fs.mkdir(minecraftPath, { recursive: true })
  await fs.mkdir(versionsPath, { recursive: true })
  await fs.mkdir(modsPath, { recursive: true })
  await fs.mkdir(shaderpacksPath, { recursive: true })
  await fs.mkdir(resourcepacksPath, { recursive: true })
  await fs.mkdir(modpacksPath, { recursive: true })
  if (!fsSync.existsSync(profilesPath)) await fs.writeFile(profilesPath, '[]')
  if (!fsSync.existsSync(settingsPath)) await fs.writeFile(settingsPath, JSON.stringify({ theme: 'dark', javaPath: 'java', ram: 'auto' }, null, 2))
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

async function downloadAndInstallJava(majorVersion, event = null) {
  const javaDir = path.join(userData, 'java')
  const jdkDir = path.join(javaDir, `jdk-${majorVersion}`)
  const javaExe = path.join(jdkDir, 'bin', 'java.exe')

  if (fsSync.existsSync(javaExe)) {
    console.log(`Java ${majorVersion} already installed at ${jdkDir}`)
    return javaExe
  }

  console.log(`Downloading Java ${majorVersion}...`)
  event?.sender.send('launcher:launchProgress', { message: `Загрузка Java ${majorVersion}...` })

  try {
    const downloadUrl = `https://api.adoptium.net/v3/binary/latest/${majorVersion}/ga/windows/x64/jdk/hotspot/normal/eclipse`
    const filename = path.basename(downloadUrl)
    const tempZip = path.join(javaDir, filename)

    // Download JDK
    await downloadFile(downloadUrl, tempZip)

    // Extract ZIP
    await fs.mkdir(jdkDir, { recursive: true })
    const zip = new AdmZip(tempZip)
    zip.extractAllTo(jdkDir, true)

    // Clean up
    await fs.unlink(tempZip)

    // Find the actual JDK directory (Adoptium zips have a subdirectory)
    const entries = await fs.readdir(jdkDir)
    if (entries.length === 1 && entries[0].startsWith('jdk-')) {
      const actualJdkDir = path.join(jdkDir, entries[0])
      const actualJavaExe = path.join(actualJdkDir, 'bin', 'java.exe')
      if (fsSync.existsSync(actualJavaExe)) {
        // Move contents up
        const files = await fs.readdir(actualJdkDir)
        for (const file of files) {
          await fs.rename(path.join(actualJdkDir, file), path.join(jdkDir, file))
        }
        await fs.rmdir(actualJdkDir)
      }
    }

    if (!fsSync.existsSync(javaExe)) {
      throw new Error(`Java executable not found after extraction`)
    }

    console.log(`Java ${majorVersion} installed successfully`)
    return javaExe
  } catch (error) {
    console.error('Failed to download/install Java:', error.message)
    throw error
  }
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
    
    const mcVersion = minecraftVersion.replace('1.', '')
    const mcParts = mcVersion.split('.')
    let mcMajor = parseInt(mcParts[0], 10)
    let mcMinor = mcParts.length > 1 ? parseInt(mcParts[1], 10) : 0
    
    console.log('Looking for MC version:', minecraftVersion, '-> NF major.minor:', mcMajor + '.' + mcMinor)
    
    versions = versions.filter(v => {
      const parts = v.split('.')
      const nfMajor = parseInt(parts[0], 10)
      const nfMinor = parseInt(parts[1], 10)
      
      return nfMajor === mcMajor && nfMinor === mcMinor
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



async function getForgeVersionJson(minecraftVersion) {
  // For simplicity, assume latest Forge for the version
  const url = `https://files.minecraftforge.net/net/minecraftforge/forge/index_${minecraftVersion}.html`
  // This is not accurate, but for demo
  // Actually, need to parse or use API
  // For now, skip Forge
  throw new Error('Forge not implemented yet')
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

async function installModrinthVersion(version, options = {}) {
  const { projectType = 'mod', gameVersion = '', loader = '', visited = new Set() } = options
  if (!version) throw new Error('Версия Modrinth не найдена для установки')

  const file = chooseModrinthFile(version.files, projectType)
  if (!file || !file.url) {
    throw new Error('Не удалось найти файл для загрузки Modrinth')
  }

  let directory = modsPath
  if (projectType === 'resourcepack') directory = resourcepacksPath
  if (projectType === 'shader') directory = shaderpacksPath
  if (projectType === 'modpack') directory = modpacksPath

  const destination = path.join(directory, file.filename)
  await downloadFile(file.url, destination)

  if (projectType === 'modpack') {
    await installModrinthModpackArchive(destination, version)
    return true
  }

  await resolveModrinthDependencies(version, { gameVersion, loader, visited })
  return true
}

async function resolveModrinthDependencies(version, options = {}) {
  const { gameVersion = '', loader = '', visited = new Set() } = options
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
        await installModrinthVersion(depVersion, { projectType: depVersion.project_type || 'mod', gameVersion, loader, visited })
      } else {
        await installModrinthProject(projectId, { gameVersion, loader })
      }
      installed.push(projectId)
    } catch (error) {
      console.error(`Ошибка установки зависимости ${projectId}:`, error)
    }
  }

  return installed
}

async function installModrinthModpackArchive(filePath, version) {
  const projectId = version.project_id || 'modpack'
  const extractDir = path.join(modpacksPath, `${projectId}-${version.id}`)
  const zip = new AdmZip(filePath)
  zip.extractAllTo(extractDir, true)

  const indexPath = path.join(extractDir, 'modrinth.index.json')
  if (fsSync.existsSync(indexPath)) {
    const indexData = JSON.parse(await fs.readFile(indexPath, 'utf-8'))
    const installDirs = ['mods', 'resourcepacks', 'shaderpacks']
    for (const name of installDirs) {
      const sourceDir = path.join(extractDir, name)
      if (fsSync.existsSync(sourceDir)) {
        const destinationDir = name === 'mods' ? modsPath : name === 'resourcepacks' ? resourcepacksPath : shaderpacksPath
        await fs.mkdir(destinationDir, { recursive: true })
        const files = await fs.readdir(sourceDir)
        for (const entry of files) {
          await fs.copyFile(path.join(sourceDir, entry), path.join(destinationDir, entry))
        }
      }
    }
  }
}

async function installModrinthProject(projectId, options = {}) {
  const { gameVersion = '', loader = '' } = options
  const project = await getModrinthProject(projectId)
  const versions = await getModrinthVersions(projectId)
  const version = chooseModrinthVersion(versions, gameVersion || project.game_versions?.[0], loader)
  if (!version) {
    throw new Error('Не удалось найти совместимую версию проекта Modrinth')
  }

  if (project.project_type === 'modpack') {
    await installModrinthVersion(version, { projectType: 'modpack', gameVersion, loader })
    await saveProfile({
      id: `modpack-${projectId}`,
      name: `Modpack: ${project.title}`,
      versionId: version.game_versions?.[0] || '1.20.1',
      ram: '4G',
      javaPath: 'java',
      username: '',
      offline: true
    })
    return true
  }

  return await installModrinthVersion(version, { projectType: project.project_type, gameVersion, loader })
}

async function getInstalledModrinthAddons() {
  const addons = []
  const scanDirectory = async (directory, type) => {
    try {
      const entries = await fs.readdir(directory, { withFileTypes: true })
      for (const entry of entries) {
        if (!entry.isFile()) continue
        const enabled = !entry.name.endsWith('.disabled')
        addons.push({
          id: `${type}:${entry.name}`,
          name: entry.name,
          type,
          enabled,
          path: path.join(directory, entry.name)
        })
      }
    } catch {
      // ignore
    }
  }

  await scanDirectory(modsPath, 'mods')
  await scanDirectory(shaderpacksPath, 'shaderpacks')
  await scanDirectory(resourcepacksPath, 'resourcepacks')
  return addons
}

function getAddonDirectory(type) {
  if (type === 'mods') return modsPath
  if (type === 'shaderpacks') return shaderpacksPath
  if (type === 'resourcepacks') return resourcepacksPath
  throw new Error(`Неизвестный тип аддона: ${type}`)
}

async function toggleInstalledAddon(type, name, enabled) {
  const directory = getAddonDirectory(type)
  const currentPath = path.join(directory, name)
  const targetName = enabled ? name.replace(/\.disabled$/, '') : `${name}.disabled`
  const targetPath = path.join(directory, targetName)

  if (!fsSync.existsSync(currentPath)) {
    throw new Error(`Файл не найден: ${name}`)
  }

  await fs.rename(currentPath, targetPath)
}

async function deleteInstalledAddon(type, name) {
  const directory = getAddonDirectory(type)
  const targetPath = path.join(directory, name)
  await fs.rm(targetPath, { recursive: true, force: true })
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
  const versionDir = path.join(versionsPath, versionId)
  try {
    await fs.rm(versionDir, { recursive: true, force: true })
  } catch (error) {
    console.error(`Не удалось удалить версию ${versionId}:`, error)
    throw new Error(`Не удалось удалить версию ${versionId}`)
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
  return await readJson(settingsPath, { theme: 'dark', javaPath: 'java', ram: 'auto' })
}

async function saveSettings(settings) {
  await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf-8')
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

async function getRequiredJavaMajor(versionId) {
  try {
    const versionFile = path.join(versionsPath, versionId, `${versionId}.json`)
    const data = await readJson(versionFile, null)
    if (!data) return 17
    if (data.javaVersion && typeof data.javaVersion.majorVersion === 'number') {
      return data.javaVersion.majorVersion
    }
    if (data.javaVersion && typeof data.javaVersion.component === 'string') {
      const match = data.javaVersion.component.match(/(\d+)/)
      if (match) return parseInt(match[1], 10)
    }

    const parts = versionId.split('.').map((part) => parseInt(part, 10) || 0)
    if ((parts[0] === 1 && parts[1] >= 21) || parts[0] > 1) {
      return 21
    }
    return 17
  } catch {
    return 17
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



async function findJavaPath(preferredPath, minMajor = 17, event = null) {
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
      return { candidate, major }
    })
    .filter(Boolean)

  if (matches.length === 0) {
    console.log(`Java ${minMajor}+ not found, downloading...`)
    try {
      const downloadedPath = await downloadAndInstallJava(minMajor, event)
      return downloadedPath
    } catch (error) {
      throw new Error(`Java ${minMajor}+ не найдена и не удалось скачать: ${error.message}`)
    }
  }

  matches.sort((a, b) => a.major - b.major)
  if (matches[0].major > minMajor + 2) {
    console.log(`Available Java ${matches[0].major} is too new, downloading ${minMajor}...`)
    try {
      const downloadedPath = await downloadAndInstallJava(minMajor, event)
      return downloadedPath
    } catch (error) {
      console.warn(`Failed to download Java ${minMajor}, using ${matches[0].major}: ${error.message}`)
      // Fall back to the available version
    }
  }
  return matches[0].candidate
}

async function launchGame(profile, event) {
  const requiredJavaMajor = await getRequiredJavaMajor(profile.versionId)
  event?.sender.send('launcher:launchProgress', { message: `Требуемая Java: ${requiredJavaMajor}+` })
  const javaPath = await findJavaPath(profile.javaPath || '', requiredJavaMajor, event)
  const launcher = new Client()
  const root = path.join(userData, 'minecraft')
  const authState = await readJson(authPath, {})

  const profileName = profile.username || authState.name || 'KuroPlayer'
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

  const isOnlineProfile = !profile.offline && authState.access_token && authState.client_token

  const useOfflineAuth = Boolean(profile.offline)

  if (isOnlineProfile && !useOfflineAuth) {
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
    isOfflineFallback = true
    authorization = await Authenticator.getAuth(profileName, undefined)
    authorization.uuid = profile.uuid || authorization.uuid
    authorization.meta = {
      type: 'msa',
      demo: false,
      xuid: '0'
    }
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
      // Prefer explicit URL from profile.skin, otherwise use local skin server
      let skinUrl = profile.skin.url || (skinServerPort ? `http://127.0.0.1:${skinServerPort}/skins/${profile.id}.png` : null)
      if (skinUrl) {
        const texturesObj = {
          timestamp: Date.now(),
          profileId: authorization.uuid,
          profileName: authorization.name || profileName,
          textures: {
            SKIN: { url: skinUrl }
          }
        }
        userProps.textures = Buffer.from(JSON.stringify(texturesObj)).toString('base64')
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
  let installedQuiltRemappedJar = null

  // Ensure base version JSON/jar available so installer and MCLC have a fallback
  try {
    await ensureBaseVersionInstalled(profile.versionId, event)
  } catch (e) {
    console.warn('Failed to ensure base version installed:', e && e.message)
  }

  if (profile.loader === 'fabric') {
    event?.sender.send('launcher:launchProgress', { message: 'Установка Fabric...' })
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
      console.log('Fabric: installing loader', loaderVersion, 'for', profile.versionId)
      
      try {
        const installedVersionId = await installFabric({
          minecraft: root,
          minecraftVersion: profile.versionId,
          version: loaderVersion
        })
        installedLoaderId = installedVersionId || null
      } catch (e) {
        console.warn('Fabric install warning:', e && e.message, 'continuing with base version')
        installedLoaderId = null
      }
      
      console.log('Fabric setup completed, version:', versionInfo.number)
    } catch (error) {
      console.error('Fabric install error:', error)
      event?.sender.send('launcher:launchProgress', { message: `Ошибка установки Fabric: ${error.message}` })
      throw error
    }
  } else if (profile.loader === 'forge') {
    event?.sender.send('launcher:launchProgress', { message: 'Установка Forge...' })
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
      console.log('Forge: installing', artifactName, 'for', profile.versionId)

      try {
        const installedVersionId = await installForge(selected, root, { mcversion: profile.versionId })
        installedLoaderId = installedVersionId || `forge-${artifactName}`
        try {
          // Try expected path first using computed artifact folder
          const expectedForgeJar = path.join(root, 'libraries', 'net', 'minecraftforge', 'forge', artifactName, `forge-${artifactName}-installer.jar`)
          if (fsSync.existsSync(expectedForgeJar)) {
            installedForgeInstallerJar = expectedForgeJar
            console.log('Found forge installer jar at expected path:', installedForgeInstallerJar)
          } else {
            // Fallback to searching the libraries tree
            installedForgeInstallerJar = await findForgeInstallerJar(root)
            console.log('Found forge installer jar via search:', installedForgeInstallerJar)
          }
          if (installedForgeInstallerJar) {
            console.log('Forge installer jar exists on disk:', fsSync.existsSync(installedForgeInstallerJar))
          }
        } catch (err) {
          console.warn('Failed to locate forge installer jar:', err && (err.stack || err.message))
        }
      } catch (e) {
        console.warn('Forge install warning:', e && (e.stack || e.message), 'will try with base version')
        installedLoaderId = null
      }
      
      console.log('Forge setup completed, version:', versionInfo.number)
    } catch (error) {
      console.error('Forge install error:', error)
      event?.sender.send('launcher:launchProgress', { message: `Ошибка установки Forge: ${error.message}` })
      throw error
    }
  } else if (profile.loader === 'neoforge') {
    event?.sender.send('launcher:launchProgress', { message: 'Установка NeoForge...' })
    try {
      const result = await getNeoForgedVersionsFromMaven(profile.versionId)
      const neoVersions = Array.isArray(result)
        ? result
        : result?.versions || []
      const stableVersions = neoVersions.filter(v => v.stable).sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }))
      if (stableVersions.length === 0) {
        throw new Error(`No stable NeoForge version found for Minecraft ${profile.versionId}`)
      }
      
      for (const selected of stableVersions) {
        installedLoaderVersion = selected.version
        console.log('NeoForge: trying to install', selected.version, 'for', profile.versionId)
        try {
          const installedVersionId = await installNeoForged('neoforge', selected.version, root, { mcversion: profile.versionId })
          installedLoaderId = installedVersionId || `neoforge-${selected.version}`
          console.log('NeoForge setup completed, version:', installedLoaderId)
          break
        } catch (e) {
          console.warn('NeoForge install failed for', selected.version, ':', e && (e.stack || e.message), 'trying next version')
        }
      }
      
      if (!installedLoaderId) {
        console.warn('All NeoForge versions failed to install, falling back to base version')
      }
    } catch (error) {
      console.error('NeoForge install error:', error)
      event?.sender.send('launcher:launchProgress', { message: `Ошибка установки NeoForge: ${error.message}` })
      throw error
    }
  } else if (profile.loader === 'quilt') {
    event?.sender.send('launcher:launchProgress', { message: 'Установка Quilt...' })
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
      console.log('Quilt: installing', loaderVersion, 'for', profile.versionId)
      
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
        console.warn('Quilt install warning:', e && e.message, 'continuing with base version')
        installedLoaderId = `quilt-${loaderVersion}`
      }
      
      console.log('Quilt setup completed, version:', versionInfo.number)
    } catch (error) {
      console.error('Quilt install error:', error)
      event?.sender.send('launcher:launchProgress', { message: `Ошибка установки Quilt: ${error.message}` })
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
            console.log('Added launchwrapper to Quilt libraries for Mixin service')
          }
          
          // Only write if there were changes
          const originalJsonString = JSON.stringify(json)
          const filteredJsonString = JSON.stringify(filtered)
          if (originalJsonString !== filteredJsonString) {
            await fs.writeFile(loaderJsonPath, JSON.stringify(filtered, null, 2), 'utf-8')
            console.log(`Filtered Quilt libraries: ${json.libraries.length} -> ${filtered.libraries.length}`)
            if (filtered.arguments?.jvm) {
              console.log(`Filtered Quilt JVM args: ${json.arguments?.jvm?.length || 0} -> ${filtered.arguments.jvm.length}`)
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
    if (value === 'auto' || value === 'Auto' || value === 'AUTO') {
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

  function computeSafeRam(requestedValue, reserveGB = 3) {
    const ONE_GB = 1024 * 1024 * 1024
    const totalGB = Math.max(1, Math.floor(os.totalmem() / ONE_GB))

    let availableGB = totalGB
    try {
      const freeMem = os.freemem()
      availableGB = Math.max(1, Math.floor(freeMem / ONE_GB))
    } catch {}

    // Handle 'auto' - calculate based on system memory
    let requestedGB = parseMemoryGB(requestedValue)
    if (requestedValue === 'auto' || requestedGB === null) {
      // Auto: use 50% of available memory, minimum 2GB, maximum 4GB (to avoid memory issues)
      requestedGB = Math.max(2, Math.min(4, Math.floor(availableGB * 0.5)))
      console.log('Auto RAM calculation: using', requestedGB, 'GB based on', availableGB, 'GB available')
    }

    const maxAllowed = Math.max(2, Math.min(totalGB - Math.ceil(reserveGB), availableGB - 2))

    console.log('RAM calculation:', { totalGB, availableGB, requestedGB, maxAllowed, reserveGB, requestedValue })

    if (requestedGB <= maxAllowed && requestedGB >= 2) {
      return `${requestedGB}G`
    }

    return `${Math.max(2, maxAllowed)}G`
  }

  const safeRam = computeSafeRam(profile.ram)

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
  const versionDirectory = (installedLoaderId && usesModLoader) 
    ? path.join(versionsPath, installedLoaderId) 
    : path.join(versionsPath, profile.versionId)
  const versionJsonOverride = (installedLoaderId && usesModLoader) ? null : baseVersionJsonPath
  const baseJar = path.join(versionsPath, profile.versionId, `${profile.versionId}.jar`)
  
  // For Quilt, prefer vanilla jar over remapped (Quilt will remap internally)
  let mcJar = baseJar
  if (profile.loader === 'quilt') {
    mcJar = baseJar
  } else if (installedQuiltRemappedJar) {
    mcJar = installedQuiltRemappedJar
  }

  const options = {
    clientPackage: null,
    authorization,
    root,
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

  options.customArgs = options.customArgs || []
  // Remove any existing -Xmx/-Xms to avoid duplicates/conflicts
  options.customArgs = options.customArgs.filter(a => !(typeof a === 'string' && (a.startsWith('-Xmx') || a.startsWith('-Xms'))))
  options.customArgs.push('-Xmx' + safeRam)
  options.customArgs.push('-Xms' + safeRam)
  // Add conservative stack size and code cache limits to reduce native memory pressure
  if (!options.customArgs.some(a => typeof a === 'string' && a.startsWith('-Xss'))) options.customArgs.push('-Xss512k')
  if (!options.customArgs.some(a => typeof a === 'string' && a.startsWith('-XX:ReservedCodeCacheSize'))) options.customArgs.push('-XX:ReservedCodeCacheSize=256M')
  if (!options.customArgs.some(a => typeof a === 'string' && a.startsWith('-XX:MaxMetaspaceSize'))) options.customArgs.push('-XX:MaxMetaspaceSize=512M')

  console.log('RAM debug:', { safeRam, memory: options.memory, customArgs: options.customArgs.filter(a => typeof a === 'string' && a.startsWith('-Xm')) })

  if (installedForgeInstallerJar) options.forge = installedForgeInstallerJar

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
    console.log('Quilt custom args:', options.customArgs)
  }

  if (profile.loader === 'neoforge') {
    if (!Array.isArray(options.customArgs)) options.customArgs = []
    const libDir = path.join(userData, 'minecraft', 'libraries').replace(/\\/g, '\\\\')
    options.customArgs.push('-DlibraryDirectory=' + libDir)
    // HeapBaseMinAddress and UseCompressedOops moved below for all mod loaders
    // Add opens for Java 17+ module system
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
    console.log('NeoForge custom args:', options.customArgs)
  }

  // Add address space fixes for all mod loaders (Forge, Quilt, NeoForge, Fabric)
  if (usesModLoader) {
    if (!Array.isArray(options.customArgs)) options.customArgs = []
    // Fix for virtual address space issues - place heap above 32GB to avoid conflict with native heaps
    if (!options.customArgs.some(a => typeof a === 'string' && a.startsWith('-XX:HeapBaseMinAddress'))) {
      options.customArgs.push('-XX:HeapBaseMinAddress=8G')
    }
    if (!options.customArgs.some(a => typeof a === 'string' && a.includes('UseCompressedOops'))) {
      options.customArgs.push('-XX:-UseCompressedOops')
    }
    console.log('Mod loader address space fix applied')
  }

  if (!profile.offline && isOfflineFallback) {
    event?.sender.send('launcher:launchProgress', { message: 'Нет действительной лицензионной сессии, запуск в оффлайн-режиме' })
  }

  const requestedGB = profile.ram === 'auto' ? -1 : parseMemoryGB(profile.ram)
  if (parseMemoryGB(safeRam) < (requestedGB > 0 ? requestedGB : 999)) {
    event?.sender.send('launcher:launchProgress', { message: `Память скорректирована до ${safeRam}` })
  }

  launcher.on('debug', (data) => {
    console.debug('Launcher debug:', data)
    event?.sender.send('launcher:launchProgress', { message: data.toString() })
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

    event?.sender.send('launcher:launchProgress', { message, progress })
  })

  launcher.on('data', (data) => {
    console.log('Launcher data:', data.toString())
  })

  launcher.on('close', (code) => {
    if (code !== 0) {
      event?.sender.send('launcher:launchProgress', { message: `Minecraft завершился с кодом ${code}` })
    }
  })

  try {
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
    const child = await launcher.launch(options)
    if (!child) {
      throw new Error('Не удалось запустить Minecraft. Проверьте Java и версию.')
    }

    // Close launcher window when Minecraft starts successfully
    if (mainWindow) {
      mainWindow.hide()
    }

    child.on('error', (error) => {
      console.error('Launch error', error)
      event?.sender.send('launcher:launchProgress', { message: `Ошибка запуска: ${error.message}` })
    })

    child.on('close', (code) => {
      console.log('Minecraft closed with code:', code)

      // Show launcher window again when Minecraft closes
      if (mainWindow) {
        mainWindow.show()
        mainWindow.focus()
      }

      // Send exit status to renderer
      const exitMessage = code === 0
        ? 'Игра завершена успешно'
        : `Игра завершена с кодом ${code}`

      event?.sender.send('launcher:launchProgress', { message: exitMessage, gameExited: true })
    })

    return true
  } catch (launchError) {
    console.error('Launcher launch error:', launchError)
    throw new Error(`Не удалось запустить Minecraft: ${launchError.message}`)
  }
}

let mainWindow = null

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

  if (!app.isPackaged) {
    // Try to automatically detect which port Vite is serving on (fallback range 4173..4182)
    async function findDevServerPort() {
      const ports = []
      for (let p = 4173; p <= 4182; p++) ports.push(p)
      for (const p of ports) {
        try {
          const url = `http://localhost:${p}`
          const res = await axios.get(url, { timeout: 800 })
          if (res.status && res.status >= 200) return p
        } catch (e) {
          // ignore and try next
        }
      }
      return null
    }

    const devPort = await findDevServerPort()
    if (devPort) {
      win.loadURL(`http://localhost:${devPort}`)
    } else {
      // fallback to hardcoded port
      win.loadURL('http://localhost:4173')
    }
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  win.once('ready-to-show', () => win.show())

  // Forward maximize/unmaximize state to renderer for UI updates
  win.on('maximize', () => win.webContents.send('window:maximize-change', true))
  win.on('unmaximize', () => win.webContents.send('window:maximize-change', false))
}

app.whenReady().then(() => {
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

  // Initialize storage and create window
  ensureStorage()
  startSkinServer()
  createWindow()
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

ipcMain.handle('launcher:launchProfile', async (event, profileId) => {
  const profiles = await getProfiles()
  const profile = profiles.find((item) => item.id === profileId)
  if (!profile) throw new Error('Профиль не найден')
  await launchGame(profile, event)
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

ipcMain.handle('launcher:toggleInstalledAddon', async (event, type, name, enabled) => {
  return await toggleInstalledAddon(type, name, enabled)
})

ipcMain.handle('launcher:deleteInstalledAddon', async (event, type, name) => {
  return await deleteInstalledAddon(type, name)
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

ipcMain.handle('window:close', async () => {
  if (mainWindow) mainWindow.close()
  return true
})
