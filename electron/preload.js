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
  deleteProfile: (profileId) => ipcRenderer.invoke('launcher:deleteProfile', profileId),
  getSettings: () => ipcRenderer.invoke('launcher:getSettings'),
  saveSettings: (settings) => ipcRenderer.invoke('launcher:saveSettings', settings),
  getLoaderVersions: (minecraftVersion, loader) => ipcRenderer.invoke('launcher:getLoaderVersions', minecraftVersion, loader),
  getAuthState: () => ipcRenderer.invoke('launcher:getAuthState'),
  loginUser: (email, password) => ipcRenderer.invoke('launcher:loginUser', email, password),
  registerUser: (email, password) => ipcRenderer.invoke('launcher:registerUser', email, password),
  logoutUser: () => ipcRenderer.invoke('launcher:logoutUser'),
  launchProfile: (profileId) => ipcRenderer.invoke('launcher:launchProfile', profileId),
  searchModrinth: (query, options) => ipcRenderer.invoke('launcher:searchModrinth', query, options),
  getModrinthProject: (projectId) => ipcRenderer.invoke('launcher:getModrinthProject', projectId),
  getModrinthVersions: (projectId) => ipcRenderer.invoke('launcher:getModrinthVersions', projectId),
  getModrinthVersion: (versionId) => ipcRenderer.invoke('launcher:getModrinthVersion', versionId),
  installModrinthProject: (projectId, options) => ipcRenderer.invoke('launcher:installModrinthProject', projectId, options),
  installModrinthVersion: (versionId, options) => ipcRenderer.invoke('launcher:installModrinthVersion', versionId, options),
  getInstalledModrinthAddons: () => ipcRenderer.invoke('launcher:getInstalledModrinthAddons'),
  toggleInstalledAddon: (type, name, enabled, addonPath) => ipcRenderer.invoke('launcher:toggleInstalledAddon', type, name, enabled, addonPath),
  deleteInstalledAddon: (type, name, addonPath) => ipcRenderer.invoke('launcher:deleteInstalledAddon', type, name, addonPath),
  deleteModpackDirectory: (modpackKey) => ipcRenderer.invoke('launcher:deleteModpackDirectory', modpackKey),
  // Skin management
  saveSkin: (profileId, base64Data) => ipcRenderer.invoke('launcher:saveSkin', profileId, base64Data),
  getSkinUrl: (profileId) => ipcRenderer.invoke('launcher:getSkinUrl', profileId)
})

// Window control API for custom titlebar
contextBridge.exposeInMainWorld('windowControls', {
  minimize: () => ipcRenderer.invoke('window:minimize'),
  toggleMaximize: () => ipcRenderer.invoke('window:toggleMaximize'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  close: () => ipcRenderer.invoke('window:close'),
  onMaximizeChange: (listener) => ipcRenderer.on('window:maximize-change', listener),
  removeMaximizeChange: (listener) => ipcRenderer.removeListener('window:maximize-change', listener)
})
