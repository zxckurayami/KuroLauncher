export {}

declare global {
  interface Window {
    launcher: {
      fetchVersionManifest: () => Promise<Array<{ id: string; type: string; releaseTime: string }>>
      getInstalledVersions: () => Promise<Array<{ id: string; status: string; path: string }>>
      installVersion: (versionId: string) => Promise<boolean>
      deleteInstalledVersion: (versionId: string) => Promise<boolean>
      onInstallProgress: (listener: (event: any, data: { message: string }) => void) => void
      removeInstallProgress: (listener: (event: any, data: { message: string }) => void) => void
      onLaunchProgress: (listener: (event: any, data: { message: string; progress?: { current: number; total: number }; gameExited?: boolean }) => void) => void
      removeLaunchProgress: (listener: (event: any, data: { message: string }) => void) => void
      getProfiles: () => Promise<any[]>
      saveProfile: (profile: any) => Promise<boolean>
      createCustomModpack: (input: any) => Promise<any>
      getSettings: () => Promise<any>
      saveSettings: (settings: any) => Promise<boolean>
      getLoaderVersions: (minecraftVersion: string, loader: string) => Promise<any[]>
      getAuthState: () => Promise<{ email: string; loggedIn: boolean; access_token?: string; client_token?: string; uuid?: string; name?: string; user_properties?: any; meta?: any }>
      loginUser: (email: string, password: string) => Promise<any>
      registerUser: (email: string, password: string) => Promise<any>
      logoutUser: () => Promise<boolean>
      launchProfile: (profileId: string, launcherProfileName?: string) => Promise<boolean>
      deleteProfile: (profileId: string) => Promise<boolean>
      searchModrinth: (query: string, options?: any) => Promise<any>
      getModrinthProject: (projectId: string, options?: any) => Promise<any>
      getModrinthVersions: (projectId: string, options?: any) => Promise<any>
      getModrinthVersion: (versionId: string, options?: any) => Promise<any>
      installModrinthProject: (projectId: string, options?: any) => Promise<any>
      installModrinthVersion: (versionId: string, options?: any) => Promise<any>
      getInstalledModrinthAddons: () => Promise<any[]>
      toggleInstalledAddon: (type: string, name: string, enabled: boolean, addonPath?: string) => Promise<any>
      deleteInstalledAddon: (type: string, name: string, addonPath?: string) => Promise<any>
      deleteModpackDirectory: (modpackKey: string) => Promise<boolean>
      openExternal: (targetUrl: string) => Promise<{ ok: boolean; error?: string }>
      saveSkin: (profileId: string, base64Data?: string | null, options?: { model?: 'classic' | 'slim'; username?: string }) => Promise<any>
      getSkinUrl: (profileId: string) => Promise<string | null>
    }
    windowControls?: {
      minimize: () => Promise<any>
      toggleMaximize: () => Promise<boolean>
      isMaximized: () => Promise<boolean>
      close: () => Promise<any>
      onMaximizeChange: (listener: (event: any, isMaximized: boolean) => void) => void
      removeMaximizeChange: (listener: (event: any, isMaximized: boolean) => void) => void
    }
  }
}

declare module '*.png' {
  const content: string
  export default content
}

declare module '*.ico' {
  const content: string
  export default content
}
