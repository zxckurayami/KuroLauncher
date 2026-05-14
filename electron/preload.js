const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('launcher', {
  fetchVersionManifest: () => ipcRenderer.invoke('launcher:fetchVersionManifest'),
  getInstalledVersions: () => ipcRenderer.invoke('launcher:getInstalledVersions'),
  installVersion: (versionId) => ipcRenderer.invoke('launcher:installVersion', versionId),
  deleteInstalledVersion: (versionId) => ipcRenderer.invoke('launcher:deleteInstalledVersion', versionId),
  onInstallProgress: (listener) => ipcRenderer.on('launcher:installProgress', listener),
  removeInstallProgress: (listener) => ipcRenderer.removeListener('launcher:installProgress', listener),
  onLaunchProgress: (listener) => ipcRenderer.on('launcher:launchProgress', listener),
  removeLaunchProgress: (listener) => ipcRenderer.removeListener('launcher:launchProgress', listener),
  getProfiles: () => ipcRenderer.invoke('launcher:getProfiles'),
  saveProfile: (profile) => ipcRenderer.invoke('launcher:saveProfile', profile),
  createCustomModpack: (input) => ipcRenderer.invoke('launcher:createCustomModpack', input),
  deleteProfile: (profileId) => ipcRenderer.invoke('launcher:deleteProfile', profileId),
  getSettings: () => ipcRenderer.invoke('launcher:getSettings'),
  saveSettings: (settings) => ipcRenderer.invoke('launcher:saveSettings', settings),
  getLoaderVersions: (minecraftVersion, loader) => ipcRenderer.invoke('launcher:getLoaderVersions', minecraftVersion, loader),
  getAuthState: () => ipcRenderer.invoke('launcher:getAuthState'),
  loginUser: (email, password) => ipcRenderer.invoke('launcher:loginUser', email, password),
  registerUser: (email, password) => ipcRenderer.invoke('launcher:registerUser', email, password),
  logoutUser: () => ipcRenderer.invoke('launcher:logoutUser'),
  launchProfile: (profileId, launcherProfileName) => ipcRenderer.invoke('launcher:launchProfile', profileId, launcherProfileName),
  searchModrinth: (query, options) => ipcRenderer.invoke('launcher:searchModrinth', query, options),
  getModrinthProject: (projectId, options) => ipcRenderer.invoke('launcher:getModrinthProject', projectId, options),
  getModrinthVersions: (projectId, options) => ipcRenderer.invoke('launcher:getModrinthVersions', projectId, options),
  getModrinthVersion: (versionId, options) => ipcRenderer.invoke('launcher:getModrinthVersion', versionId, options),
  installModrinthProject: (projectId, options) => ipcRenderer.invoke('launcher:installModrinthProject', projectId, options),
  installModrinthVersion: (versionId, options) => ipcRenderer.invoke('launcher:installModrinthVersion', versionId, options),
  installCurseForgeModpack: (projectId, options) => ipcRenderer.invoke('launcher:installCurseForgeModpack', projectId, options),
  getInstalledModrinthAddons: () => ipcRenderer.invoke('launcher:getInstalledModrinthAddons'),
  toggleInstalledAddon: (type, name, enabled, addonPath) => ipcRenderer.invoke('launcher:toggleInstalledAddon', type, name, enabled, addonPath),
  deleteInstalledAddon: (type, name, addonPath) => ipcRenderer.invoke('launcher:deleteInstalledAddon', type, name, addonPath),
  deleteModpackDirectory: (modpackKey) => ipcRenderer.invoke('launcher:deleteModpackDirectory', modpackKey),
  openExternal: (targetUrl) => ipcRenderer.invoke('launcher:openExternal', targetUrl),
  openGameFolder: () => ipcRenderer.invoke('launcher:openGameFolder'),
  // Skin management
  saveSkin: (profileId, base64Data, options) => ipcRenderer.invoke('launcher:saveSkin', profileId, base64Data, options),
  getSkinUrl: (profileId) => ipcRenderer.invoke('launcher:getSkinUrl', profileId)
})

// Window control API for custom titlebar
contextBridge.exposeInMainWorld('windowControls', {
  minimize: () => ipcRenderer.invoke('window:minimize'),
  toggleMaximize: () => ipcRenderer.invoke('window:toggleMaximize'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  close: () => {
    const stack = new Error('windowControls.close invoked').stack || 'no renderer stack'
    return ipcRenderer.invoke('window:close', { stack, ts: Date.now() })
  },
  onMaximizeChange: (listener) => ipcRenderer.on('window:maximize-change', listener),
  removeMaximizeChange: (listener) => ipcRenderer.removeListener('window:maximize-change', listener)
})
