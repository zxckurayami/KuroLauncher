import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'

type VersionItem = {
  id: string
  type: string
  releaseTime: string
}

type InstalledVersion = {
  id: string
  status: string
  path: string
}

type Profile = {
  id: string
  name: string
  versionId: string
  ram: string
  javaPath: string
  username: string
  offline: boolean
  loader: 'vanilla' | 'forge' | 'fabric' | 'quilt' | 'neoforge'
  loaderVersion?: string
  skin?: {
    url?: string
    model?: 'classic' | 'slim'
  }
}

type Settings = {
  theme: 'dark' | 'light'
  javaPath: string
  ram: string
  accent?: 'red' | 'violet' | 'white'
}

type AuthState = {
  email: string
  loggedIn: boolean
}

const tabs = [
  { id: 'Dashboard', label: 'Главная' },
  { id: 'Versions', label: 'Версии' },
  { id: 'Profiles', label: 'Профили' },
  { id: 'Settings', label: 'Настройки' },
  { id: 'Mods', label: 'Моды' },
  { id: 'Skins', label: 'Скины' }
] as const

const defaultSteveSkinUrl = new URL('../skins/default-skin.png', import.meta.url).href

type Tab = typeof tabs[number]['id']

// Custom select component to replace native <select> for better styling
function CustomSelect({ options, value, onChange, placeholder }: any) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const selected = options.find((o: any) => o.value === value)

  return (
    <div className="custom-select" ref={ref}>
      <button
        type="button"
        className={`custom-select-trigger ${!value ? 'placeholder' : ''}`}
        onClick={() => setOpen((s) => !s)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="trigger-label">{selected ? selected.label : placeholder}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="custom-options" role="listbox">
          {options.map((opt: any) => (
            <div
              key={opt.value}
              role="option"
              tabIndex={0}
              className={`custom-option ${opt.value === value ? 'selected' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault()
                onChange(opt.value)
                setOpen(false)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onChange(opt.value)
                  setOpen(false)
                }
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Profile Form Component
function ProfileForm({ onSave, settings, installed, availableLoaderVersions, loaderVersionLoading, ramOptions, resetTrigger, onLoaderVersionChange, showAlert }: {
  onSave: (profile: any) => void,
  settings: Settings,
  installed: InstalledVersion[],
  availableLoaderVersions: any[],
  loaderVersionLoading: boolean,
  ramOptions: any[],
  resetTrigger: number,
  onLoaderVersionChange: (versionId: string, loader: string) => void,
  showAlert: (message: string) => void
}) {
  const [formData, setFormData] = useState({
    name: '',
    versionId: '',
    ram: 'auto',
    javaPath: settings.javaPath,
    username: '',
    offline: true,
    loader: 'vanilla' as 'vanilla' | 'forge' | 'fabric' | 'quilt' | 'neoforge',
    loaderVersion: ''
  })

  // Reset form when resetTrigger changes
  useEffect(() => {
    setFormData({
      name: '',
      versionId: '',
      ram: 'auto',
      javaPath: settings.javaPath,
      username: '',
      offline: true,
      loader: 'vanilla',
      loaderVersion: ''
    })
  }, [resetTrigger, settings.javaPath])

  // Auto-fetch loader versions when version or loader changes
  useEffect(() => {
    if (formData.versionId && formData.loader !== 'vanilla') {
      // This would need to be passed from parent or we need to move fetchLoaderVersions logic here
      // For now, we'll handle this in the parent component
    }
  }, [formData.versionId, formData.loader])

  const handleSubmit = () => {
    if (!formData.name || !formData.versionId) {
      showAlert('Введите имя и выберите версию профиля')
      return
    }
    onSave(formData)
  }

  const updateFormData = (updates: Partial<typeof formData>) => {
    const newData = { ...formData, ...updates }
    setFormData(newData)

    // Trigger loader version fetch when version or loader changes
    if (updates.versionId || updates.loader) {
      if (newData.versionId && newData.loader !== 'vanilla') {
        onLoaderVersionChange(newData.versionId, newData.loader)
      }
    }
  }

  return (
    <div className="form-grid">
      <div className="form-group">
        <label className="form-label">Имя профиля</label>
        <input
          className="form-input"
          value={formData.name}
          onChange={(e) => updateFormData({ name: e.target.value })}
          placeholder="Введите имя профиля"
        />
      </div>
      <div className="form-group">
        <label className="form-label">Версия</label>
        <CustomSelect
          options={[{ value: '', label: 'Выберите версию' }, ...installed.map((it) => ({ value: it.id, label: it.id }))]}
          value={formData.versionId}
          onChange={(val: string) => updateFormData({ versionId: val })}
          placeholder="Выберите версию"
        />
      </div>
      <div className="form-group">
        <label className="form-label">Загрузчик</label>
        <CustomSelect
          options={[
            { value: 'vanilla', label: 'Vanilla' },
            { value: 'forge', label: 'Forge' },
            { value: 'fabric', label: 'Fabric' },
            { value: 'quilt', label: 'Quilt' },
            { value: 'neoforge', label: 'NeoForge' }
          ]}
          value={formData.loader}
          onChange={(val: string) => updateFormData({ loader: val as typeof formData.loader, loaderVersion: '' })}
          placeholder="Загрузчик"
        />
      </div>
      {formData.loader !== 'vanilla' && (
        <div className="form-group">
          <label className="form-label">Версия загрузчика</label>
          <CustomSelect
            options={
              loaderVersionLoading
                ? [{ value: '', label: 'Загрузка...' }]
                : [{ value: '', label: 'Выберите версию' }, ...availableLoaderVersions]
            }
            value={formData.loaderVersion || ''}
            onChange={(val: string) => updateFormData({ loaderVersion: val })}
            placeholder={loaderVersionLoading ? 'Загрузка...' : 'Выберите версию' }
          />
        </div>
      )}
      <div className="form-group">
        <label className="form-label">RAM</label>
        <CustomSelect
          options={ramOptions}
          value={formData.ram}
          onChange={(val: string) => updateFormData({ ram: val })}
          placeholder="Выберите память"
        />
      </div>
      <div className="form-group">
        <label className="form-label">Java путь</label>
        <input
          className="form-input"
          value={formData.javaPath}
          onChange={(e) => updateFormData({ javaPath: e.target.value })}
          placeholder="Путь к Java"
        />
      </div>
      <div className="form-group">
        <label className="form-label">Никнейм</label>
        <input
          className="form-input"
          value={formData.username}
          onChange={(e) => updateFormData({ username: e.target.value })}
          placeholder="Ваш никнейм"
        />
      </div>
      <label className="checkbox-row">
        <span>Оффлайн режим</span>
        <input
          type="checkbox"
          checked={formData.offline}
          onChange={(e) => updateFormData({ offline: e.target.checked })}
        />
      </label>
      <button className="btn btn-primary" onClick={handleSubmit}>Сохранить профиль</button>
    </div>
  )
}

  const ramOptions = [
    { value: 'auto', label: 'Авто (рекомендуется)' },
    { value: '2G', label: '2 GB' },
    { value: '3G', label: '3 GB' },
    { value: '4G', label: '4 GB' },
    { value: '6G', label: '6 GB' },
    { value: '8G', label: '8 GB' },
    { value: '12G', label: '12 GB' },
    { value: '16G', label: '16 GB' }
  ]

  const defaultSettings: Settings = {
    theme: 'dark',
    javaPath: 'java',
    ram: 'auto',
    accent: 'red'
  }

const newsItems = [
  {
    title: 'KuroLauncher 0.1.0',
    body: 'Стартовая версия лаунчера с загрузкой версий, профилями и атмосферным интерфейсом.'
  },
  {
    title: 'Новое: оффлайн-режим',
    body: 'Создавайте локальные профили без обязательной авторизации и играйте в режиме оффлайн.'
  },
  {
    title: 'Современный UI',
    body: 'Тёмная японская тема, glassmorphism и анимации для премиальному UX.'
  }
]

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('Dashboard')
  const [isMaximized, setIsMaximized] = useState(false)
  const [versions, setVersions] = useState<VersionItem[]>([])
  const [installed, setInstalled] = useState<InstalledVersion[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [status, setStatus] = useState<string>('Готово')
  const [auth, setAuth] = useState<AuthState>({ email: '', loggedIn: false })
  const [loginState, setLoginState] = useState({ email: '', password: '' })
  const [registerMode, setRegisterMode] = useState(false)
  const [installingVersion, setInstallingVersion] = useState<string | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [progressInfo, setProgressInfo] = useState<{ label: string; current?: number; total?: number } | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null)

  const [profileFormResetTrigger, setProfileFormResetTrigger] = useState(0) // Trigger for form reset
  const [availableLoaderVersions, setAvailableLoaderVersions] = useState<Array<{ value: string; label: string }>>([])
  const [loaderVersionLoading, setLoaderVersionLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [versionsPerPage] = useState(20)
  const [versionFilter, setVersionFilter] = useState<string>('all')
  const [versionSearch, setVersionSearch] = useState<string>('')
  const [gameRunning, setGameRunning] = useState(false)
  const [modrinthQuery, setModrinthQuery] = useState<string>('')
  const [modrinthSearchVersion, setModrinthSearchVersion] = useState<string>('')
  const [modrinthSearchLoader, setModrinthSearchLoader] = useState<string>('')
  const [modrinthSearchType, setModrinthSearchType] = useState<string>('mod')
  const [modrinthSearchResults, setModrinthSearchResults] = useState<any[]>([])
  const [modrinthPage, setModrinthPage] = useState(1)
  const [modrinthTotalHits, setModrinthTotalHits] = useState(0)
  const [modrinthLoading, setModrinthLoading] = useState(false)
  const [modrinthInstalledAddons, setModrinthInstalledAddons] = useState<any[]>([])
  const [skinFile, setSkinFile] = useState<File | null>(null)
  const [skinDataUrl, setSkinDataUrl] = useState<string | null>(null)
  const [skinModel, setSkinModel] = useState<'classic' | 'slim'>('classic')
  const [profileSkinUrl, setProfileSkinUrl] = useState<string | null>(defaultSteveSkinUrl)
  const [skinUploading, setSkinUploading] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void; onCancel?: () => void } | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const skinViewerContainerRef = useRef<HTMLDivElement | null>(null)
  const viewerRef = useRef<any>(null)

  // Custom confirm dialog - doesn't steal focus like window.confirm
  const showConfirm = (message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmDialog({
        message,
        onConfirm: () => {
          setConfirmDialog(null)
          resolve(true)
        },
        onCancel: () => {
          setConfirmDialog(null)
          resolve(false)
        }
      })
    })
  }

  // Custom alert dialog - doesn't steal focus like window.alert
  const showAlert = (message: string) => {
    setConfirmDialog({
      message,
      onConfirm: () => setConfirmDialog(null)
    })
  }

  const activeProfile = useMemo(() => profiles.find((profile) => profile.id === selectedProfile), [profiles, selectedProfile])

  useEffect(() => {
    async function syncProfileSkin() {
      setSkinFile(null)
      setSkinDataUrl(null)
      if (!activeProfile) {
        setSkinModel('classic')
        setProfileSkinUrl(defaultSteveSkinUrl)
        return
      }

      setSkinModel(activeProfile.skin?.model === 'slim' ? 'slim' : 'classic')
      const defaultUrl = activeProfile.skin?.url || defaultSteveSkinUrl
      setProfileSkinUrl(defaultUrl)

      if (!activeProfile.skin?.url) {
        try {
          const url = await (window as any).launcher.getSkinUrl(activeProfile.id)
          setProfileSkinUrl(url || defaultUrl)
        } catch (e) {
          setProfileSkinUrl(defaultUrl)
        }
      }
    }
    syncProfileSkin()
  }, [activeProfile, defaultSteveSkinUrl])

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.user-section')) {
        setUserMenuOpen(false)
      }
    }

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [userMenuOpen])

  // Initialize dynamic 3D viewer (skinview3d) if available; fallback to 2D image
  useEffect(() => {
    let mounted = true
    async function initViewer() {
      const container = skinViewerContainerRef.current
      if (!container) return
      const skinUrl = skinDataUrl || profileSkinUrl || defaultSteveSkinUrl

      const destroyViewer = () => {
        try {
          if (viewerRef.current && typeof viewerRef.current.destroy === 'function') viewerRef.current.destroy()
          if (viewerRef.current && viewerRef.current.controls && typeof viewerRef.current.controls.dispose === 'function') viewerRef.current.controls.dispose()
        } catch {}
        viewerRef.current = null
      }

      destroyViewer()
      container.innerHTML = ''

      if (!skinUrl) {
        const hint = document.createElement('div')
        hint.className = 'hint'
        hint.textContent = 'Нет выбранного скина'
        container.appendChild(hint)
        return
      }

      try {
        const mod: any = await import('skinview3d')
        const SkinViewer = mod.SkinViewer || mod.default?.SkinViewer || mod.default
        const createOrbitControls = mod.createOrbitControls || mod.default?.createOrbitControls
        if (!SkinViewer) throw new Error('SkinViewer not found')

        const viewer = new SkinViewer({
          domElement: container,
          width: 176,
          height: 352,
          skinUrl,
          detectModel: false
        })
        viewerRef.current = viewer

        if (createOrbitControls) {
          try {
            viewerRef.current.controls = createOrbitControls(viewer)
          } catch {}
        }

        const applySlim = () => {
          try {
            if (viewer.playerObject && viewer.playerObject.skin) {
              viewer.playerObject.skin.slim = skinModel === 'slim'
            }
          } catch {}
        }

        applySlim()
        setTimeout(applySlim, 100)
      } catch (e) {
        const img = document.createElement('img')
        img.src = skinDataUrl || profileSkinUrl || ''
        img.style.width = '160px'
        img.style.height = '320px'
        img.style.objectFit = 'cover'
        img.style.imageRendering = 'pixelated'
        container.appendChild(img)
      }
    }

    initViewer()

    return () => {
      mounted = false
      try {
        if (viewerRef.current && typeof viewerRef.current.destroy === 'function') viewerRef.current.destroy()
        if (viewerRef.current && viewerRef.current.controls && typeof viewerRef.current.controls.dispose === 'function') viewerRef.current.controls.dispose()
      } catch {}
      viewerRef.current = null
    }
  }, [skinDataUrl, profileSkinUrl, skinModel])

  // Pagination logic with filtering and search
  const filteredVersions = versions.filter(v => {
    const matchesFilter = versionFilter === 'all' || v.type === versionFilter
    const matchesSearch = versionSearch === '' || v.id.toLowerCase().includes(versionSearch.toLowerCase())
    return matchesFilter && matchesSearch
  })
  const totalPages = Math.ceil(filteredVersions.length / versionsPerPage)
  const startIndex = (currentPage - 1) * versionsPerPage
  const endIndex = startIndex + versionsPerPage
  const currentVersions = filteredVersions.slice(startIndex, endIndex)



  async function loadMeta() {
    setStatus('Загрузка списка версий...')
    const manifest = await window.launcher.fetchVersionManifest()
    // Sort by release time, newest first
    const sortedVersions = manifest.sort((a, b) => new Date(b.releaseTime).getTime() - new Date(a.releaseTime).getTime())
    setVersions(sortedVersions)
    setStatus('Готово')
  }

  useEffect(() => {
    const wc = (window as any).windowControls
    if (!wc) return
    wc.isMaximized().then((v: boolean) => setIsMaximized(Boolean(v))).catch(() => {})
    const listener = (_event: any, value: boolean) => setIsMaximized(Boolean(value))
    wc.onMaximizeChange(listener)
    return () => wc.removeMaximizeChange(listener)
  }, [])

  const handleMinimize = () => {
    ;(window as any).windowControls?.minimize()
  }

  const handleToggleMax = async () => {
    try {
      const res = await (window as any).windowControls?.toggleMaximize()
      setIsMaximized(Boolean(res))
    } catch {}
  }

  const handleClose = () => {
    ;(window as any).windowControls?.close()
  }

  async function loadState() {
    const installedVersions = await window.launcher.getInstalledVersions()
    setInstalled(installedVersions)
    const storedProfiles = await window.launcher.getProfiles()
    // Ensure all profiles have loader field
    const updatedProfiles = storedProfiles.map(p => ({ ...p, loader: p.loader || 'vanilla', loaderVersion: p.loaderVersion || '' }))
    setProfiles(updatedProfiles)
    const storedSettings = await window.launcher.getSettings()
    setSettings(storedSettings)
    const authState = await window.launcher.getAuthState()
    setAuth(authState)
  }

  async function fetchLoaderVersions(versionId: string, loader: Profile['loader']) {
    setAvailableLoaderVersions([])
    if (!versionId || loader === 'vanilla') {
      return
    }
    setLoaderVersionLoading(true)
    try {
      const versions = await window.launcher.getLoaderVersions(versionId, loader)
      const items = Array.isArray(versions)
        ? versions
            .map((item: any) => {
              if (typeof item === 'string') {
                return { value: item, label: item }
              }
              if (item && typeof item === 'object') {
                return { value: item.version || item.id || String(item), label: item.label || item.version || item.id || String(item) }
              }
              return null
            })
            .filter((item): item is { value: string; label: string } => Boolean(item))
        : []
      setAvailableLoaderVersions(items)
    } catch (error: any) {
      console.error('Ошибка загрузки версий загрузчика', error)
      setStatus(`Ошибка загрузки версий загрузчика: ${error?.message || 'проверьте соединение'}`)
      setAvailableLoaderVersions([])
    } finally {
      setLoaderVersionLoading(false)
    }
  }

  useEffect(() => {
    loadMeta()
    loadState()
    loadModrinthState()
  }, [])



  async function loadModrinthState() {
    setModrinthLoading(true)
    try {
      const addons = await window.launcher.getInstalledModrinthAddons()
      setModrinthInstalledAddons(addons || [])
    } catch (error) {
      console.error('Modrinth addon load error', error)
    } finally {
      setModrinthLoading(false)
    }
  }

  async function searchModrinth(page = 1) {
    setModrinthLoading(true)
    setModrinthPage(page)
    try {
      const data = await window.launcher.searchModrinth(modrinthQuery, {
        version: modrinthSearchVersion,
        loader: modrinthSearchLoader,
        projectType: modrinthSearchType,
        page,
        pageSize: 20
      })
      setModrinthSearchResults(data.hits || [])
      setModrinthTotalHits(data.total_hits || 0)
      setStatus(`Найдено ${data.hits?.length ?? 0} результатов (${data.total_hits ?? 0} всего)`)
    } catch (error: any) {
      console.error('Modrinth search error', error)
      setStatus(`Ошибка поиска Modrinth: ${error?.message || 'проверьте соединение'}`)
      setModrinthSearchResults([])
      setModrinthTotalHits(0)
    } finally {
      setModrinthLoading(false)
    }
  }

  async function installModrinthProject(projectId: string) {
    setIsBusy(true)
    setStatus('Установка Modrinth проекта...')
    try {
      await window.launcher.installModrinthProject(projectId, {
        gameVersion: modrinthSearchVersion || undefined,
        loader: modrinthSearchLoader || undefined
      })
      setStatus('Проект установлен. Проверьте папку mods.')
      await loadModrinthState()
    } catch (error: any) {
      console.error('Modrinth install error', error)
      setStatus(`Ошибка установки Modrinth: ${error?.message || 'проверьте лог'}`)
    } finally {
      setIsBusy(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'Mods') {
      searchModrinth(1)
    }
  }, [activeTab, modrinthSearchType, modrinthSearchLoader, modrinthSearchVersion])

  useEffect(() => {
    if (activeTab === 'Versions') {
      setCurrentPage(1)
    }
  }, [activeTab, versionFilter, versionSearch])

  useEffect(() => {
    const installProgressListener = (_event: any, data: { message: string }) => {
      setStatus(data.message)
      setIsBusy(true)
      setProgressInfo({ label: data.message })
    }
    window.launcher.onInstallProgress(installProgressListener)
    return () => window.launcher.removeInstallProgress(installProgressListener)
  }, [])

  useEffect(() => {
    const launchProgressListener = (_event: any, data: { message: string; progress?: { current: number; total: number }; gameExited?: boolean }) => {
      setStatus(data.message)
      setIsBusy(true)

      if (data.gameExited) {
        setGameRunning(false)
        setIsBusy(false)
        setProgressInfo(null)
      } else if (data.progress?.total) {
        setProgressInfo({ label: data.message, current: data.progress.current, total: data.progress.total })
      } else {
        setProgressInfo({ label: data.message })
      }
    }
    window.launcher.onLaunchProgress(launchProgressListener)
    return () => window.launcher.removeLaunchProgress(launchProgressListener)
  }, [])

  async function installVersion(versionId: string) {
    setInstallingVersion(versionId)
    setIsBusy(true)
    setProgressInfo({ label: `Установка версии ${versionId}...` })
    setStatus(`Установка версии ${versionId}...`)

    try {
      await window.launcher.installVersion(versionId)
      await loadState()
      setStatus(`Версия ${versionId} установлена`)
      setProgressInfo(null)
    } catch (error: any) {
      console.error('Install error', error)
      setStatus(`Ошибка установки: ${error?.message || 'проверьте соединение и путь'}`)
      setProgressInfo(null)
    } finally {
      setInstallingVersion(null)
      setIsBusy(false)
    }
  }

  async function deleteInstalledVersion(versionId: string) {
    const confirmed = await showConfirm(`Удалить установленную версию ${versionId}?`)
    if (!confirmed) return

    try {
      setIsBusy(true)
      setProgressInfo({ label: `Удаление версии ${versionId}...` })
      await window.launcher.deleteInstalledVersion(versionId)
      await loadState()
      setStatus(`Версия ${versionId} удалена`)
      setProgressInfo(null)
    } catch (error: any) {
      console.error('Delete installed version error', error)
      setStatus(`Ошибка удаления версии: ${error?.message || 'проверьте доступ'}`)
      setProgressInfo(null)
    } finally {
      setIsBusy(false)
    }
  }

  async function saveNewProfile(profileData: any) {
    if (!profileData.name || !profileData.versionId) {
      setStatus('Введите имя и выберите версию профиля')
      return
    }
    await window.launcher.saveProfile({ ...profileData, id: `${Date.now()}` })
    setStatus('Профиль сохранён')
    loadState()
  }

  async function launchProfile(profile: Profile) {
    setIsBusy(true)
    setProgressInfo({ label: `Запуск ${profile.name}...` })
    setStatus(`Запуск ${profile.name}...`)

    try {
      await window.launcher.launchProfile(profile.id)
      setGameRunning(true)
      setStatus(`Игра запущена: ${profile.name}`)
      setProgressInfo(null)
    } catch (error: any) {
      console.error('Launch error', error)
      setStatus(`Ошибка запуска: ${error?.message || 'проверьте Java и установку версии'}`)
      setProgressInfo(null)
      setIsBusy(false)
    }
  }

  async function deleteProfile(profileId: string) {
    const confirmed = await showConfirm('Удалить профиль? Это действие необратимо.')
    if (!confirmed) return

    try {
      await (window as any).launcher.deleteProfile(profileId)
      setStatus('Профиль удалён')

      // Clear selected profile if it was deleted
      if (selectedProfile === profileId) {
        setSelectedProfile(null)
      }

      // Trigger form reset
      setProfileFormResetTrigger(k => k + 1)

      // Reload state after form reset
      await loadState()
    } catch (error: any) {
      console.error('Delete profile error', error)
      setStatus(`Ошибка удаления профиля: ${error?.message || 'проверьте доступ'}`)
    }
  }

  async function handleLogin() {
    const result = registerMode
      ? await window.launcher.registerUser(loginState.email, loginState.password)
      : await window.launcher.loginUser(loginState.email, loginState.password)
    setAuth({ email: result.email, loggedIn: result.loggedIn })
    setStatus(result.message)
  }

  async function handleSaveSettings() {
    await window.launcher.saveSettings(settings)
    setStatus('Настройки сохранены')
  }

  const themeClass = settings.theme === 'light' ? 'theme-light' : 'theme-dark'
  const accentColor = settings.accent || 'red'
  
  useEffect(() => {
    try {
      document.body.classList.remove('theme-light', 'theme-dark')
      document.body.classList.add(themeClass)
      document.body.setAttribute('data-accent', accentColor)
    } catch (e) {}
    return () => {
      try { document.body.classList.remove(themeClass) } catch (e) {}
    }
  }, [themeClass, accentColor])

  return (
    <div className="app-shell">
      <div className="live-bg"></div>
      <div className="noise-overlay"></div>
      <div className="titlebar">
        <div className="titlebar-title">KuroLauncher</div>
        <div className="titlebar-controls">
          <button className="titlebar-btn" onClick={handleMinimize} aria-label="Minimize">
            <svg viewBox="0 0 12 2" xmlns="http://www.w3.org/2000/svg" fill="none">
              <rect x="0" y="0" width="12" height="2" rx="1" fill="currentColor" />
            </svg>
          </button>

          <button className="titlebar-btn" onClick={handleToggleMax} aria-label="Maximize">
            {isMaximized ? (
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
                <rect x="3" y="6" width="14" height="12" stroke="currentColor" strokeWidth="1.6" rx="1" />
                <path d="M7 6V4h10v10h-2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
                <rect x="4" y="4" width="16" height="16" stroke="currentColor" strokeWidth="1.6" rx="1" />
              </svg>
            )}
          </button>

          <button className="titlebar-btn" onClick={handleClose} aria-label="Close">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
              <path d="M4 4l16 16M20 4L4 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="header">
        <div className="header-left">
          <div className="header-logo">
            <div className="header-logo-text">KuroLauncher</div>
          </div>
          <div className={`header-status ${isBusy ? 'loading' : ''}`}>
            <span className="status-dot"></span>
            {status}
          </div>
        </div>
        <div className="header-right">
          <div className="email-badge">{auth.loggedIn ? auth.email : 'Offline'}</div>
        </div>
      </div>

      <div className="nav-bar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`nav-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isBusy && progressInfo && (
        <div className="progress-panel">
          <div className="progress-label">{progressInfo!.label}</div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: progressInfo!.total ? `${Math.min(100, Math.round((progressInfo!.current ?? 0) / progressInfo!.total * 100))}%` : '100%' }}
            />
          </div>
        </div>
      )}

      <main className="content">
        {activeTab === 'Skins' && (
          <section className="skins-grid">
            <div className="panel panel large">
              <div className="panel-title">Скины</div>
              <div className="form-grid">
                <label>
                  Профиль
                  <div style={{ marginTop: 8 }}>
                    <CustomSelect
                      options={[{ value: '', label: 'Выберите профиль' }, ...profiles.map(p => ({ value: p.id, label: p.name || p.id }))]}
                      value={selectedProfile || ''}
                      onChange={(val: string) => setSelectedProfile(val)}
                      placeholder="Выберите профиль"
                    />
                  </div>
                </label>

                <label>
                  Модель
                  <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input type="radio" name="skinModel" checked={skinModel === 'classic'} onChange={() => setSkinModel('classic')} /> Обычный
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input type="radio" name="skinModel" checked={skinModel === 'slim'} onChange={() => setSkinModel('slim')} /> Слим
                    </label>
                  </div>
                </label>

                <label>
                  Загрузить скин (PNG)
                  <div className="skin-file-row" style={{ marginTop: 8 }}>
                    <input ref={fileInputRef} type="file" accept="image/png" style={{ display: 'none' }} onChange={(e) => {
                      const f = e.target.files && e.target.files[0]
                      if (!f) return
                      setSkinFile(f)
                      const reader = new FileReader()
                      reader.onload = () => setSkinDataUrl(String(reader.result))
                      reader.readAsDataURL(f)
                    }} />
                    <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>Выбрать файл</button>
                    <span className="small-text">{skinFile?.name || ''}</span>
                  </div>
                </label>

                <div className="skin-preview-section">
                  <div className="panel-subtitle">Предпросмотр</div>
                  <div className="skin-preview-row">
                    <div className="skin-preview-box">
                      <div ref={skinViewerContainerRef} className="skin-preview-canvas" />
                    </div>
                    <div className="skin-preview-controls">
                      <div className="skin-preview-actions">
                        <button
                          className="button"
                          disabled={!selectedProfile || (!skinDataUrl && profileSkinUrl === defaultSteveSkinUrl) || skinUploading}
                          onClick={async () => {
                            if (!selectedProfile) return
                            setSkinUploading(true)
                            try {
                              const prof = profiles.find(p => p.id === selectedProfile)
                              if (!prof) {
                                showAlert('Профиль не найден')
                                return
                              }

                              const updatedSkin = {
                                ...(prof.skin || {}),
                                model: skinModel
                              }
                              const updatedProfile = { ...prof, skin: updatedSkin }

                              if (skinDataUrl) {
                                const res = await (window as any).launcher.saveSkin(selectedProfile, skinDataUrl)
                                if (!res || !res.ok) {
                                  showAlert('Не удалось сохранить скин')
                                  return
                                }
                                updatedProfile.skin.url = res.url
                              }

                               await (window as any).launcher.saveProfile(updatedProfile)
                               await loadState()
                               setProfileSkinUrl(updatedProfile.skin.url || defaultSteveSkinUrl)
                               setSkinFile(null)
                            } catch (e) {
                              console.error(e)
                              showAlert('Ошибка при сохранении скина')
                            } finally {
                              setSkinUploading(false)
                            }
                          }}
                        >{skinUploading ? 'Сохранение...' : 'Сохранить скин'}</button>

                        <button className="btn btn-secondary" onClick={() => {
                          setSkinFile(null)
                          setSkinDataUrl(null)
                        }}>Отменить</button>
                      </div>
                      <div className="hint">Используйте 64×64 PNG-скины. Поверните модель мышью в окне просмотра. Если 3D не работает, установите зависимость <code>skinview3d</code>.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
        {activeTab === 'Dashboard' && (
          <section className="dashboard-grid">
            <div className="panel">
              <div className="panel-title">Новости</div>
              <div className="news-list">
                {newsItems.map((item, index) => (
                  <motion.article
                    key={item.title}
                    className="news-card animate-fade-in-up"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </motion.article>
                ))}
              </div>
            </div>

            <div className="panel">
              <div className="panel-title">Управление</div>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-label">Версий установлено</span>
                    <span className="stat-value">{installed.length}</span>
                  </div>
                  <div className="stat-bar">
                    <motion.div
                      className="stat-bar-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, installed.length * 10)}%` }}
                      transition={{ duration: 1, delay: 0.2 }}
                    />
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-label">Профилей</span>
                    <span className="stat-value">{profiles.length}</span>
                  </div>
                  <div className="stat-bar">
                    <motion.div
                      className="stat-bar-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, profiles.length * 20)}%` }}
                      transition={{ duration: 1, delay: 0.4 }}
                    />
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-header">
                    <span className="stat-label">RAM использование</span>
                    <span className="stat-value">2.1 GB</span>
                  </div>
                  <div className="stat-bar">
                    <motion.div
                      className="stat-bar-fill"
                      initial={{ width: 0 }}
                      animate={{ width: '35%' }}
                      transition={{ duration: 1, delay: 0.6 }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '24px' }}>
                <button className="btn btn-primary" onClick={loadMeta}>
                  Обновить версии
                </button>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'Versions' && (
          <section className="versions-grid">
            <div className="panel panel large">
              <div className="panel-title">Доступные версии ({filteredVersions.length})</div>

              <div className="version-filters">
                <div className="filter-group">
                  <label>Поиск версии:</label>
                  <input
                    type="text"
                    placeholder="Введите ID версии..."
                    value={versionSearch}
                    onChange={(e) => setVersionSearch(e.target.value)}
                    className="search-input"
                  />
                </div>

                <div className="filter-group">
                  <label>Тип версии:</label>
                  <div className="filter-buttons">
                    {[
                      { value: 'all', label: 'Все' },
                      { value: 'release', label: 'Релизы' },
                      { value: 'snapshot', label: 'Снапшоты' },
                      { value: 'old_beta', label: 'Бета' },
                      { value: 'old_alpha', label: 'Альфа' }
                    ].map(filter => (
                      <button
                        key={filter.value}
                        className={`filter-btn ${versionFilter === filter.value ? 'active' : ''}`}
                        onClick={() => setVersionFilter(filter.value)}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="version-list">
                {currentVersions.map((version) => (
                  <article key={version.id} className="version-card">
                    <div>
                      <div className="version-id">{version.id}</div>
                      <div className="version-meta">{version.type} • {new Date(version.releaseTime).toLocaleDateString()}</div>
                    </div>
                    <button
                      className="outline-button"
                      disabled={installingVersion === version.id}
                      onClick={() => installVersion(version.id)}
                    >
                      {installingVersion === version.id ? 'Установка...' : 'Установить'}
                    </button>
                  </article>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    ‹ Предыдущая
                  </button>

                  <div className="pagination-info">
                    Страница {currentPage} из {totalPages}
                  </div>

                  <button
                    className="pagination-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Следующая ›
                  </button>
                </div>
              )}
            </div>

            <div className="panel panel small">
              <div className="panel-title">Установленные</div>
              <div className="installed-list">
                {installed.length === 0 && <div className="hint">Нет установленных версий</div>}
                {installed.map((item) => (
                  <div key={item.id} className="installed-item">
                    <span>{item.id}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{item.status}</span>
                      <button
                        className="outline-button delete-button"
                        onClick={() => deleteInstalledVersion(item.id)}
                        disabled={isBusy}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'Profiles' && (
          <section className="profiles-grid">
            <div className="panel panel small">
              <div className="panel-title">Профили</div>
              <div className="profiles-list">
                {profiles.map((profile) => (
                  <article key={profile.id} className="profile-card">
                    <div>
                      <div className="profile-name">{profile.name}</div>
                      <div className="profile-meta">
                        {profile.versionId}
                        {profile.loader !== 'vanilla' ? ` • ${profile.loader.charAt(0).toUpperCase() + profile.loader.slice(1)}` : ''}
                        {profile.loaderVersion ? ` ${profile.loaderVersion}` : ''}
                        {' • '}{profile.ram === 'auto' ? 'Авто' : profile.ram} • {profile.offline ? 'Offline' : 'Online'}
                      </div>
                    </div>
                    <div className="profile-actions">
                      <button
                        className="button"
                        onClick={() => launchProfile(profile)}
                        disabled={gameRunning}
                      >
                        {gameRunning ? 'Игра запущена' : 'Запустить'}
                      </button>
                      <button className="btn btn-ghost delete-button" onClick={() => deleteProfile(profile.id)}>Удалить</button>
                    </div>
                  </article>
                ))}
                {profiles.length === 0 && <div className="hint">Создайте профиль для запуска</div>}
              </div>
            </div>

            <div className="panel panel large">
              <div className="panel-title">Новый профиль</div>
              <ProfileForm
                onSave={saveNewProfile}
                settings={settings}
                installed={installed}
                availableLoaderVersions={availableLoaderVersions}
                loaderVersionLoading={loaderVersionLoading}
                ramOptions={ramOptions}
                resetTrigger={profileFormResetTrigger}
                onLoaderVersionChange={(versionId, loader) => fetchLoaderVersions(versionId, loader as any)}
                showAlert={showAlert}
              />
            </div>
          </section>
        )}

        {activeTab === 'Mods' && (
          <section className="modrinth-grid">
            <div className="panel panel large">
              <div className="panel-title">Браузер модов</div>
              <div className="form-grid">
                <label>
                  Поиск
                  <input value={modrinthQuery} onChange={(e) => setModrinthQuery(e.target.value)} placeholder="Имя мода, текст или ID" />
                </label>
                <label>
                  Версия Minecraft
                  <input value={modrinthSearchVersion} onChange={(e) => setModrinthSearchVersion(e.target.value)} placeholder="Например 1.20.1" />
                </label>
                <label>
                  Загрузчик
                  <div style={{ marginTop: 8 }}>
                      <CustomSelect
                      options={[
                        { value: '', label: 'Любой' },
                        { value: 'fabric', label: 'Fabric' },
                        { value: 'forge', label: 'Forge' },
                        { value: 'quilt', label: 'Quilt' },
                        { value: 'neoforge', label: 'NeoForge' }
                      ]}
                      value={modrinthSearchLoader}
                      onChange={(val: string) => setModrinthSearchLoader(val)}
                      placeholder="Загрузчик"
                    />
                  </div>
                </label>
                <label>
                  Тип контента
                  <div style={{ marginTop: 8 }}>
                    <CustomSelect
                      options={[
                        { value: 'all', label: 'Все' },
                        { value: 'mod', label: 'Моды' },
                        { value: 'modpack', label: 'Модпаки' },
                        { value: 'resourcepack', label: 'Ресурсы' },
                        { value: 'shader', label: 'Шейдеры' }
                      ]}
                      value={modrinthSearchType}
                      onChange={(val: string) => setModrinthSearchType(val)}
                      placeholder="Тип"
                    />
                  </div>
                </label>
                <button className="button" onClick={() => searchModrinth(1)} disabled={modrinthLoading}>Искать</button>
              </div>

              <div className="panel-title" style={{ marginTop: 18 }}>
                Результаты поиска {modrinthTotalHits ? `(${modrinthTotalHits} найдено)` : ''}
              </div>
              <div className="search-results grid">
                {modrinthLoading && <div className="hint">Загрузка результатов...</div>}
                {!modrinthLoading && modrinthSearchResults.length === 0 && <div className="hint">Нет результатов. Попробуйте другой запрос или смените фильтры.</div>}
                {modrinthSearchResults.map((item) => (
                  <article key={item.id} className="search-card modrinth-card">
                    <div className="search-card-header">
                      <img src={item.icon_url || ''} alt={item.title || item.name} className="search-card-icon" />
                      <div>
                        <div className="search-title">{item.title || item.name}</div>
                        <div className="search-meta">{item.project_type} • {item.primary_category || item.loader_type || 'Без категории'}</div>
                      </div>
                    </div>
                    <div className="search-body">
                      <p>{item.description ? item.description.slice(0, 160) : 'Описание отсутствует.'}</p>
                      <div className="search-tags">
                        {Array.isArray(item.categories) && item.categories.slice(0, 4).map((category: any) => (
                          <span key={category} className="tag">{category}</span>
                        ))}
                      </div>
                    </div>
                    <div className="search-footer">
                      <div>
                        <span className="small-text">Загрузки: {item.downloads ?? 0}</span>
                        <span className="small-text">   Версий: {item.versions?.length ?? 0}</span>
                      </div>
                      <button className="outline-button" onClick={() => installModrinthProject(item.slug)} disabled={modrinthLoading}>Установить</button>
                    </div>
                  </article>
                ))}
              </div>

              {modrinthTotalHits > 20 && (
                <div className="pagination" style={{ marginTop: 16 }}>
                  <button className="pagination-btn" disabled={modrinthPage <= 1 || modrinthLoading} onClick={() => searchModrinth(modrinthPage - 1)}>‹ Назад</button>
                  <div className="pagination-info">Страница {modrinthPage} из {Math.ceil(modrinthTotalHits / 20)}</div>
                  <button className="pagination-btn" disabled={modrinthPage >= Math.ceil(modrinthTotalHits / 20) || modrinthLoading} onClick={() => searchModrinth(modrinthPage + 1)}>Вперёд ›</button>
                </div>
              )}
            </div>

            <div className="panel panel small">
              <div className="panel-title">Установленные дополнения</div>
              <div className="installed-list">
                {modrinthInstalledAddons.length === 0 && <div className="hint">Пока нет установленных модов/шейдеров/ресурсов.</div>}
                {modrinthInstalledAddons.map((addon) => (
                  <div key={addon.id} className="installed-item">
                    <span>{addon.name}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button className="outline-button" onClick={async () => {
                        await window.launcher.toggleInstalledAddon(addon.type, addon.name, !addon.enabled)
                        await loadModrinthState()
                      }}>
                        {addon.enabled ? 'Отключить' : 'Включить'}
                      </button>
                      <button className="outline-button delete-button" onClick={async () => {
                        const confirmed = await showConfirm(`Удалить ${addon.name}?`)
                        if (!confirmed) return
                        await window.launcher.deleteInstalledAddon(addon.type, addon.name)
                        await loadModrinthState()
                      }}>
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'Settings' && (
          <section className="settings-grid">
            <div className="panel large">
              <div className="panel-title">Настройки</div>
              <div className="form-grid">
                <label>
                  Акцент
                  <div style={{ marginTop: 8 }}>
                    <CustomSelect
                      options={[
                        { value: 'red', label: 'Красный' },
                        { value: 'violet', label: 'Фиолетовый' },
                        { value: 'white', label: 'Белый' }
                      ]}
                      value={settings.accent || 'red'}
                      onChange={(val: string) => setSettings({ ...settings, accent: val as 'red' | 'violet' | 'white' })}
                      placeholder="Выберите акцент"
                    />
                  </div>
                </label>
                <label>
                  Тема
                  <div style={{ marginTop: 8 }}>
                    <CustomSelect
                      options={[{ value: 'dark', label: 'Тёмная' }, { value: 'light', label: 'Светлая' }]}
                      value={settings.theme}
                      onChange={(val: string) => setSettings({ ...settings, theme: val as Settings['theme'] })}
                      placeholder="Выберите тему"
                    />
                  </div>
                </label>
                <label>
                  Путь к Java
                  <input value={settings.javaPath} onChange={(e) => setSettings({ ...settings, javaPath: e.target.value })} />
                </label>
                <label>
                  Память (RAM)
                  <div style={{ marginTop: 8 }}>
                    <CustomSelect
                      options={ramOptions}
                      value={settings.ram || 'auto'}
                      onChange={(val: string) => setSettings({ ...settings, ram: val })}
                      placeholder="Выберите память"
                    />
                  </div>
                </label>
                <button className="button" onClick={handleSaveSettings}>Сохранить настройки</button>
              </div>
            </div>

            <div className="panel small auth-panel">
              <div className="panel-title">Авторизация</div>
              <label>
                Email
                <input value={loginState.email} onChange={(e) => setLoginState({ ...loginState, email: e.target.value })} />
              </label>
              <label>
                Пароль
                <input type="password" value={loginState.password} onChange={(e) => setLoginState({ ...loginState, password: e.target.value })} />
              </label>
              <div className="button-row">
                <button className="outline-button" onClick={() => setRegisterMode(!registerMode)}>{registerMode ? 'Войти' : 'Регистрация'}</button>
                <button className="button" onClick={handleLogin}>{registerMode ? 'Зарегистрироваться' : 'Войти'}</button>
              </div>
              <p className="hint">Локальная авторизация хранится безопасно в хранилище KuroLauncher.</p>
            </div>
          </section>
        )}
      </main>

      {/* Custom Confirm/Alert Dialog */}
      {confirmDialog && (
        <div className="modal-overlay" onClick={() => confirmDialog!.onCancel?.()}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{confirmDialog!.onCancel ? 'Подтверждение' : 'Внимание'}</h3>
            <p>{confirmDialog!.message}</p>
            <div className="modal-actions">
              {confirmDialog!.onCancel && (
                <button className="outline-button" onClick={() => confirmDialog!.onCancel?.()}>Отмена</button>
              )}
              <button className="btn btn-primary" onClick={() => confirmDialog!.onConfirm()}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
