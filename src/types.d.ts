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
      getSettings: () => Promise<any>
      saveSettings: (settings: any) => Promise<boolean>
      getLoaderVersions: (minecraftVersion: string, loader: string) => Promise<any[]>
      getAuthState: () => Promise<{ email: string; loggedIn: boolean; access_token?: string; client_token?: string; uuid?: string; name?: string; user_properties?: any; meta?: any }>
      loginUser: (email: string, password: string) => Promise<any>
      registerUser: (email: string, password: string) => Promise<any>
      launchProfile: (profileId: string) => Promise<boolean>
      deleteProfile: (profileId: string) => Promise<boolean>
      searchModrinth: (query: string, options?: any) => Promise<any>
      getModrinthProject: (projectId: string) => Promise<any>
      getModrinthVersions: (projectId: string) => Promise<any>
      getModrinthVersion: (versionId: string) => Promise<any>
      installModrinthProject: (projectId: string, options?: any) => Promise<any>
      installModrinthVersion: (versionId: string, options?: any) => Promise<any>
      getInstalledModrinthAddons: () => Promise<any[]>
      toggleInstalledAddon: (type: string, name: string, enabled: boolean) => Promise<any>
      deleteInstalledAddon: (type: string, name: string) => Promise<any>
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
